import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const CycleStatus = z.enum(["UPCOMING", "CURRENT", "COMPLETED"]);

const createCycleInput = z.object({
	name: z.string().min(1).max(100),
	description: z.string().optional(),
	startDate: z.date(),
	endDate: z.date(),
	teamId: z.string(),
	workspaceId: z.string(),
});

const updateCycleInput = z.object({
	id: z.string(),
	name: z.string().min(1).max(100).optional(),
	description: z.string().optional(),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	status: CycleStatus.optional(),
});

const cycleIdSchema = z.object({
	id: z.string(),
});

const listCyclesInput = z.object({
	workspaceId: z.string(),
	teamId: z.string().optional(),
	status: CycleStatus.optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
});

const addIssueToCycleInput = z.object({
	cycleId: z.string(),
	issueId: z.string(),
});

const removeIssueFromCycleInput = z.object({
	issueId: z.string(),
});

export const cycleRouter = createTRPCRouter({
	// Create a new cycle
	create: protectedProcedure
		.input(createCycleInput)
		.mutation(async ({ ctx, input }) => {
			// Check workspace membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: input.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not a member of this workspace",
				});
			}

			// Verify team exists and belongs to workspace
			const team = await ctx.db.team.findFirst({
				where: {
					id: input.teamId,
					workspaceId: input.workspaceId,
				},
			});

			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found",
				});
			}

			// If creating a current cycle, set any existing current cycle to completed
			if (input.startDate <= new Date() && input.endDate >= new Date()) {
				await ctx.db.cycle.updateMany({
					where: {
						workspaceId: input.workspaceId,
						teamId: input.teamId,
						status: "CURRENT",
					},
					data: { status: "COMPLETED" },
				});
			}

			const cycle = await ctx.db.cycle.create({
				data: {
					name: input.name,
					description: input.description,
					startDate: input.startDate,
					endDate: input.endDate,
					workspaceId: input.workspaceId,
					teamId: input.teamId,
					status:
						input.startDate <= new Date() && input.endDate >= new Date()
							? "CURRENT"
							: input.startDate > new Date()
								? "UPCOMING"
								: "COMPLETED",
				},
			});

			return cycle;
		}),

	// Get a single cycle by ID
	getById: protectedProcedure
		.input(cycleIdSchema)
		.query(async ({ ctx, input }) => {
			const cycle = await ctx.db.cycle.findUnique({
				where: { id: input.id },
				include: {
					team: true,
					workspace: true,
					issues: {
						include: {
							assignee: true,
							creator: true,
							labels: {
								include: {
									label: true,
								},
							},
						},
						orderBy: { createdAt: "desc" },
					},
				},
			});

			if (!cycle) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Cycle not found",
				});
			}

			// Check workspace membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: cycle.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not a member of this workspace",
				});
			}

			return cycle;
		}),

	// List cycles with filtering
	list: protectedProcedure
		.input(listCyclesInput)
		.query(async ({ ctx, input }) => {
			// Check workspace membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: input.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not a member of this workspace",
				});
			}

			const where = {
				workspaceId: input.workspaceId,
				...(input.teamId && { teamId: input.teamId }),
				...(input.status && { status: input.status }),
			};

			const [cycles, total] = await Promise.all([
				ctx.db.cycle.findMany({
					where,
					include: {
						team: true,
						issues: {
							select: {
								id: true,
								status: true,
							},
						},
					},
					orderBy: { startDate: "desc" },
					take: input.limit,
					skip: input.offset,
				}),
				ctx.db.cycle.count({ where }),
			]);

			return { cycles, total };
		}),

	// Update a cycle
	update: protectedProcedure
		.input(updateCycleInput)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const existingCycle = await ctx.db.cycle.findUnique({
				where: { id },
			});

			if (!existingCycle) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Cycle not found",
				});
			}

			// Check workspace membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: existingCycle.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not a member of this workspace",
				});
			}

			// If status is being set to CURRENT, update any existing current cycle
			if (data.status === "CURRENT") {
				await ctx.db.cycle.updateMany({
					where: {
						workspaceId: existingCycle.workspaceId,
						teamId: existingCycle.teamId,
						status: "CURRENT",
						NOT: { id },
					},
					data: { status: "COMPLETED" },
				});
			}

			const cycle = await ctx.db.cycle.update({
				where: { id },
				data,
				include: {
					team: true,
					issues: {
						select: {
							id: true,
							status: true,
						},
					},
				},
			});

			return cycle;
		}),

	// Delete a cycle
	delete: protectedProcedure
		.input(cycleIdSchema)
		.mutation(async ({ ctx, input }) => {
			const existingCycle = await ctx.db.cycle.findUnique({
				where: { id: input.id },
			});

			if (!existingCycle) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Cycle not found",
				});
			}

			// Check workspace membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: existingCycle.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not a member of this workspace",
				});
			}

			await ctx.db.cycle.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	// Get current cycle for a team
	getCurrent: protectedProcedure
		.input(z.object({ teamId: z.string(), workspaceId: z.string() }))
		.query(async ({ ctx, input }) => {
			// Check workspace membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: input.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not a member of this workspace",
				});
			}

			const cycle = await ctx.db.cycle.findFirst({
				where: {
					workspaceId: input.workspaceId,
					teamId: input.teamId,
					status: "CURRENT",
				},
				include: {
					team: true,
					issues: {
						select: {
							id: true,
							status: true,
						},
					},
				},
			});

			return cycle;
		}),

	// Add issue to cycle
	addIssue: protectedProcedure
		.input(addIssueToCycleInput)
		.mutation(async ({ ctx, input }) => {
			const cycle = await ctx.db.cycle.findUnique({
				where: { id: input.cycleId },
			});

			if (!cycle) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Cycle not found",
				});
			}

			const issue = await ctx.db.issue.findUnique({
				where: { id: input.issueId },
			});

			if (!issue) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Issue not found",
				});
			}

			// Check workspace membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: cycle.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not a member of this workspace",
				});
			}

			const updatedIssue = await ctx.db.issue.update({
				where: { id: input.issueId },
				data: { cycleId: input.cycleId },
				include: {
					assignee: true,
					labels: {
						include: {
							label: true,
						},
					},
				},
			});

			return updatedIssue;
		}),

	// Remove issue from cycle
	removeIssue: protectedProcedure
		.input(removeIssueFromCycleInput)
		.mutation(async ({ ctx, input }) => {
			const issue = await ctx.db.issue.findUnique({
				where: { id: input.issueId },
			});

			if (!issue) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Issue not found",
				});
			}

			// Check workspace membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: issue.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not a member of this workspace",
				});
			}

			const updatedIssue = await ctx.db.issue.update({
				where: { id: input.issueId },
				data: { cycleId: null },
				include: {
					assignee: true,
					labels: {
						include: {
							label: true,
						},
					},
				},
			});

			return updatedIssue;
		}),
});
