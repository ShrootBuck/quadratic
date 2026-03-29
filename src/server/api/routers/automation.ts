import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

// Enums for validation
const AutomationTrigger = z.enum([
	"ISSUE_CREATED",
	"ISSUE_UPDATED",
	"STATUS_CHANGED",
	"ASSIGNEE_CHANGED",
	"PRIORITY_CHANGED",
]);

const Priority = z.enum(["NO_PRIORITY", "LOW", "MEDIUM", "HIGH", "URGENT"]);
const IssueStatus = z.enum([
	"BACKLOG",
	"TODO",
	"IN_PROGRESS",
	"DONE",
	"CANCELLED",
]);

// Condition schema
const conditionSchema = z.object({
	field: z.enum(["team", "project", "label", "priority"]),
	op: z.enum(["equals", "not_equals", "contains", "not_contains"]),
	value: z.string(),
});

// Action schema
const actionSchema = z.object({
	type: z.enum([
		"change_status",
		"change_assignee",
		"add_label",
		"remove_label",
		"update_priority",
		"send_notification",
	]),
	params: z.record(z.string(), z.any()),
});

// Create automation input
const createAutomationInput = z.object({
	name: z.string().min(1).max(100),
	description: z.string().optional(),
	trigger: AutomationTrigger,
	conditions: z.array(conditionSchema).default([]),
	actions: z.array(actionSchema).min(1),
	teamId: z.string().optional(),
	enabled: z.boolean().default(true),
});

// Update automation input
const updateAutomationInput = z.object({
	id: z.string(),
	name: z.string().min(1).max(100).optional(),
	description: z.string().optional(),
	trigger: AutomationTrigger.optional(),
	conditions: z.array(conditionSchema).optional(),
	actions: z.array(actionSchema).optional(),
	teamId: z.string().optional().nullable(),
	enabled: z.boolean().optional(),
});

// List automations input
const listAutomationsInput = z.object({
	workspaceId: z.string(),
	teamId: z.string().optional(),
	enabled: z.boolean().optional(),
});

export const automationRouter = createTRPCRouter({
	// Create a new automation rule
	create: protectedProcedure
		.input(createAutomationInput)
		.mutation(async ({ ctx, input }) => {
			// Get user's workspace
			const membership = await ctx.db.workspaceMember.findFirst({
				where: { userId: ctx.session.user.id },
				include: { workspace: true },
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a member of any workspace",
				});
			}

			// If teamId is provided, verify it belongs to the workspace
			if (input.teamId) {
				const team = await ctx.db.team.findFirst({
					where: {
						id: input.teamId,
						workspaceId: membership.workspaceId,
					},
				});

				if (!team) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Team not found in workspace",
					});
				}
			}

			const automation = await ctx.db.automationRule.create({
				data: {
					name: input.name,
					description: input.description,
					trigger: input.trigger,
					conditions: JSON.stringify(input.conditions),
					actions: JSON.stringify(input.actions),
					enabled: input.enabled,
					workspaceId: membership.workspaceId,
					teamId: input.teamId || null,
				},
			});

			return automation;
		}),

	// Get automation by ID
	byId: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const automation = await ctx.db.automationRule.findUnique({
				where: { id: input.id },
				include: {
					team: {
						select: { id: true, name: true, key: true },
					},
					logs: {
						orderBy: { executedAt: "desc" },
						take: 10,
						select: {
							id: true,
							status: true,
							error: true,
							executedAt: true,
							issueId: true,
						},
					},
				},
			});

			if (!automation) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Automation rule not found",
				});
			}

			// Check user has access to workspace
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: automation.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this automation",
				});
			}

			return {
				...automation,
				conditions: JSON.parse(automation.conditions),
				actions: JSON.parse(automation.actions),
			};
		}),

	// List automation rules
	list: protectedProcedure
		.input(listAutomationsInput)
		.query(async ({ ctx, input }) => {
			// Verify user has access to workspace
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: input.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this workspace",
				});
			}

			const automations = await ctx.db.automationRule.findMany({
				where: {
					workspaceId: input.workspaceId,
					...(input.teamId ? { teamId: input.teamId } : {}),
					...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
				},
				include: {
					team: {
						select: { id: true, name: true, key: true },
					},
					_count: {
						select: { logs: true },
					},
				},
				orderBy: { createdAt: "desc" },
			});

			return automations.map((automation) => ({
				...automation,
				conditions: JSON.parse(automation.conditions),
				actions: JSON.parse(automation.actions),
			}));
		}),

	// Update automation rule
	update: protectedProcedure
		.input(updateAutomationInput)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.automationRule.findUnique({
				where: { id: input.id },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Automation rule not found",
				});
			}

			// Check user has access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: existing.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to update this automation",
				});
			}

			// If teamId is changing, verify the new team
			if (input.teamId !== undefined && input.teamId !== null) {
				const team = await ctx.db.team.findFirst({
					where: {
						id: input.teamId,
						workspaceId: existing.workspaceId,
					},
				});

				if (!team) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Team not found in workspace",
					});
				}
			}

			const updated = await ctx.db.automationRule.update({
				where: { id: input.id },
				data: {
					...(input.name !== undefined && { name: input.name }),
					...(input.description !== undefined && {
						description: input.description,
					}),
					...(input.trigger !== undefined && { trigger: input.trigger }),
					...(input.conditions !== undefined && {
						conditions: JSON.stringify(input.conditions),
					}),
					...(input.actions !== undefined && {
						actions: JSON.stringify(input.actions),
					}),
					...(input.enabled !== undefined && { enabled: input.enabled }),
					...(input.teamId !== undefined && { teamId: input.teamId }),
				},
			});

			return {
				...updated,
				conditions: JSON.parse(updated.conditions),
				actions: JSON.parse(updated.actions),
			};
		}),

	// Delete automation rule
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.automationRule.findUnique({
				where: { id: input.id },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Automation rule not found",
				});
			}

			// Check user has access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: existing.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to delete this automation",
				});
			}

			await ctx.db.automationRule.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	// Toggle automation enabled status
	toggle: protectedProcedure
		.input(z.object({ id: z.string(), enabled: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.automationRule.findUnique({
				where: { id: input.id },
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Automation rule not found",
				});
			}

			// Check user has access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: existing.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this automation",
				});
			}

			const updated = await ctx.db.automationRule.update({
				where: { id: input.id },
				data: { enabled: input.enabled },
			});

			return updated;
		}),

	// Get automation execution logs
	logs: protectedProcedure
		.input(
			z.object({
				automationId: z.string().optional(),
				workspaceId: z.string(),
				limit: z.number().min(1).max(100).default(50),
				offset: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			// Verify user has access to workspace
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: input.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this workspace",
				});
			}

			const [logs, totalCount] = await Promise.all([
				ctx.db.automationLog.findMany({
					where: {
						workspaceId: input.workspaceId,
						...(input.automationId ? { ruleId: input.automationId } : {}),
					},
					include: {
						rule: {
							select: { id: true, name: true },
						},
					},
					orderBy: { executedAt: "desc" },
					skip: input.offset,
					take: input.limit,
				}),
				ctx.db.automationLog.count({
					where: {
						workspaceId: input.workspaceId,
						...(input.automationId ? { ruleId: input.automationId } : {}),
					},
				}),
			]);

			return {
				logs: logs.map((log) => ({
					...log,
					inputData: JSON.parse(log.inputData),
					outputData: log.outputData ? JSON.parse(log.outputData) : null,
				})),
				totalCount,
				hasMore: input.offset + input.limit < totalCount,
			};
		}),

	// Get built-in automation templates
	templates: protectedProcedure.query(async () => {
		return [
			{
				id: "auto-assign-creator",
				name: "Auto-assign to Creator",
				description:
					"Automatically assign issues to their creator when they are created",
				trigger: "ISSUE_CREATED",
				conditions: [],
				actions: [
					{
						type: "change_assignee",
						params: { assignee: "{{creatorId}}" },
					},
				],
			},
			{
				id: "move-backlog-unassigned",
				name: "Move to Backlog when Unassigned",
				description: "Move issues to Backlog status when they are unassigned",
				trigger: "ASSIGNEE_CHANGED",
				conditions: [],
				actions: [
					{
						type: "change_status",
						params: { status: "BACKLOG" },
					},
				],
			},
			{
				id: "high-priority-label",
				name: "Add Label to High Priority",
				description:
					"Add 'urgent' label when priority is set to High or Urgent",
				trigger: "PRIORITY_CHANGED",
				conditions: [
					{
						field: "priority",
						op: "equals",
						value: "HIGH",
					},
				],
				actions: [
					{
						type: "add_label",
						params: { labelName: "urgent" },
					},
				],
			},
		];
	}),
});

// Automation execution function - to be called from issue operations
export async function executeAutomations({
	trigger,
	workspaceId,
	issueId,
	data,
}: {
	trigger: string;
	workspaceId: string;
	issueId: string;
	data: Record<string, unknown>;
}) {
	try {
		// Find all enabled automation rules for this trigger and workspace
		const rules = await db.automationRule.findMany({
			where: {
				workspaceId,
				trigger: trigger as z.infer<typeof AutomationTrigger>,
				enabled: true,
			},
		});

		for (const rule of rules) {
			try {
				const conditions = JSON.parse(rule.conditions) as Array<{
					field: string;
					op: string;
					value: string;
				}>;
				const actions = JSON.parse(rule.actions) as Array<{
					type: string;
					params: Record<string, unknown>;
				}>;

				// Check if conditions are met
				let conditionsMet = true;
				for (const condition of conditions) {
					const value = data[condition.field];
					switch (condition.op) {
						case "equals":
							if (value !== condition.value) conditionsMet = false;
							break;
						case "not_equals":
							if (value === condition.value) conditionsMet = false;
							break;
						case "contains":
							if (!String(value).includes(condition.value))
								conditionsMet = false;
							break;
						case "not_contains":
							if (String(value).includes(condition.value))
								conditionsMet = false;
							break;
					}
					if (!conditionsMet) break;
				}

				if (!conditionsMet) {
					// Log skipped execution
					await db.automationLog.create({
						data: {
							ruleId: rule.id,
							workspaceId,
							issueId,
							status: "SKIPPED",
							inputData: JSON.stringify(data),
							outputData: JSON.stringify({ reason: "Conditions not met" }),
						},
					});
					continue;
				}

				// Execute actions
				const results = [];
				for (const action of actions) {
					const result = await executeAction(
						action.type,
						action.params,
						issueId,
						data,
					);
					results.push({ type: action.type, result });
				}

				// Log successful execution
				await db.automationLog.create({
					data: {
						ruleId: rule.id,
						workspaceId,
						issueId,
						status: "SUCCESS",
						inputData: JSON.stringify(data),
						outputData: JSON.stringify(results),
					},
				});
			} catch (error) {
				// Log failed execution
				await db.automationLog.create({
					data: {
						ruleId: rule.id,
						workspaceId,
						issueId,
						status: "FAILED",
						inputData: JSON.stringify(data),
						error: error instanceof Error ? error.message : "Unknown error",
					},
				});
			}
		}
	} catch (error) {
		console.error("Error executing automations:", error);
	}
}

async function executeAction(
	type: string,
	params: Record<string, unknown>,
	issueId: string,
	contextData: Record<string, unknown>,
) {
	switch (type) {
		case "change_status":
			if (params.status) {
				await db.issue.update({
					where: { id: issueId },
					data: { status: params.status as z.infer<typeof IssueStatus> },
				});
				return {
					success: true,
					action: "change_status",
					newStatus: params.status,
				};
			}
			break;

		case "change_assignee": {
			let assigneeId = params.assigneeId as string | undefined;
			if (params.assignee === "{{creatorId}}") {
				assigneeId = contextData.creatorId as string;
			}
			await db.issue.update({
				where: { id: issueId },
				data: { assigneeId: assigneeId || null },
			});
			return { success: true, action: "change_assignee", assigneeId };
		}

		case "update_priority":
			if (params.priority) {
				await db.issue.update({
					where: { id: issueId },
					data: { priority: params.priority as z.infer<typeof Priority> },
				});
				return {
					success: true,
					action: "update_priority",
					priority: params.priority,
				};
			}
			break;

		case "add_label": {
			const labelId = params.labelId as string;
			if (labelId) {
				// Check if label exists on issue
				const existing = await db.issueLabel.findFirst({
					where: { issueId, labelId },
				});
				if (!existing) {
					await db.issueLabel.create({
						data: { issueId, labelId },
					});
				}
				return { success: true, action: "add_label", labelId };
			}
			break;
		}

		case "remove_label": {
			const labelId = params.labelId as string;
			if (labelId) {
				await db.issueLabel.deleteMany({
					where: { issueId, labelId },
				});
				return { success: true, action: "remove_label", labelId };
			}
			break;
		}

		case "send_notification": {
			// Notifications are handled separately, just log it
			return {
				success: true,
				action: "send_notification",
				message: params.message,
			};
		}
	}

	return {
		success: false,
		action: type,
		error: "Invalid action or parameters",
	};
}
