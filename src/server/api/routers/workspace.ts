import { z } from "zod";
import {
	WORKSPACE_NAME_MAX,
	WORKSPACE_NAME_MIN,
	WORKSPACE_SLUG_MAX,
	WORKSPACE_SLUG_MIN,
} from "~/constants";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Fuzzy match function for search
function fuzzyMatch(text: string, query: string): boolean {
	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();
	let queryIndex = 0;
	for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
		if (lowerText[i] === lowerQuery[queryIndex]) {
			queryIndex++;
		}
	}
	return queryIndex === lowerQuery.length;
}

function calculateRelevance(text: string, query: string): number {
	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();

	// Exact match gets highest score
	if (lowerText === lowerQuery) return 100;

	// Starts with query gets high score
	if (lowerText.startsWith(lowerQuery)) return 80;

	// Contains query gets medium score
	if (lowerText.includes(lowerQuery)) return 60;

	// Fuzzy match gets lower score
	if (fuzzyMatch(text, query)) return 40;

	return 0;
}

export const workspaceRouter = createTRPCRouter({
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(WORKSPACE_NAME_MIN).max(WORKSPACE_NAME_MAX),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Generate slug from name
			const baseSlug = input.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "");

			// Check if slug exists and append number if needed
			let slug = baseSlug;
			let counter = 1;
			while (await ctx.db.workspace.findUnique({ where: { slug } })) {
				slug = `${baseSlug}-${counter}`;
				counter++;
			}

			// Create workspace and add user as admin in a transaction
			const workspace = await ctx.db.$transaction(async (tx) => {
				const ws = await tx.workspace.create({
					data: {
						name: input.name,
						slug,
					},
				});

				await tx.workspaceMember.create({
					data: {
						workspaceId: ws.id,
						userId: ctx.session.user.id,
						role: "ADMIN",
					},
				});

				return ws;
			});

			return workspace;
		}),

	getCurrent: protectedProcedure.query(async ({ ctx }) => {
		const membership = await ctx.db.workspaceMember.findFirst({
			where: { userId: ctx.session.user.id },
			include: { workspace: true },
			orderBy: { joinedAt: "asc" },
		});

		return membership?.workspace ?? null;
	}),

	list: protectedProcedure.query(async ({ ctx }) => {
		const memberships = await ctx.db.workspaceMember.findMany({
			where: { userId: ctx.session.user.id },
			include: { workspace: true },
			orderBy: { joinedAt: "asc" },
		});

		return memberships.map((m) => m.workspace);
	}),

	getTeams: protectedProcedure
		.input(z.object({ workspaceId: z.string() }))
		.query(async ({ ctx, input }) => {
			// Check membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: input.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new Error("Access denied");
			}

			return ctx.db.team.findMany({
				where: { workspaceId: input.workspaceId },
				orderBy: { name: "asc" },
			});
		}),

	getProjects: protectedProcedure
		.input(
			z.object({
				workspaceId: z.string(),
				teamId: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			// Check membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: input.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new Error("Access denied");
			}

			return ctx.db.project.findMany({
				where: {
					workspaceId: input.workspaceId,
					...(input.teamId && { teamId: input.teamId }),
				},
				orderBy: { name: "asc" },
			});
		}),

	getMembers: protectedProcedure
		.input(z.object({ workspaceId: z.string() }))
		.query(async ({ ctx, input }) => {
			// Check membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: input.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new Error("Access denied");
			}

			return ctx.db.workspaceMember.findMany({
				where: { workspaceId: input.workspaceId },
				include: { user: true },
				orderBy: { joinedAt: "asc" },
			});
		}),

	getLabels: protectedProcedure
		.input(z.object({ workspaceId: z.string() }))
		.query(async ({ ctx, input }) => {
			// Check membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: input.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new Error("Access denied");
			}

			return ctx.db.label.findMany({
				where: { workspaceId: input.workspaceId },
				orderBy: { name: "asc" },
			});
		}),

	search: protectedProcedure
		.input(
			z.object({
				workspaceId: z.string(),
				query: z.string().min(1),
				limit: z.number().min(1).max(20).default(10),
			}),
		)
		.query(async ({ ctx, input }) => {
			// Check membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: input.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new Error("Access denied");
			}

			const { query, workspaceId, limit } = input;

			// Helper for SQLite case-insensitive search
			const searchPattern = `%${query}%`;

			// Search issues using raw query for SQLite case-insensitivity
			const issues = (await ctx.db.$queryRaw`
				SELECT i.*, t.key as teamKey, t.name as teamName,
					u.id as assigneeId, u.name as assigneeName, u.image as assigneeImage
				FROM Issue i
				LEFT JOIN Team t ON i.teamId = t.id
				LEFT JOIN User u ON i.assigneeId = u.id
				WHERE i.workspaceId = ${workspaceId}
					AND (LOWER(i.title) LIKE LOWER(${searchPattern}) 
						OR LOWER(i.identifier) LIKE LOWER(${searchPattern}))
				ORDER BY i.updatedAt DESC
				LIMIT ${limit}
			`) as Array<{
				id: string;
				title: string;
				identifier: string;
				teamId: string;
				teamKey: string;
				teamName: string;
				assigneeId: string | null;
				assigneeName: string | null;
				assigneeImage: string | null;
			}>;

			// Search projects
			const projects = (await ctx.db.$queryRaw`
				SELECT p.*, t.key as teamKey, t.name as teamName
				FROM Project p
				LEFT JOIN Team t ON p.teamId = t.id
				WHERE p.workspaceId = ${workspaceId}
					AND LOWER(p.name) LIKE LOWER(${searchPattern})
				ORDER BY p.updatedAt DESC
				LIMIT ${limit}
			`) as Array<{
				id: string;
				name: string;
				teamId: string;
				teamKey: string;
				teamName: string;
			}>;

			// Search cycles
			const cycles = (await ctx.db.$queryRaw`
				SELECT c.*, t.key as teamKey, t.name as teamName
				FROM Cycle c
				LEFT JOIN Team t ON c.teamId = t.id
				WHERE c.workspaceId = ${workspaceId}
					AND LOWER(c.name) LIKE LOWER(${searchPattern})
				ORDER BY c.startDate DESC
				LIMIT ${limit}
			`) as Array<{
				id: string;
				name: string;
				teamId: string;
				teamKey: string;
				teamName: string;
			}>;

			// Search teams
			const teams = (await ctx.db.$queryRaw`
				SELECT t.*
				FROM Team t
				WHERE t.workspaceId = ${workspaceId}
					AND (LOWER(t.name) LIKE LOWER(${searchPattern}) 
						OR LOWER(t.key) LIKE LOWER(${searchPattern}))
				ORDER BY t.name ASC
				LIMIT ${limit}
			`) as Array<{
				id: string;
				name: string;
				key: string;
				color: string;
			}>;

			// Search users
			const users = (await ctx.db.$queryRaw`
				SELECT DISTINCT u.id, u.name, u.email, u.image
				FROM User u
				JOIN WorkspaceMember wm ON u.id = wm.userId
				WHERE wm.workspaceId = ${workspaceId}
					AND (LOWER(u.name) LIKE LOWER(${searchPattern}) 
						OR LOWER(u.email) LIKE LOWER(${searchPattern}))
				ORDER BY u.name ASC
				LIMIT ${limit}
			`) as Array<{
				id: string;
				name: string | null;
				email: string;
				image: string | null;
			}>;

			// Calculate relevance and sort
			const scoredIssues = issues.map((issue) => ({
				...issue,
				relevance: Math.max(
					calculateRelevance(issue.title, query),
					calculateRelevance(issue.identifier, query) * 1.2, // Boost identifier matches
				),
				type: "issue" as const,
				team: {
					id: issue.teamId,
					key: issue.teamKey,
					name: issue.teamName,
				},
				assignee: issue.assigneeId
					? {
							id: issue.assigneeId,
							name: issue.assigneeName,
							image: issue.assigneeImage,
						}
					: null,
			}));

			const scoredProjects = projects.map((project) => ({
				...project,
				relevance: calculateRelevance(project.name, query),
				type: "project" as const,
				team: {
					id: project.teamId,
					key: project.teamKey,
					name: project.teamName,
				},
			}));

			const scoredCycles = cycles.map((cycle) => ({
				...cycle,
				relevance: calculateRelevance(cycle.name, query),
				type: "cycle" as const,
				team: {
					id: cycle.teamId,
					key: cycle.teamKey,
					name: cycle.teamName,
				},
			}));

			const scoredTeams = teams.map((team) => ({
				...team,
				relevance: Math.max(
					calculateRelevance(team.name, query),
					calculateRelevance(team.key, query) * 1.1,
				),
				type: "team" as const,
			}));

			const scoredUsers = users.map((user) => ({
				...user,
				relevance: Math.max(
					calculateRelevance(user.name || "", query),
					calculateRelevance(user.email, query) * 0.8,
				),
				type: "user" as const,
			}));

			return {
				issues: scoredIssues.sort((a, b) => b.relevance - a.relevance),
				projects: scoredProjects.sort((a, b) => b.relevance - a.relevance),
				cycles: scoredCycles.sort((a, b) => b.relevance - a.relevance),
				teams: scoredTeams.sort((a, b) => b.relevance - a.relevance),
				users: scoredUsers.sort((a, b) => b.relevance - a.relevance),
			};
		}),

	// Get workspace by ID
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: input.id,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new Error("Access denied");
			}

			return ctx.db.workspace.findUnique({
				where: { id: input.id },
			});
		}),

	// Update workspace
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z
					.string()
					.min(WORKSPACE_NAME_MIN)
					.max(WORKSPACE_NAME_MAX)
					.optional(),
				slug: z
					.string()
					.min(WORKSPACE_SLUG_MIN)
					.max(WORKSPACE_SLUG_MAX)
					.optional(),
				settings: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Check if user is admin
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: id,
					userId: ctx.session.user.id,
					role: "ADMIN",
				},
			});

			if (!membership) {
				throw new Error("Only workspace admins can update workspace settings");
			}

			// If slug is being updated, check for uniqueness
			if (data.slug) {
				const existing = await ctx.db.workspace.findUnique({
					where: { slug: data.slug },
				});
				if (existing && existing.id !== id) {
					throw new Error("Slug is already taken");
				}
			}

			return ctx.db.workspace.update({
				where: { id },
				data,
			});
		}),

	// Delete workspace
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Check if user is admin
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: input.id,
					userId: ctx.session.user.id,
					role: "ADMIN",
				},
			});

			if (!membership) {
				throw new Error("Only workspace admins can delete the workspace");
			}

			// Check if there are other admins
			const adminCount = await ctx.db.workspaceMember.count({
				where: {
					workspaceId: input.id,
					role: "ADMIN",
				},
			});

			if (adminCount < 1) {
				throw new Error("Workspace must have at least one admin");
			}

			await ctx.db.workspace.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),
});
