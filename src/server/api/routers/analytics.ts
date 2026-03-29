import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const getCycleAnalyticsInput = z.object({
	cycleId: z.string(),
});

const getVelocityInput = z.object({
	workspaceId: z.string(),
	teamId: z.string().optional(),
	limit: z.number().min(1).max(20).default(10),
});

const getIssueDistributionInput = z.object({
	cycleId: z.string(),
});

export const analyticsRouter = createTRPCRouter({
	getCycleAnalytics: protectedProcedure
		.input(getCycleAnalyticsInput)
		.query(async ({ ctx, input }) => {
			const cycle = await ctx.db.cycle.findUnique({
				where: { id: input.cycleId },
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
					},
				},
			});

			if (!cycle) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Cycle not found",
				});
			}

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

			const totalIssues = cycle.issues.length;
			const completedIssues = cycle.issues.filter(
				(i) => i.status === "DONE",
			).length;
			const cancelledIssues = cycle.issues.filter(
				(i) => i.status === "CANCELLED",
			).length;
			const inProgressIssues = cycle.issues.filter(
				(i) => i.status === "IN_PROGRESS",
			).length;
			const todoIssues = cycle.issues.filter(
				(i) => i.status === "TODO" || i.status === "BACKLOG",
			).length;

			const issuesByStatus = [
				{ name: "Done", value: completedIssues, color: "#4EC9B0" },
				{ name: "In Progress", value: inProgressIssues, color: "#5E6AD2" },
				{ name: "Todo", value: todoIssues, color: "#8A8F98" },
				{ name: "Cancelled", value: cancelledIssues, color: "#F87171" },
			];

			const uniqueAssignees = new Set(
				cycle.issues.filter((i) => i.assigneeId).map((i) => i.assigneeId ?? ""),
			).size;

			const completedByDay: { date: string; count: number }[] = [];

			const doneIssues = cycle.issues.filter((i) => i.status === "DONE");
			const issuesByDate = new Map<string, number>();

			for (const issue of doneIssues) {
				const dateKey =
					new Date(issue.updatedAt).toISOString().split("T")[0] ?? "";
				if (dateKey) {
					issuesByDate.set(dateKey, (issuesByDate.get(dateKey) || 0) + 1);
				}
			}

			const startDate = new Date(cycle.startDate);
			const endDate = new Date(cycle.endDate);

			for (
				let d = new Date(startDate);
				d <= endDate;
				d.setDate(d.getDate() + 1)
			) {
				const dateKey = d.toISOString().split("T")[0] ?? "";
				const count = issuesByDate.get(dateKey) || 0;
				completedByDay.push({
					date: dateKey,
					count,
				});
			}

			const avgCycleTime =
				completedIssues > 0
					? doneIssues.reduce((acc, issue) => {
							const created = new Date(issue.createdAt).getTime();
							const updated = new Date(issue.updatedAt).getTime();
							return acc + (updated - created);
						}, 0) /
						(completedIssues * 24 * 60 * 60 * 1000)
					: 0;

			const priorityDistribution = {
				urgent: cycle.issues.filter((i) => i.priority === "URGENT").length,
				high: cycle.issues.filter((i) => i.priority === "HIGH").length,
				medium: cycle.issues.filter((i) => i.priority === "MEDIUM").length,
				low: cycle.issues.filter((i) => i.priority === "LOW").length,
				none: cycle.issues.filter((i) => i.priority === "NO_PRIORITY").length,
			};

			const assigneeDistribution = cycle.issues.reduce(
				(acc, issue) => {
					if (issue.assigneeId && issue.assignee) {
						const name = issue.assignee.name || issue.assignee.email;
						acc[name] = (acc[name] || 0) + 1;
					}
					return acc;
				},
				{} as Record<string, number>,
			);

			return {
				cycle: {
					id: cycle.id,
					name: cycle.name,
					startDate: cycle.startDate,
					endDate: cycle.endDate,
					status: cycle.status,
					team: cycle.team,
				},
				summary: {
					totalIssues,
					completedIssues,
					inProgressIssues,
					todoIssues,
					cancelledIssues,
					uniqueAssignees,
					completionRate:
						totalIssues > 0
							? Math.round((completedIssues / totalIssues) * 100)
							: 0,
				},
				issuesByStatus,
				completedByDay,
				avgCycleTime: Math.round(avgCycleTime * 10) / 10,
				priorityDistribution,
				assigneeDistribution,
			};
		}),

	getVelocityAnalytics: protectedProcedure
		.input(getVelocityInput)
		.query(async ({ ctx, input }) => {
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

			const cycles = await ctx.db.cycle.findMany({
				where: {
					workspaceId: input.workspaceId,
					...(input.teamId && { teamId: input.teamId }),
					status: "COMPLETED",
				},
				include: {
					issues: {
						select: {
							status: true,
							createdAt: true,
							updatedAt: true,
						},
					},
				},
				orderBy: { endDate: "desc" },
				take: input.limit,
			});

			const velocityData = cycles.map((cycle) => {
				const completed = cycle.issues.filter(
					(i) => i.status === "DONE",
				).length;
				const total = cycle.issues.length;
				const started = cycle.issues.filter(
					(i) => i.status !== "BACKLOG",
				).length;

				const avgCycleTime =
					completed > 0
						? cycle.issues
								.filter((i) => i.status === "DONE")
								.reduce((acc, issue) => {
									const created = new Date(issue.createdAt).getTime();
									const updated = new Date(issue.updatedAt).getTime();
									return acc + (updated - created);
								}, 0) /
							(completed * 24 * 60 * 60 * 1000)
						: 0;

				return {
					id: cycle.id,
					name: cycle.name,
					startDate: cycle.startDate,
					endDate: cycle.endDate,
					totalIssues: total,
					completedIssues: completed,
					inProgress: total - completed,
					velocity: completed,
					completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
					avgCycleTime: Math.round(avgCycleTime * 10) / 10,
					andStarted: started,
				};
			});

			const currentVelocity =
				velocityData.length > 0 ? (velocityData[0]?.velocity ?? 0) : 0;
			const previousVelocity =
				velocityData.length > 1 ? (velocityData[1]?.velocity ?? 0) : 0;
			const velocityChange =
				previousVelocity > 0
					? Math.round(
							((currentVelocity - previousVelocity) / previousVelocity) * 100,
						)
					: 0;

			const avgVelocity =
				velocityData.length > 0
					? Math.round(
							velocityData.reduce((acc, c) => acc + c.velocity, 0) /
								velocityData.length,
						)
					: 0;

			const avgCycleTime =
				velocityData.length > 0
					? Math.round(
							(velocityData.reduce((acc, c) => acc + c.avgCycleTime, 0) /
								velocityData.length) *
								10,
						) / 10
					: 0;

			return {
				cycles: velocityData,
				summary: {
					currentVelocity,
					previousVelocity,
					velocityChange,
					avgVelocity,
					avgCycleTime,
					totalCycles: cycles.length,
				},
			};
		}),

	getIssueDistribution: protectedProcedure
		.input(getIssueDistributionInput)
		.query(async ({ ctx, input }) => {
			const cycle = await ctx.db.cycle.findUnique({
				where: { id: input.cycleId },
				include: {
					workspace: true,
					issues: {
						select: {
							id: true,
							status: true,
							priority: true,
							assigneeId: true,
							assignee: {
								select: {
									name: true,
									email: true,
								},
							},
							projectId: true,
							project: {
								select: {
									name: true,
								},
							},
						},
					},
				},
			});

			if (!cycle) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Cycle not found",
				});
			}

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

			const byStatus = {
				backlog: cycle.issues.filter((i) => i.status === "BACKLOG").length,
				todo: cycle.issues.filter((i) => i.status === "TODO").length,
				inProgress: cycle.issues.filter((i) => i.status === "IN_PROGRESS")
					.length,
				done: cycle.issues.filter((i) => i.status === "DONE").length,
				cancelled: cycle.issues.filter((i) => i.status === "CANCELLED").length,
			};

			const byPriority = {
				urgent: cycle.issues.filter((i) => i.priority === "URGENT").length,
				high: cycle.issues.filter((i) => i.priority === "HIGH").length,
				medium: cycle.issues.filter((i) => i.priority === "MEDIUM").length,
				low: cycle.issues.filter((i) => i.priority === "LOW").length,
				none: cycle.issues.filter((i) => i.priority === "NO_PRIORITY").length,
			};

			const byAssignee: { name: string; count: number }[] = [];
			const assigneeMap = new Map<string, number>();

			for (const issue of cycle.issues) {
				if (issue.assigneeId) {
					const name =
						issue.assignee?.name || issue.assignee?.email || "Unknown";
					assigneeMap.set(name, (assigneeMap.get(name) || 0) + 1);
				}
			}

			assigneeMap.forEach((count, name) => {
				byAssignee.push({ name, count });
			});

			byAssignee.sort((a, b) => b.count - a.count);

			const byProject: { name: string; count: number }[] = [];
			const projectMap = new Map<string, number>();

			for (const issue of cycle.issues) {
				if (issue.projectId && issue.project) {
					const name = issue.project.name;
					projectMap.set(name, (projectMap.get(name) || 0) + 1);
				}
			}

			projectMap.forEach((count, name) => {
				byProject.push({ name, count });
			});

			byProject.sort((a, b) => b.count - a.count);

			return {
				byStatus,
				byPriority,
				byAssignee,
				byProject,
			};
		}),
});
