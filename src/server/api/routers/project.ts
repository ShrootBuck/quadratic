import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	PAGINATION_MAX_LIMIT,
	PAGINATION_MIN_LIMIT,
	PROJECT_NAME_MAX,
	PROJECT_NAME_MIN,
} from "~/constants";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const ProjectStatus = z.enum([
	"PLANNED",
	"IN_PROGRESS",
	"COMPLETED",
	"CANCELLED",
]);

const createProjectInput = z.object({
	name: z.string().min(PROJECT_NAME_MIN).max(PROJECT_NAME_MAX),
	description: z.string().optional(),
	teamId: z.string(),
	workspaceId: z.string(),
	color: z.string().default("#5E6AD2"),
	leadId: z.string().optional(),
	startDate: z.date().optional(),
	targetDate: z.date().optional(),
});

const updateProjectInput = z.object({
	id: z.string(),
	name: z.string().min(PROJECT_NAME_MIN).max(PROJECT_NAME_MAX).optional(),
	description: z.string().optional(),
	status: ProjectStatus.optional(),
	leadId: z.string().optional().nullable(),
	startDate: z.date().optional().nullable(),
	targetDate: z.date().optional().nullable(),
	color: z.string().optional(),
});

const projectIdSchema = z.object({
	id: z.string(),
});

const listProjectsInput = z.object({
	workspaceId: z.string(),
	teamId: z.string().optional(),
	status: ProjectStatus.optional(),
	limit: z
		.number()
		.min(PAGINATION_MIN_LIMIT)
		.max(PAGINATION_MAX_LIMIT)
		.default(50),
	offset: z.number().min(0).default(0),
});

const archiveProjectInput = z.object({
	id: z.string(),
});

export const projectRouter = createTRPCRouter({
	// Create a new project
	create: protectedProcedure
		.input(createProjectInput)
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

			// Verify lead exists if provided
			if (input.leadId) {
				const lead = await ctx.db.user.findUnique({
					where: { id: input.leadId },
				});

				if (!lead) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Lead not found",
					});
				}
			}

			const project = await ctx.db.project.create({
				data: {
					name: input.name,
					description: input.description,
					workspaceId: input.workspaceId,
					teamId: input.teamId,
					color: input.color,
					leadId: input.leadId,
					startDate: input.startDate,
					targetDate: input.targetDate,
					status: "PLANNED",
				},
				include: {
					team: true,
					lead: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
					issues: {
						select: {
							id: true,
							status: true,
						},
					},
				},
			});

			return project;
		}),

	// Get a single project by ID
	getById: protectedProcedure
		.input(projectIdSchema)
		.query(async ({ ctx, input }) => {
			const project = await ctx.db.project.findUnique({
				where: { id: input.id },
				include: {
					team: true,
					lead: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
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

			if (!project) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Project not found",
				});
			}

			// Check workspace membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: project.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not a member of this workspace",
				});
			}

			return project;
		}),

	// List projects with filtering
	list: protectedProcedure
		.input(listProjectsInput)
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

			const [projects, total] = await Promise.all([
				ctx.db.project.findMany({
					where,
					include: {
						team: true,
						lead: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true,
							},
						},
						issues: {
							select: {
								id: true,
								status: true,
							},
						},
					},
					orderBy: { createdAt: "desc" },
					take: input.limit,
					skip: input.offset,
				}),
				ctx.db.project.count({ where }),
			]);

			return { projects, total };
		}),

	// Update a project
	update: protectedProcedure
		.input(updateProjectInput)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const existingProject = await ctx.db.project.findUnique({
				where: { id },
			});

			if (!existingProject) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Project not found",
				});
			}

			// Check workspace membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: existingProject.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not a member of this workspace",
				});
			}

			// Verify lead exists if provided
			if (data.leadId) {
				const lead = await ctx.db.user.findUnique({
					where: { id: data.leadId },
				});

				if (!lead) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Lead not found",
					});
				}
			}

			const project = await ctx.db.project.update({
				where: { id },
				data,
				include: {
					team: true,
					lead: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
					issues: {
						select: {
							id: true,
							status: true,
						},
					},
				},
			});

			return project;
		}),

	// Archive (soft delete) a project by setting status to CANCELLED
	archive: protectedProcedure
		.input(archiveProjectInput)
		.mutation(async ({ ctx, input }) => {
			const existingProject = await ctx.db.project.findUnique({
				where: { id: input.id },
			});

			if (!existingProject) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Project not found",
				});
			}

			// Check workspace membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: existingProject.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not a member of this workspace",
				});
			}

			const project = await ctx.db.project.update({
				where: { id: input.id },
				data: { status: "CANCELLED" },
				include: {
					team: true,
					lead: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
				},
			});

			return project;
		}),

	// Delete a project permanently
	delete: protectedProcedure
		.input(projectIdSchema)
		.mutation(async ({ ctx, input }) => {
			const existingProject = await ctx.db.project.findUnique({
				where: { id: input.id },
			});

			if (!existingProject) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Project not found",
				});
			}

			// Check workspace membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: existingProject.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not a member of this workspace",
				});
			}

			await ctx.db.project.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),
});
