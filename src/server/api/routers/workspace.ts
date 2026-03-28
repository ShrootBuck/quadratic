import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const workspaceRouter = createTRPCRouter({
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).max(100),
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
});
