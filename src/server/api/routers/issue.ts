import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { executeAutomations } from "~/server/api/routers/automation";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { realtimeManager } from "~/server/realtime/manager";

// Enums for validation
const IssueStatus = z.enum([
	"BACKLOG",
	"TODO",
	"IN_PROGRESS",
	"DONE",
	"CANCELLED",
]);
const Priority = z.enum(["NO_PRIORITY", "LOW", "MEDIUM", "HIGH", "URGENT"]);

// Comment schemas
const createCommentInput = z.object({
	issueId: z.string(),
	content: z.string().min(1),
});

const updateCommentInput = z.object({
	id: z.string(),
	content: z.string().min(1),
});

const deleteCommentInput = z.object({
	id: z.string(),
});

// Common schemas
const issueIdSchema = z.object({
	id: z.string(),
});

const createIssueInput = z.object({
	title: z.string().min(1).max(500),
	description: z.string().optional(),
	teamId: z.string(),
	projectId: z.string().optional(),
	cycleId: z.string().optional(),
	assigneeId: z.string().optional(),
	priority: Priority.default("NO_PRIORITY"),
	labelIds: z.array(z.string()).default([]),
	status: IssueStatus.default("BACKLOG"),
	dueDate: z.date().optional(),
});

const updateIssueInput = z.object({
	id: z.string(),
	title: z.string().min(1).max(500).optional(),
	description: z.string().optional(),
	projectId: z.string().optional().nullable(),
	cycleId: z.string().optional().nullable(),
	assigneeId: z.string().optional().nullable(),
	priority: Priority.optional(),
	status: IssueStatus.optional(),
	dueDate: z.date().optional().nullable(),
	labelIds: z.array(z.string()).optional(),
});

const listIssuesInput = z.object({
	workspaceId: z.string(),
	teamId: z.string().optional(),
	projectId: z.string().optional(),
	cycleId: z.string().optional(),
	assigneeId: z.string().optional(),
	status: IssueStatus.optional(),
	priority: Priority.optional(),
	labelIds: z.array(z.string()).optional(),
	search: z.string().optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	customFieldFilters: z.record(z.unknown()).optional(), // { customFieldId: value }
});

export const issueRouter = createTRPCRouter({
	// Create a new issue
	create: protectedProcedure
		.input(createIssueInput)
		.mutation(async ({ ctx, input }) => {
			// Verify user has access to the team
			const team = await ctx.db.team.findUnique({
				where: { id: input.teamId },
				include: { workspace: true },
			});

			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found",
				});
			}

			// Check workspace membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: team.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this workspace",
				});
			}

			// Verify project exists and belongs to team if provided
			if (input.projectId) {
				const project = await ctx.db.project.findUnique({
					where: { id: input.projectId },
				});

				if (!project || project.teamId !== input.teamId) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Project not found",
					});
				}
			}

			// Verify cycle exists and belongs to team if provided
			if (input.cycleId) {
				const cycle = await ctx.db.cycle.findUnique({
					where: { id: input.cycleId },
				});

				if (!cycle || cycle.teamId !== input.teamId) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Cycle not found",
					});
				}
			}

			// Get the next issue number for this team
			const lastIssue = await ctx.db.issue.findFirst({
				where: { teamId: input.teamId },
				orderBy: { number: "desc" },
			});

			const nextNumber = (lastIssue?.number ?? 0) + 1;
			const identifier = `${team.key}-${nextNumber}`;

			// Create the issue in a transaction
			const issue = await ctx.db.$transaction(async (tx) => {
				// Create the issue
				const newIssue = await tx.issue.create({
					data: {
						identifier,
						number: nextNumber,
						title: input.title,
						description: input.description,
						status: input.status,
						priority: input.priority,
						dueDate: input.dueDate,
						workspaceId: team.workspaceId,
						teamId: input.teamId,
						projectId: input.projectId,
						cycleId: input.cycleId,
						assigneeId: input.assigneeId,
						creatorId: ctx.session.user.id,
						labels: {
							create: input.labelIds.map((labelId) => ({
								label: { connect: { id: labelId } },
							})),
						},
					},
					include: {
						team: true,
						project: true,
						cycle: true,
						assignee: true,
						creator: true,
						labels: {
							include: {
								label: true,
							},
						},
						comments: {
							include: {
								author: true,
							},
						},
						history: {
							include: {
								actor: true,
							},
							orderBy: { createdAt: "desc" },
						},
					},
				});

				// Create initial history entry
				await tx.issueHistory.create({
					data: {
						issueId: newIssue.id,
						actorId: ctx.session.user.id,
						field: "created",
						newValue: JSON.stringify({ title: input.title }),
					},
				});

				return newIssue;
			});

			// Send notification if issue is assigned to someone
			if (issue.assigneeId && issue.assigneeId !== ctx.session.user.id) {
				await ctx.db.notification.create({
					data: {
						type: "ASSIGNED",
						title: `assigned you to ${issue.identifier}`,
						content: issue.title,
						workspaceId: issue.workspaceId,
						userId: issue.assigneeId,
						issueId: issue.id,
						actorId: ctx.session.user.id,
					},
				});

				// Notify via realtime
				realtimeManager.notifyNewNotification(
					issue.workspaceId,
					issue.assigneeId,
					{
						type: "ASSIGNED",
						title: `assigned you to ${issue.identifier}`,
						issueId: issue.id,
					},
				);

				// Update notification count
				const unreadCount = await ctx.db.notification.count({
					where: {
						userId: issue.assigneeId,
						workspaceId: issue.workspaceId,
						read: false,
					},
				});
				realtimeManager.notifyNotificationCountUpdate(
					issue.workspaceId,
					issue.assigneeId,
					unreadCount,
				);
			}

			// Broadcast issue creation to all clients in workspace
			realtimeManager.notifyIssueCreated(
				issue.workspaceId,
				issue,
				ctx.session.user.id,
			);

			// Execute automations
			void executeAutomations({
				trigger: "ISSUE_CREATED",
				workspaceId: issue.workspaceId,
				issueId: issue.id,
				data: {
					issueId: issue.id,
					title: issue.title,
					status: issue.status,
					priority: issue.priority,
					assigneeId: issue.assigneeId,
					creatorId: issue.creatorId,
					teamId: issue.teamId,
					projectId: issue.projectId,
					labelIds: issue.labels.map((l) => l.labelId),
				},
			});

			return issue;
		}),

	// Get issue by ID with all relations
	byId: protectedProcedure
		.input(issueIdSchema)
		.query(async ({ ctx, input }) => {
			const issue = await ctx.db.issue.findUnique({
				where: { id: input.id },
				include: {
					team: true,
					project: true,
					cycle: true,
					assignee: true,
					creator: true,
					workspace: true,
					labels: {
						include: {
							label: true,
						},
					},
					comments: {
						include: {
							author: true,
						},
						orderBy: { createdAt: "asc" },
					},
					history: {
						include: {
							actor: true,
						},
						orderBy: { createdAt: "desc" },
					},
					customFieldValues: {
						include: {
							customField: true,
						},
					},
				},
			});

			if (!issue) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Issue not found",
				});
			}

			// Check access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: issue.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this issue",
				});
			}

			return {
				...issue,
				customFieldValues: issue.customFieldValues.map((v) => ({
					...v,
					value: JSON.parse(v.value),
				})),
			};
		}),

	// Update an issue
	update: protectedProcedure
		.input(updateIssueInput)
		.mutation(async ({ ctx, input }) => {
			const { id, labelIds, ...updateData } = input;

			// Get the existing issue
			const existingIssue = await ctx.db.issue.findUnique({
				where: { id },
			});

			if (!existingIssue) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Issue not found",
				});
			}

			// Check access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: existingIssue.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this issue",
				});
			}

			// Track changes for history and notifications
			const changes: {
				field: string;
				oldValue: string | null;
				newValue: string;
			}[] = [];

			if (
				updateData.title !== undefined &&
				updateData.title !== existingIssue.title
			) {
				changes.push({
					field: "title",
					oldValue: existingIssue.title,
					newValue: updateData.title,
				});
			}

			if (
				updateData.status !== undefined &&
				updateData.status !== existingIssue.status
			) {
				changes.push({
					field: "status",
					oldValue: String(existingIssue.status),
					newValue: String(updateData.status),
				});
			}

			if (
				updateData.priority !== undefined &&
				updateData.priority !== existingIssue.priority
			) {
				changes.push({
					field: "priority",
					oldValue: String(existingIssue.priority),
					newValue: String(updateData.priority),
				});
			}

			if (
				updateData.assigneeId !== undefined &&
				updateData.assigneeId !== existingIssue.assigneeId
			) {
				changes.push({
					field: "assigneeId",
					oldValue: existingIssue.assigneeId,
					newValue: updateData.assigneeId ?? "null",
				});
			}

			if (
				updateData.projectId !== undefined &&
				updateData.projectId !== existingIssue.projectId
			) {
				changes.push({
					field: "projectId",
					oldValue: existingIssue.projectId,
					newValue: updateData.projectId ?? "null",
				});
			}

			if (
				updateData.cycleId !== undefined &&
				updateData.cycleId !== existingIssue.cycleId
			) {
				changes.push({
					field: "cycleId",
					oldValue: existingIssue.cycleId,
					newValue: updateData.cycleId ?? "null",
				});
			}

			// Update in transaction with history tracking
			const updatedIssue = await ctx.db.$transaction(async (tx) => {
				// Update the issue
				const issue = await tx.issue.update({
					where: { id },
					data: {
						...updateData,
						labels:
							labelIds !== undefined
								? {
										deleteMany: {},
										create: labelIds.map((labelId) => ({
											label: { connect: { id: labelId } },
										})),
									}
								: undefined,
					},
					include: {
						team: true,
						project: true,
						cycle: true,
						assignee: true,
						creator: true,
						labels: {
							include: {
								label: true,
							},
						},
						comments: {
							include: {
								author: true,
							},
							orderBy: { createdAt: "asc" },
						},
						history: {
							include: {
								actor: true,
							},
							orderBy: { createdAt: "desc" },
						},
					},
				});

				// Create history entries for all changes
				for (const change of changes) {
					await tx.issueHistory.create({
						data: {
							issueId: id,
							actorId: ctx.session.user.id,
							field: change.field,
							oldValue: change.oldValue
								? JSON.stringify({ value: change.oldValue })
								: null,
							newValue: JSON.stringify({ value: change.newValue }),
						},
					});
				}

				return issue;
			});

			// Send notifications for relevant changes
			for (const change of changes) {
				// Notify on assignee change
				if (change.field === "assigneeId" && updateData.assigneeId) {
					// Don't notify if assigning to self
					if (updateData.assigneeId !== ctx.session.user.id) {
						await ctx.db.notification.create({
							data: {
								type: "ASSIGNED",
								title: `assigned you to ${updatedIssue.identifier}`,
								content: updatedIssue.title,
								workspaceId: updatedIssue.workspaceId,
								userId: updateData.assigneeId,
								issueId: updatedIssue.id,
								actorId: ctx.session.user.id,
							},
						});

						// Realtime notification
						realtimeManager.notifyNewNotification(
							updatedIssue.workspaceId,
							updateData.assigneeId,
							{
								type: "ASSIGNED",
								title: `assigned you to ${updatedIssue.identifier}`,
								issueId: updatedIssue.id,
							},
						);

						const unreadCount = await ctx.db.notification.count({
							where: {
								userId: updateData.assigneeId,
								workspaceId: updatedIssue.workspaceId,
								read: false,
							},
						});
						realtimeManager.notifyNotificationCountUpdate(
							updatedIssue.workspaceId,
							updateData.assigneeId,
							unreadCount,
						);
					}
				}

				// Notify creator on status change
				if (change.field === "status" && updateData.status) {
					if (existingIssue.creatorId !== ctx.session.user.id) {
						await ctx.db.notification.create({
							data: {
								type: "STATUS_CHANGED",
								title: `changed status to ${updateData.status}`,
								content: updatedIssue.title,
								workspaceId: updatedIssue.workspaceId,
								userId: existingIssue.creatorId,
								issueId: updatedIssue.id,
								actorId: ctx.session.user.id,
							},
						});
					}
				}
			}

			// Broadcast issue update to all clients in workspace
			realtimeManager.notifyIssueUpdated(
				updatedIssue.workspaceId,
				updatedIssue.id,
				{
					title: updatedIssue.title,
					status: updatedIssue.status,
					priority: updatedIssue.priority,
					assigneeId: updatedIssue.assigneeId,
					...changes,
				},
				ctx.session.user.id,
			);

			// Execute automations based on changes
			const automationData = {
				issueId: updatedIssue.id,
				title: updatedIssue.title,
				status: updatedIssue.status,
				priority: updatedIssue.priority,
				assigneeId: updatedIssue.assigneeId,
				creatorId: updatedIssue.creatorId,
				teamId: updatedIssue.teamId,
				projectId: updatedIssue.projectId,
				labelIds: updatedIssue.labels.map((l) => l.labelId),
			};

			// General issue update automation
			void executeAutomations({
				trigger: "ISSUE_UPDATED",
				workspaceId: updatedIssue.workspaceId,
				issueId: updatedIssue.id,
				data: automationData,
			});

			// Specific field change automations
			for (const change of changes) {
				if (change.field === "status") {
					void executeAutomations({
						trigger: "STATUS_CHANGED",
						workspaceId: updatedIssue.workspaceId,
						issueId: updatedIssue.id,
						data: { ...automationData, oldStatus: change.oldValue },
					});
				}
				if (change.field === "assigneeId") {
					void executeAutomations({
						trigger: "ASSIGNEE_CHANGED",
						workspaceId: updatedIssue.workspaceId,
						issueId: updatedIssue.id,
						data: { ...automationData, oldAssigneeId: change.oldValue },
					});
				}
				if (change.field === "priority") {
					void executeAutomations({
						trigger: "PRIORITY_CHANGED",
						workspaceId: updatedIssue.workspaceId,
						issueId: updatedIssue.id,
						data: { ...automationData, oldPriority: change.oldValue },
					});
				}
			}

			return updatedIssue;
		}),

	// Delete (archive) an issue
	delete: protectedProcedure
		.input(issueIdSchema)
		.mutation(async ({ ctx, input }) => {
			const issue = await ctx.db.issue.findUnique({
				where: { id: input.id },
			});

			if (!issue) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Issue not found",
				});
			}

			// Check access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: issue.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this issue",
				});
			}

			// For now, we'll delete the issue. In the future, we might want to archive instead.
			await ctx.db.issue.delete({
				where: { id: input.id },
			});

			// Broadcast issue deletion to all clients in workspace
			realtimeManager.notifyIssueDeleted(
				issue.workspaceId,
				input.id,
				ctx.session.user.id,
			);

			return { success: true };
		}),

	// List issues with filtering
	list: protectedProcedure
		.input(listIssuesInput)
		.query(async ({ ctx, input }) => {
			const {
				workspaceId,
				teamId,
				projectId,
				cycleId,
				assigneeId,
				status,
				priority,
				labelIds,
				search,
				limit,
				offset,
				customFieldFilters,
			} = input;

			// Verify workspace access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this workspace",
				});
			}

			// Build the where clause
			const where: Record<string, unknown> = {
				workspaceId,
			};

			if (teamId) {
				where.teamId = teamId;
			}

			if (projectId) {
				where.projectId = projectId;
			}

			if (cycleId) {
				where.cycleId = cycleId;
			}

			if (assigneeId) {
				where.assigneeId = assigneeId;
			}

			if (status) {
				where.status = status;
			}

			if (priority) {
				where.priority = priority;
			}

			if (labelIds && labelIds.length > 0) {
				where.labels = {
					some: {
						labelId: {
							in: labelIds,
						},
					},
				};
			}

			if (search) {
				where.OR = [
					{ title: { contains: search, mode: "insensitive" } },
					{ identifier: { contains: search, mode: "insensitive" } },
				];
			}

			// Handle custom field filtering
			if (customFieldFilters && Object.keys(customFieldFilters).length > 0) {
				// Get all issues with their custom field values first
				const issuesWithFields = await ctx.db.issue.findMany({
					where,
					include: {
						customFieldValues: {
							include: {
								customField: true,
							},
						},
					},
				});

				// Filter issues based on custom field values
				const filteredIssueIds = issuesWithFields
					.filter((issue) => {
						return Object.entries(customFieldFilters).every(
							([fieldId, filterValue]) => {
								const fieldValue = issue.customFieldValues.find(
									(v) => v.customFieldId === fieldId,
								);
								if (!fieldValue) return false;

								const parsedValue = JSON.parse(fieldValue.value);

								// Handle different filter types
								if (Array.isArray(filterValue)) {
									// For multi-select, check if any value matches
									if (Array.isArray(parsedValue)) {
										return filterValue.some((v) => parsedValue.includes(v));
									}
									return filterValue.includes(parsedValue);
								}

								// For single value match
								return parsedValue === filterValue;
							},
						);
					})
					.map((issue) => issue.id);

				// Update where clause to only include filtered issues
				where.id = {
					in: filteredIssueIds,
				};
			}

			// Get total count for pagination
			const total = await ctx.db.issue.count({ where });

			// Get the issues
			const issues = await ctx.db.issue.findMany({
				where,
				include: {
					team: true,
					project: true,
					cycle: true,
					assignee: true,
					creator: true,
					labels: {
						include: {
							label: true,
						},
					},
					customFieldValues: {
						include: {
							customField: true,
						},
					},
				},
				orderBy: [{ createdAt: "desc" }],
				skip: offset,
				take: limit,
			});

			return {
				issues: issues.map((issue) => ({
					...issue,
					customFieldValues: issue.customFieldValues.map((v) => ({
						...v,
						value: JSON.parse(v.value),
					})),
				})),
				pagination: {
					total,
					limit,
					offset,
					hasMore: offset + issues.length < total,
				},
			};
		}),

	// Comment procedures
	createComment: protectedProcedure
		.input(createCommentInput)
		.mutation(async ({ ctx, input }) => {
			// Verify issue exists and user has access
			const issue = await ctx.db.issue.findUnique({
				where: { id: input.issueId },
			});

			if (!issue) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Issue not found",
				});
			}

			// Check workspace access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: issue.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this issue",
				});
			}

			// Create comment and history entry in transaction
			const [comment] = await ctx.db.$transaction(async (tx) => {
				const newComment = await tx.comment.create({
					data: {
						content: input.content,
						issueId: input.issueId,
						authorId: ctx.session.user.id,
					},
					include: {
						author: true,
					},
				});

				await tx.issueHistory.create({
					data: {
						issueId: input.issueId,
						actorId: ctx.session.user.id,
						field: "comment",
						newValue: JSON.stringify({ commentId: newComment.id }),
					},
				});

				return [newComment];
			});

			// Notify issue creator if it's not the commenter
			if (issue.creatorId !== ctx.session.user.id) {
				await ctx.db.notification.create({
					data: {
						type: "COMMENTED",
						title: `commented on ${issue.identifier}`,
						content: issue.title,
						workspaceId: issue.workspaceId,
						userId: issue.creatorId,
						issueId: issue.id,
						actorId: ctx.session.user.id,
					},
				});
			}

			// Notify assignee if different from creator and commenter
			if (
				issue.assigneeId &&
				issue.assigneeId !== issue.creatorId &&
				issue.assigneeId !== ctx.session.user.id
			) {
				await ctx.db.notification.create({
					data: {
						type: "COMMENTED",
						title: `commented on ${issue.identifier}`,
						content: issue.title,
						workspaceId: issue.workspaceId,
						userId: issue.assigneeId,
						issueId: issue.id,
						actorId: ctx.session.user.id,
					},
				});
			}

			return comment;
		}),

	updateComment: protectedProcedure
		.input(updateCommentInput)
		.mutation(async ({ ctx, input }) => {
			const comment = await ctx.db.comment.findUnique({
				where: { id: input.id },
			});

			if (!comment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Comment not found",
				});
			}

			// Only the author can edit their comment
			if (comment.authorId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only edit your own comments",
				});
			}

			const updatedComment = await ctx.db.comment.update({
				where: { id: input.id },
				data: {
					content: input.content,
				},
				include: {
					author: true,
				},
			});

			return updatedComment;
		}),

	deleteComment: protectedProcedure
		.input(deleteCommentInput)
		.mutation(async ({ ctx, input }) => {
			const comment = await ctx.db.comment.findUnique({
				where: { id: input.id },
				include: {
					issue: true,
				},
			});

			if (!comment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Comment not found",
				});
			}

			// Only the author or workspace admin can delete
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: comment.issue.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (
				comment.authorId !== ctx.session.user.id &&
				membership?.role !== "ADMIN"
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only delete your own comments",
				});
			}

			await ctx.db.comment.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),
});
