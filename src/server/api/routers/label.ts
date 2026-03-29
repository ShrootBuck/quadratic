import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const createLabelInput = z.object({
	name: z.string().min(1).max(50),
	color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
	workspaceId: z.string(),
	teamId: z.string().optional(),
});

const updateLabelInput = z.object({
	id: z.string(),
	name: z.string().min(1).max(50).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
});

const labelIdSchema = z.object({
	id: z.string(),
});

const listLabelsInput = z.object({
	workspaceId: z.string(),
	teamId: z.string().optional(),
});

export const labelRouter = createTRPCRouter({
	// Create a new label
	create: protectedProcedure
		.input(createLabelInput)
		.mutation(async ({ ctx, input }) => {
			const { workspaceId, teamId, name, color } = input;

			// Check workspace membership
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

			// Check if label with same name already exists in workspace (case-insensitive)
			const existingLabels = await ctx.db.label.findMany({
				where: {
					workspaceId,
				},
			});

			const nameConflict = existingLabels.find(
				(l) => l.name.toLowerCase() === name.toLowerCase(),
			);

			if (nameConflict) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A label with this name already exists",
				});
			}

			// Verify team belongs to workspace if teamId is provided
			if (teamId) {
				const team = await ctx.db.team.findFirst({
					where: {
						id: teamId,
						workspaceId,
					},
				});

				if (!team) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Team not found",
					});
				}
			}

			const label = await ctx.db.label.create({
				data: {
					name,
					color,
					workspaceId,
					teamId,
				},
				include: {
					team: true,
					workspace: true,
				},
			});

			return label;
		}),

	// Get label by ID
	byId: protectedProcedure
		.input(labelIdSchema)
		.query(async ({ ctx, input }) => {
			const label = await ctx.db.label.findUnique({
				where: { id: input.id },
				include: {
					team: true,
					workspace: true,
					issueLabels: {
						include: {
							issue: {
								include: {
									team: true,
									assignee: true,
								},
							},
						},
					},
				},
			});

			if (!label) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Label not found",
				});
			}

			// Check workspace access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: label.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this label",
				});
			}

			return label;
		}),

	// Update a label
	update: protectedProcedure
		.input(updateLabelInput)
		.mutation(async ({ ctx, input }) => {
			const { id, name, color } = input;

			const existingLabel = await ctx.db.label.findUnique({
				where: { id },
			});

			if (!existingLabel) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Label not found",
				});
			}

			// Check workspace access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: existingLabel.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this label",
				});
			}

			// Check for name conflict if name is being updated (case-insensitive)
			if (name && name !== existingLabel.name) {
				const existingLabels = await ctx.db.label.findMany({
					where: {
						workspaceId: existingLabel.workspaceId,
						id: { not: id },
					},
				});

				const nameConflict = existingLabels.find(
					(l) => l.name.toLowerCase() === name.toLowerCase(),
				);

				if (nameConflict) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "A label with this name already exists",
					});
				}
			}

			const label = await ctx.db.label.update({
				where: { id },
				data: {
					...(name && { name }),
					...(color && { color }),
				},
				include: {
					team: true,
					workspace: true,
				},
			});

			return label;
		}),

	// Delete a label
	delete: protectedProcedure
		.input(labelIdSchema)
		.mutation(async ({ ctx, input }) => {
			const label = await ctx.db.label.findUnique({
				where: { id: input.id },
			});

			if (!label) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Label not found",
				});
			}

			// Check workspace access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: label.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this label",
				});
			}

			await ctx.db.label.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	// List labels
	list: protectedProcedure
		.input(listLabelsInput)
		.query(async ({ ctx, input }) => {
			const { workspaceId, teamId } = input;

			// Check workspace membership
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

			const where: Record<string, unknown> = {
				workspaceId,
			};

			if (teamId) {
				where.OR = [{ teamId }, { teamId: null }];
			}

			const labels = await ctx.db.label.findMany({
				where,
				include: {
					team: true,
				},
				orderBy: { name: "asc" },
			});

			// Get issue counts for each label
			const labelsWithCounts = await Promise.all(
				labels.map(async (label) => {
					const count = await ctx.db.issueLabel.count({
						where: { labelId: label.id },
					});
					return {
						...label,
						issueCount: count,
					};
				}),
			);

			return labelsWithCounts;
		}),

	// Add label to issue
	addToIssue: protectedProcedure
		.input(
			z.object({
				issueId: z.string(),
				labelId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { issueId, labelId } = input;

			// Verify issue exists
			const issue = await ctx.db.issue.findUnique({
				where: { id: issueId },
			});

			if (!issue) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Issue not found",
				});
			}

			// Verify label exists and belongs to same workspace
			const label = await ctx.db.label.findUnique({
				where: { id: labelId },
			});

			if (!label) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Label not found",
				});
			}

			if (label.workspaceId !== issue.workspaceId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Label does not belong to this workspace",
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

			// Check if already exists
			const existing = await ctx.db.issueLabel.findUnique({
				where: {
					issueId_labelId: {
						issueId,
						labelId,
					},
				},
			});

			if (existing) {
				return existing;
			}

			const issueLabel = await ctx.db.issueLabel.create({
				data: {
					issueId,
					labelId,
				},
				include: {
					label: true,
					issue: true,
				},
			});

			return issueLabel;
		}),

	// Remove label from issue
	removeFromIssue: protectedProcedure
		.input(
			z.object({
				issueId: z.string(),
				labelId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { issueId, labelId } = input;

			// Verify issue exists
			const issue = await ctx.db.issue.findUnique({
				where: { id: issueId },
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

			await ctx.db.issueLabel.delete({
				where: {
					issueId_labelId: {
						issueId,
						labelId,
					},
				},
			});

			return { success: true };
		}),
});
