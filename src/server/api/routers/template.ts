import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Enums for validation
const IssueStatus = z.enum([
	"BACKLOG",
	"TODO",
	"IN_PROGRESS",
	"DONE",
	"CANCELLED",
]);
const Priority = z.enum(["NO_PRIORITY", "LOW", "MEDIUM", "HIGH", "URGENT"]);

// Schemas
const createTemplateInput = z.object({
	name: z.string().min(1).max(100),
	description: z.string().max(500).optional(),
	title: z.string().max(500),
	content: z.string().optional(),
	priority: Priority.default("NO_PRIORITY"),
	status: IssueStatus.default("BACKLOG"),
	workspaceId: z.string(),
	teamId: z.string().optional(),
	labelIds: z.array(z.string()).default([]),
});

const updateTemplateInput = z.object({
	id: z.string(),
	name: z.string().min(1).max(100).optional(),
	description: z.string().max(500).optional(),
	title: z.string().max(500).optional(),
	content: z.string().optional(),
	priority: Priority.optional(),
	status: IssueStatus.optional(),
	teamId: z.string().optional().nullable(),
	labelIds: z.array(z.string()).optional(),
});

const templateIdSchema = z.object({
	id: z.string(),
});

const listTemplatesInput = z.object({
	workspaceId: z.string(),
	teamId: z.string().optional(),
	includeDefaults: z.boolean().default(true),
});

// Default templates data
const defaultTemplates = [
	{
		name: "Bug Report",
		description: "Template for reporting bugs and issues",
		title: "[Bug] ",
		content: JSON.stringify({
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Bug Description" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Describe the bug you've encountered...",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Steps to Reproduce" }],
				},
				{
					type: "orderedList",
					content: [
						{
							type: "listItem",
							content: [{ type: "paragraph", content: [] }],
						},
						{
							type: "listItem",
							content: [{ type: "paragraph", content: [] }],
						},
						{
							type: "listItem",
							content: [{ type: "paragraph", content: [] }],
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Expected Behavior" }],
				},
				{
					type: "paragraph",
					content: [{ type: "text", text: "What should have happened..." }],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Actual Behavior" }],
				},
				{
					type: "paragraph",
					content: [{ type: "text", text: "What actually happened..." }],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Environment" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "OS: " }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Browser: " }],
								},
							],
						},
						{
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: "Version: " }],
								},
							],
						},
					],
				},
			],
		}),
		priority: "MEDIUM",
		status: "BACKLOG",
		labelIds: JSON.stringify([]),
	},
	{
		name: "Feature Request",
		description: "Template for requesting new features",
		title: "[Feature] ",
		content: JSON.stringify({
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Feature Description" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Describe the feature you'd like to see...",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Problem Statement" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "What problem does this feature solve?",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Proposed Solution" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "How should this feature work?",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Acceptance Criteria" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [{ type: "paragraph", content: [] }],
						},
						{
							type: "listItem",
							content: [{ type: "paragraph", content: [] }],
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 2 },
					content: [{ type: "text", text: "Additional Context" }],
				},
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Any other information, screenshots, or examples...",
						},
					],
				},
			],
		}),
		priority: "LOW",
		status: "BACKLOG",
		labelIds: JSON.stringify([]),
	},
	{
		name: "Task",
		description: "Simple task template for general work items",
		title: "",
		content: JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "Describe the task to be completed...",
						},
					],
				},
				{
					type: "heading",
					attrs: { level: 3 },
					content: [{ type: "text", text: "Definition of Done" }],
				},
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [{ type: "paragraph", content: [] }],
						},
					],
				},
			],
		}),
		priority: "NO_PRIORITY",
		status: "TODO",
		labelIds: JSON.stringify([]),
	},
];

export const templateRouter = createTRPCRouter({
	// List templates for a workspace
	list: protectedProcedure
		.input(listTemplatesInput)
		.query(async ({ ctx, input }) => {
			const { workspaceId, teamId, includeDefaults } = input;

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

			// Get default templates
			const defaultTemplateList = [];
			if (includeDefaults) {
				for (let index = 0; index < defaultTemplates.length; index++) {
					const t = defaultTemplates[index];
					if (t) {
						defaultTemplateList.push({
							...t,
							id: `default-${index}`,
							workspaceId,
							teamId: teamId || null,
							isDefault: true,
							createdAt: new Date(),
							updatedAt: new Date(),
							team: null,
						});
					}
				}
			}

			// Get custom templates from database
			const where: Record<string, unknown> = { workspaceId };
			if (teamId) {
				where.OR = [{ teamId }, { teamId: null }];
			}

			const dbTemplates = await ctx.db.template.findMany({
				where,
				include: {
					team: true,
				},
				orderBy: { createdAt: "desc" },
			});

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return [...defaultTemplateList, ...dbTemplates];
		}),

	// Get template by ID
	byId: protectedProcedure
		.input(templateIdSchema)
		.query(async ({ ctx, input }) => {
			const { id } = input;

			// Check if it's a default template
			if (id.startsWith("default-")) {
				const index = Number.parseInt(id.replace("default-", ""), 10);
				if (index >= 0 && index < defaultTemplates.length) {
					return {
						...defaultTemplates[index],
						id,
						isDefault: true,
					};
				}
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Template not found",
				});
			}

			const template = await ctx.db.template.findUnique({
				where: { id },
				include: {
					team: true,
					workspace: true,
				},
			});

			if (!template) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Template not found",
				});
			}

			// Check access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: template.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this template",
				});
			}

			return template;
		}),

	// Create a new template
	create: protectedProcedure
		.input(createTemplateInput)
		.mutation(async ({ ctx, input }) => {
			const { workspaceId, teamId, labelIds, ...data } = input;

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

			// Verify team exists and belongs to workspace if provided
			if (teamId) {
				const team = await ctx.db.team.findUnique({
					where: { id: teamId },
				});

				if (!team || team.workspaceId !== workspaceId) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Team not found",
					});
				}
			}

			const template = await ctx.db.template.create({
				data: {
					...data,
					workspaceId,
					teamId,
					labelIds: JSON.stringify(labelIds),
				},
				include: {
					team: true,
				},
			});

			return template;
		}),

	// Update a template
	update: protectedProcedure
		.input(updateTemplateInput)
		.mutation(async ({ ctx, input }) => {
			const { id, labelIds, ...data } = input;

			const existingTemplate = await ctx.db.template.findUnique({
				where: { id },
			});

			if (!existingTemplate) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Template not found",
				});
			}

			// Check access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: existingTemplate.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this template",
				});
			}

			const template = await ctx.db.template.update({
				where: { id },
				data: {
					...data,
					labelIds:
						labelIds !== undefined ? JSON.stringify(labelIds) : undefined,
				},
				include: {
					team: true,
				},
			});

			return template;
		}),

	// Delete a template
	delete: protectedProcedure
		.input(templateIdSchema)
		.mutation(async ({ ctx, input }) => {
			const { id } = input;

			const existingTemplate = await ctx.db.template.findUnique({
				where: { id },
			});

			if (!existingTemplate) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Template not found",
				});
			}

			// Check access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: existingTemplate.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this template",
				});
			}

			await ctx.db.template.delete({
				where: { id },
			});

			return { success: true };
		}),
});
