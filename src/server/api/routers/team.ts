import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	TEAM_KEY_MAX,
	TEAM_KEY_MIN,
	TEAM_NAME_MAX,
	TEAM_NAME_MIN,
} from "~/constants";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const createTeamInput = z.object({
	name: z.string().min(TEAM_NAME_MIN).max(TEAM_NAME_MAX),
	key: z.string().min(TEAM_KEY_MIN).max(TEAM_KEY_MAX).toUpperCase(),
	color: z.string().default("#5E6AD2"),
	workspaceId: z.string(),
});

const updateTeamInput = z.object({
	id: z.string(),
	name: z.string().min(TEAM_NAME_MIN).max(TEAM_NAME_MAX).optional(),
	key: z.string().min(TEAM_KEY_MIN).max(TEAM_KEY_MAX).toUpperCase().optional(),
	color: z.string().optional(),
});

const teamIdSchema = z.object({
	id: z.string(),
});

const listTeamsInput = z.object({
	workspaceId: z.string(),
});

const inviteMemberInput = z.object({
	teamId: z.string(),
	email: z.string().email(),
	role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

const removeMemberInput = z.object({
	teamId: z.string(),
	userId: z.string(),
});

export const teamRouter = createTRPCRouter({
	// Create a new team
	create: protectedProcedure
		.input(createTeamInput)
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

			// Check if team key already exists in workspace
			const existingTeam = await ctx.db.team.findFirst({
				where: {
					workspaceId: input.workspaceId,
					key: input.key,
				},
			});

			if (existingTeam) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Team key already exists in this workspace",
				});
			}

			const team = await ctx.db.team.create({
				data: {
					name: input.name,
					key: input.key,
					color: input.color,
					workspaceId: input.workspaceId,
				},
				include: {
					workspace: true,
				},
			});

			return team;
		}),

	// Get a single team by ID
	getById: protectedProcedure
		.input(teamIdSchema)
		.query(async ({ ctx, input }) => {
			const team = await ctx.db.team.findUnique({
				where: { id: input.id },
				include: {
					workspace: true,
					projects: {
						where: {
							status: {
								in: ["PLANNED", "IN_PROGRESS"],
							},
						},
						orderBy: { createdAt: "desc" },
					},
					cycles: {
						orderBy: { startDate: "desc" },
						take: 5,
					},
					issues: {
						include: {
							assignee: {
								select: {
									id: true,
									name: true,
									email: true,
									image: true,
								},
							},
							labels: {
								include: {
									label: true,
								},
							},
						},
						orderBy: { createdAt: "desc" },
						take: 20,
					},
				},
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
					message: "Not a member of this workspace",
				});
			}

			return team;
		}),

	// List all teams in a workspace
	list: protectedProcedure
		.input(listTeamsInput)
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

			const teams = await ctx.db.team.findMany({
				where: { workspaceId: input.workspaceId },
				include: {
					workspace: true,
					_count: {
						select: {
							issues: true,
							projects: true,
						},
					},
				},
				orderBy: { name: "asc" },
			});

			return teams;
		}),

	// Update a team
	update: protectedProcedure
		.input(updateTeamInput)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const existingTeam = await ctx.db.team.findUnique({
				where: { id },
			});

			if (!existingTeam) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found",
				});
			}

			// Check workspace membership
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: existingTeam.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not a member of this workspace",
				});
			}

			// Check if new key conflicts with existing team
			if (data.key && data.key !== existingTeam.key) {
				const conflictingTeam = await ctx.db.team.findFirst({
					where: {
						workspaceId: existingTeam.workspaceId,
						key: data.key,
						id: { not: id },
					},
				});

				if (conflictingTeam) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Team key already exists in this workspace",
					});
				}
			}

			const team = await ctx.db.team.update({
				where: { id },
				data,
				include: {
					workspace: true,
				},
			});

			return team;
		}),

	// Delete a team
	delete: protectedProcedure
		.input(teamIdSchema)
		.mutation(async ({ ctx, input }) => {
			const existingTeam = await ctx.db.team.findUnique({
				where: { id: input.id },
			});

			if (!existingTeam) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found",
				});
			}

			// Check workspace membership (only admins can delete teams)
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: existingTeam.workspaceId,
					userId: ctx.session.user.id,
					role: "ADMIN",
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only workspace admins can delete teams",
				});
			}

			// Check if team has issues
			const issueCount = await ctx.db.issue.count({
				where: { teamId: input.id },
			});

			if (issueCount > 0) {
				throw new TRPCError({
					code: "CONFLICT",
					message:
						"Cannot delete team with existing issues. Move or delete issues first.",
				});
			}

			await ctx.db.team.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	// Get team issues
	getIssues: protectedProcedure
		.input(
			z.object({
				teamId: z.string(),
				status: z
					.enum(["BACKLOG", "TODO", "IN_PROGRESS", "DONE", "CANCELLED"])
					.optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const team = await ctx.db.team.findUnique({
				where: { id: input.teamId },
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
					message: "Not a member of this workspace",
				});
			}

			const issues = await ctx.db.issue.findMany({
				where: {
					teamId: input.teamId,
					...(input.status && { status: input.status }),
				},
				include: {
					assignee: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
					labels: {
						include: {
							label: true,
						},
					},
					project: true,
					cycle: true,
				},
				orderBy: { createdAt: "desc" },
			});

			return issues;
		}),

	// Get team cycles
	getCycles: protectedProcedure
		.input(teamIdSchema)
		.query(async ({ ctx, input }) => {
			const team = await ctx.db.team.findUnique({
				where: { id: input.id },
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
					message: "Not a member of this workspace",
				});
			}

			const cycles = await ctx.db.cycle.findMany({
				where: { teamId: input.id },
				include: {
					issues: {
						select: {
							id: true,
							status: true,
						},
					},
				},
				orderBy: { startDate: "desc" },
			});

			return cycles;
		}),

	// Invite member to workspace (team-level invitation)
	inviteMember: protectedProcedure
		.input(inviteMemberInput)
		.mutation(async ({ ctx, input }) => {
			const team = await ctx.db.team.findUnique({
				where: { id: input.teamId },
			});

			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found",
				});
			}

			// Check workspace membership and role
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: team.workspaceId,
					userId: ctx.session.user.id,
					role: "ADMIN",
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only workspace admins can invite members",
				});
			}

			// Check if user already exists
			const existingUser = await ctx.db.user.findUnique({
				where: { email: input.email },
			});

			if (existingUser) {
				// Check if already a member
				const existingMembership = await ctx.db.workspaceMember.findFirst({
					where: {
						workspaceId: team.workspaceId,
						userId: existingUser.id,
					},
				});

				if (existingMembership) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "User is already a member of this workspace",
					});
				}

				// Add existing user to workspace
				await ctx.db.workspaceMember.create({
					data: {
						workspaceId: team.workspaceId,
						userId: existingUser.id,
						role: input.role,
					},
				});

				return { success: true, user: existingUser };
			}

			// For non-existing users, we would send an email invitation
			// For now, return error since we don't have email integration yet
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "User not found. Email invitations not yet implemented.",
			});
		}),

	// Get workspace members (for team member management)
	getMembers: protectedProcedure
		.input(z.union([teamIdSchema, z.object({ teamId: z.string() })]))
		.query(async ({ ctx, input }) => {
			const teamId = "id" in input ? input.id : input.teamId;
			const team = await ctx.db.team.findUnique({
				where: { id: teamId },
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
					message: "Not a member of this workspace",
				});
			}

			const members = await ctx.db.workspaceMember.findMany({
				where: { workspaceId: team.workspaceId },
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
				},
				orderBy: { joinedAt: "asc" },
			});

			return members;
		}),

	// Remove member from workspace
	removeMember: protectedProcedure
		.input(removeMemberInput)
		.mutation(async ({ ctx, input }) => {
			const team = await ctx.db.team.findUnique({
				where: { id: input.teamId },
			});

			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found",
				});
			}

			// Check workspace membership and role
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: team.workspaceId,
					userId: ctx.session.user.id,
					role: "ADMIN",
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only workspace admins can remove members",
				});
			}

			// Cannot remove yourself
			if (input.userId === ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Cannot remove yourself from the workspace",
				});
			}

			await ctx.db.workspaceMember.deleteMany({
				where: {
					workspaceId: team.workspaceId,
					userId: input.userId,
				},
			});

			return { success: true };
		}),
});
