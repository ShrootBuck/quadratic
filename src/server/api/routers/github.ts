import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { executeAutomations } from "~/server/api/routers/automation";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	fetchPullRequestFromUrl,
	generateBranchName,
	parseGitHubUrl,
	refreshPullRequestStatus,
	syncPullRequestToDb,
} from "~/server/github/client";

const linkPullRequestInput = z.object({
	issueId: z.string(),
	url: z.string().url(),
});

const unlinkPullRequestInput = z.object({
	issueId: z.string(),
	prId: z.string(),
});

const refreshPullRequestInput = z.object({
	issueId: z.string(),
});

const generateBranchInput = z.object({
	issueId: z.string(),
});

export const githubRouter = createTRPCRouter({
	// Link a GitHub PR to an issue
	linkPullRequest: protectedProcedure
		.input(linkPullRequestInput)
		.mutation(async ({ ctx, input }) => {
			// Verify the issue exists and user has access
			const issue = await ctx.db.issue.findUnique({
				where: { id: input.issueId },
				include: { workspace: true, team: true },
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

			// Validate GitHub URL
			const parsed = parseGitHubUrl(input.url);
			if (!parsed) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid GitHub pull request URL",
				});
			}

			// Fetch PR data from GitHub
			const prData = await fetchPullRequestFromUrl(input.url);
			if (!prData) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Pull request not found on GitHub",
				});
			}

			// Sync to database
			await syncPullRequestToDb(issue.id, issue.workspaceId, prData);

			// Fetch the created PR
			const pr = await ctx.db.gitHubPullRequest.findFirst({
				where: {
					issueId: issue.id,
					githubId: String(prData.id),
				},
			});

			return pr;
		}),

	// Unlink a GitHub PR from an issue
	unlinkPullRequest: protectedProcedure
		.input(unlinkPullRequestInput)
		.mutation(async ({ ctx, input }) => {
			// Get the PR
			const pr = await ctx.db.gitHubPullRequest.findUnique({
				where: { id: input.prId },
				include: { issue: true },
			});

			if (!pr) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Pull request link not found",
				});
			}

			// Check workspace access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: pr.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this workspace",
				});
			}

			// Delete the PR link
			await ctx.db.gitHubPullRequest.delete({
				where: { id: input.prId },
			});

			return { success: true };
		}),

	// List linked PRs for an issue
	listByIssue: protectedProcedure
		.input(z.object({ issueId: z.string() }))
		.query(async ({ ctx, input }) => {
			// Verify issue access
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

			// Get linked PRs
			const prs = await ctx.db.gitHubPullRequest.findMany({
				where: { issueId: input.issueId },
				orderBy: { createdAt: "desc" },
			});

			return prs;
		}),

	// Refresh PR status from GitHub
	refreshStatus: protectedProcedure
		.input(refreshPullRequestInput)
		.mutation(async ({ ctx, input }) => {
			// Verify issue access
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

			// Refresh all PRs for this issue
			await refreshPullRequestStatus(input.issueId);

			// Check if any PRs were merged and trigger automation
			const mergedPrs = await ctx.db.gitHubPullRequest.findMany({
				where: {
					issueId: input.issueId,
					status: "MERGED",
				},
			});

			// Trigger automation if PR was merged and issue is not already done
			if (mergedPrs.length > 0 && issue.status !== "DONE") {
				void executeAutomations({
					trigger: "STATUS_CHANGED",
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
						labelIds: [],
						oldStatus: issue.status,
						prMerged: true,
					},
				});
			}

			// Return updated PRs
			return ctx.db.gitHubPullRequest.findMany({
				where: { issueId: input.issueId },
				orderBy: { createdAt: "desc" },
			});
		}),

	// Generate branch name for an issue
	generateBranch: protectedProcedure
		.input(generateBranchInput)
		.query(async ({ ctx, input }) => {
			const issue = await ctx.db.issue.findUnique({
				where: { id: input.issueId },
				include: { team: true },
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

			const branchName = generateBranchName(issue.identifier, issue.title);
			return { branchName };
		}),

	// Copy branch name to clipboard (helper endpoint)
	copyBranchName: protectedProcedure
		.input(generateBranchInput)
		.mutation(async ({ ctx, input }) => {
			const issue = await ctx.db.issue.findUnique({
				where: { id: input.issueId },
				include: { team: true },
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

			const branchName = generateBranchName(issue.identifier, issue.title);
			return { branchName };
		}),
});
