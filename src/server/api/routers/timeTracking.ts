import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Schemas
const createTimeEntryInput = z.object({
	issueId: z.string(),
	duration: z.number().min(0.01, "Duration must be at least 0.01 hours"),
	description: z.string().optional(),
	startedAt: z.date().optional(),
});

const startTimerInput = z.object({
	issueId: z.string(),
	description: z.string().optional(),
});

const stopTimerInput = z.object({
	timeEntryId: z.string(),
});

const updateTimeEntryInput = z.object({
	id: z.string(),
	duration: z.number().min(0.01).optional(),
	description: z.string().optional(),
	startedAt: z.date().optional(),
});

const deleteTimeEntryInput = z.object({
	id: z.string(),
});

const listTimeEntriesInput = z.object({
	issueId: z.string().optional(),
	workspaceId: z.string(),
	userId: z.string().optional(),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
});

const updateEstimatedTimeInput = z.object({
	issueId: z.string(),
	estimatedTime: z.number().min(0).nullable(),
});

const getTimeReportInput = z.object({
	workspaceId: z.string(),
	projectId: z.string().optional(),
	cycleId: z.string().optional(),
	userId: z.string().optional(),
	startDate: z.date(),
	endDate: z.date(),
});

export const timeTrackingRouter = createTRPCRouter({
	// Create a manual time entry
	create: protectedProcedure
		.input(createTimeEntryInput)
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
					message: "You do not have access to this workspace",
				});
			}

			const timeEntry = await ctx.db.timeEntry.create({
				data: {
					issueId: input.issueId,
					userId: ctx.session.user.id,
					workspaceId: issue.workspaceId,
					duration: input.duration,
					description: input.description,
					startedAt: input.startedAt ?? new Date(),
					endedAt: input.startedAt
						? new Date(
								input.startedAt.getTime() + input.duration * 60 * 60 * 1000,
							)
						: new Date(Date.now() + input.duration * 60 * 60 * 1000),
					isRunning: false,
				},
				include: {
					issue: {
						include: {
							team: true,
						},
					},
					user: true,
				},
			});

			return timeEntry;
		}),

	// Start a timer
	startTimer: protectedProcedure
		.input(startTimerInput)
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
					message: "You do not have access to this workspace",
				});
			}

			// Check if user already has a running timer
			const existingRunningTimer = await ctx.db.timeEntry.findFirst({
				where: {
					userId: ctx.session.user.id,
					isRunning: true,
				},
			});

			if (existingRunningTimer) {
				throw new TRPCError({
					code: "CONFLICT",
					message:
						"You already have a timer running. Stop it first before starting a new one.",
				});
			}

			const timeEntry = await ctx.db.timeEntry.create({
				data: {
					issueId: input.issueId,
					userId: ctx.session.user.id,
					workspaceId: issue.workspaceId,
					duration: 0,
					description: input.description,
					startedAt: new Date(),
					isRunning: true,
				},
				include: {
					issue: {
						include: {
							team: true,
						},
					},
					user: true,
				},
			});

			return timeEntry;
		}),

	// Stop a timer
	stopTimer: protectedProcedure
		.input(stopTimerInput)
		.mutation(async ({ ctx, input }) => {
			const timeEntry = await ctx.db.timeEntry.findUnique({
				where: { id: input.timeEntryId },
			});

			if (!timeEntry) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Time entry not found",
				});
			}

			// Only the owner can stop their timer
			if (timeEntry.userId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only stop your own timers",
				});
			}

			if (!timeEntry.isRunning) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This timer is not running",
				});
			}

			const endedAt = new Date();
			const duration =
				(endedAt.getTime() - timeEntry.startedAt.getTime()) / (1000 * 60 * 60); // Convert to hours

			const updatedEntry = await ctx.db.timeEntry.update({
				where: { id: input.timeEntryId },
				data: {
					duration,
					endedAt,
					isRunning: false,
				},
				include: {
					issue: {
						include: {
							team: true,
						},
					},
					user: true,
				},
			});

			return updatedEntry;
		}),

	// Update a time entry
	update: protectedProcedure
		.input(updateTimeEntryInput)
		.mutation(async ({ ctx, input }) => {
			const timeEntry = await ctx.db.timeEntry.findUnique({
				where: { id: input.id },
			});

			if (!timeEntry) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Time entry not found",
				});
			}

			// Only the owner can update their entry
			if (timeEntry.userId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only update your own time entries",
				});
			}

			// Cannot update a running timer's duration
			if (timeEntry.isRunning && input.duration !== undefined) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot update duration of a running timer. Stop it first.",
				});
			}

			const updatedEntry = await ctx.db.timeEntry.update({
				where: { id: input.id },
				data: {
					duration: input.duration,
					description: input.description,
					startedAt: input.startedAt,
					endedAt:
						input.startedAt && input.duration
							? new Date(
									input.startedAt.getTime() + input.duration * 60 * 60 * 1000,
								)
							: undefined,
				},
				include: {
					issue: {
						include: {
							team: true,
						},
					},
					user: true,
				},
			});

			return updatedEntry;
		}),

	// Delete a time entry
	delete: protectedProcedure
		.input(deleteTimeEntryInput)
		.mutation(async ({ ctx, input }) => {
			const timeEntry = await ctx.db.timeEntry.findUnique({
				where: { id: input.id },
			});

			if (!timeEntry) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Time entry not found",
				});
			}

			// Only the owner can delete their entry
			if (timeEntry.userId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only delete your own time entries",
				});
			}

			await ctx.db.timeEntry.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	// Get a single time entry
	byId: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const timeEntry = await ctx.db.timeEntry.findUnique({
				where: { id: input.id },
				include: {
					issue: {
						include: {
							team: true,
						},
					},
					user: true,
				},
			});

			if (!timeEntry) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Time entry not found",
				});
			}

			// Check workspace access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: timeEntry.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this workspace",
				});
			}

			return timeEntry;
		}),

	// List time entries with filtering
	list: protectedProcedure
		.input(listTimeEntriesInput)
		.query(async ({ ctx, input }) => {
			const {
				issueId,
				workspaceId,
				userId,
				startDate,
				endDate,
				limit,
				offset,
			} = input;

			// Check workspace access
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

			// Build where clause
			const where: {
				workspaceId: string;
				issueId?: string;
				userId?: string;
				startedAt?: { gte?: Date; lte?: Date };
			} = {
				workspaceId,
			};

			if (issueId) {
				where.issueId = issueId;
			}

			if (userId) {
				where.userId = userId;
			}

			if (startDate || endDate) {
				where.startedAt = {};
				if (startDate) {
					where.startedAt.gte = startDate;
				}
				if (endDate) {
					where.startedAt.lte = endDate;
				}
			}

			const total = await ctx.db.timeEntry.count({ where });

			const timeEntries = await ctx.db.timeEntry.findMany({
				where,
				include: {
					issue: {
						include: {
							team: true,
						},
					},
					user: true,
				},
				orderBy: { startedAt: "desc" },
				skip: offset,
				take: limit,
			});

			// Calculate total duration
			const totalDuration = await ctx.db.timeEntry.aggregate({
				where,
				_sum: {
					duration: true,
				},
			});

			return {
				timeEntries,
				totalDuration: totalDuration._sum.duration ?? 0,
				pagination: {
					total,
					limit,
					offset,
					hasMore: offset + timeEntries.length < total,
				},
			};
		}),

	// Get running timer for current user
	getRunningTimer: protectedProcedure.query(async ({ ctx }) => {
		const runningTimer = await ctx.db.timeEntry.findFirst({
			where: {
				userId: ctx.session.user.id,
				isRunning: true,
			},
			include: {
				issue: {
					include: {
						team: true,
					},
				},
			},
		});

		return runningTimer;
	}),

	// Update estimated time for an issue
	updateEstimatedTime: protectedProcedure
		.input(updateEstimatedTimeInput)
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
					message: "You do not have access to this workspace",
				});
			}

			const updatedIssue = await ctx.db.issue.update({
				where: { id: input.issueId },
				data: {
					estimatedTime: input.estimatedTime,
				},
				include: {
					team: true,
					assignee: true,
				},
			});

			return updatedIssue;
		}),

	// Get total time spent on an issue
	getIssueTimeSummary: protectedProcedure
		.input(z.object({ issueId: z.string() }))
		.query(async ({ ctx, input }) => {
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
					message: "You do not have access to this workspace",
				});
			}

			const totalTime = await ctx.db.timeEntry.aggregate({
				where: {
					issueId: input.issueId,
					isRunning: false,
				},
				_sum: {
					duration: true,
				},
			});

			const entryCount = await ctx.db.timeEntry.count({
				where: {
					issueId: input.issueId,
					isRunning: false,
				},
			});

			return {
				totalTime: totalTime._sum.duration ?? 0,
				entryCount,
				estimatedTime: issue.estimatedTime,
			};
		}),

	// Get time tracking report
	getReport: protectedProcedure
		.input(getTimeReportInput)
		.query(async ({ ctx, input }) => {
			const { workspaceId, projectId, cycleId, userId, startDate, endDate } =
				input;

			// Check workspace access
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

			// Build base where clause
			const baseWhere: Record<string, unknown> = {
				workspaceId,
				isRunning: false,
				startedAt: {
					gte: startDate,
					lte: endDate,
				},
			};

			if (userId) {
				baseWhere.userId = userId;
			}

			// Get issues filtered by project/cycle if specified
			let issueIds: string[] | undefined;
			if (projectId || cycleId) {
				const issues = await ctx.db.issue.findMany({
					where: {
						workspaceId,
						...(projectId && { projectId }),
						...(cycleId && { cycleId }),
					},
					select: { id: true },
				});
				issueIds = issues.map((i) => i.id);
				baseWhere.issueId = { in: issueIds };
			}

			// Get time entries with details
			const timeEntries = await ctx.db.timeEntry.findMany({
				where: baseWhere,
				include: {
					issue: {
						include: {
							team: true,
							project: true,
						},
					},
					user: true,
				},
				orderBy: { startedAt: "desc" },
			});

			// Calculate totals
			const totalDuration = timeEntries.reduce(
				(sum, entry) => sum + entry.duration,
				0,
			);

			// Group by user
			const byUser = timeEntries.reduce(
				(acc, entry) => {
					const userId = entry.userId;
					if (!acc[userId]) {
						acc[userId] = {
							user: entry.user,
							totalDuration: 0,
							entryCount: 0,
						};
					}
					acc[userId].totalDuration += entry.duration;
					acc[userId].entryCount += 1;
					return acc;
				},
				{} as Record<
					string,
					{
						user: {
							id: string;
							name: string;
							email: string;
							image: string | null;
						};
						totalDuration: number;
						entryCount: number;
					}
				>,
			);

			// Group by issue
			const byIssue = timeEntries.reduce(
				(acc, entry) => {
					const issueId = entry.issueId;
					if (!acc[issueId]) {
						acc[issueId] = {
							issue: entry.issue,
							totalDuration: 0,
							entryCount: 0,
						};
					}
					acc[issueId].totalDuration += entry.duration;
					acc[issueId].entryCount += 1;
					return acc;
				},
				{} as Record<
					string,
					{
						issue: {
							id: string;
							identifier: string;
							title: string;
							status: string;
							estimatedTime: number | null;
						};
						totalDuration: number;
						entryCount: number;
					}
				>,
			);

			// Group by day
			const byDay = timeEntries.reduce(
				(acc, entry) => {
					const day = entry.startedAt.toISOString().split("T")[0] as string;
					if (!acc[day]) {
						acc[day] = {
							date: day,
							totalDuration: 0,
							entryCount: 0,
						};
					}
					acc[day].totalDuration += entry.duration;
					acc[day].entryCount += 1;
					return acc;
				},
				{} as Record<
					string,
					{ date: string; totalDuration: number; entryCount: number }
				>,
			);

			return {
				timeEntries,
				totalDuration,
				entryCount: timeEntries.length,
				byUser: Object.values(byUser),
				byIssue: Object.values(byIssue),
				byDay: Object.values(byDay).sort((a, b) =>
					a.date.localeCompare(b.date),
				),
			};
		}),

	// Export time entries to CSV format
	exportToCSV: protectedProcedure
		.input(
			z.object({
				workspaceId: z.string(),
				startDate: z.date(),
				endDate: z.date(),
				projectId: z.string().optional(),
				cycleId: z.string().optional(),
				userId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { workspaceId, startDate, endDate, projectId, cycleId, userId } =
				input;

			// Check workspace access
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

			// Build where clause
			const where: Record<string, unknown> = {
				workspaceId,
				isRunning: false,
				startedAt: {
					gte: startDate,
					lte: endDate,
				},
			};

			if (userId) {
				where.userId = userId;
			}

			// Filter by project/cycle if specified
			if (projectId || cycleId) {
				const issues = await ctx.db.issue.findMany({
					where: {
						workspaceId,
						...(projectId && { projectId }),
						...(cycleId && { cycleId }),
					},
					select: { id: true },
				});
				const issueIds = issues.map((i) => i.id);
				where.issueId = { in: issueIds };
			}

			const timeEntries = await ctx.db.timeEntry.findMany({
				where,
				include: {
					issue: {
						include: {
							team: true,
							project: true,
						},
					},
					user: true,
				},
				orderBy: { startedAt: "desc" },
			});

			// Generate CSV
			const headers = [
				"Date",
				"User",
				"Issue ID",
				"Issue Title",
				"Team",
				"Project",
				"Duration (hours)",
				"Description",
			];

			const rows = timeEntries.map((entry) => [
				entry.startedAt.toISOString(),
				entry.user.name,
				entry.issue.identifier,
				`"${entry.issue.title.replace(/"/g, '""')}"`,
				entry.issue.team.key,
				entry.issue.project?.name ?? "",
				entry.duration.toFixed(2),
				`"${(entry.description ?? "").replace(/"/g, '""')}"`,
			]);

			const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
				"\n",
			);

			return csv;
		}),
});
