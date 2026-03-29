import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
	// Get current user profile
	getCurrent: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.db.user.findUnique({
			where: { id: ctx.session.user.id },
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
				preferences: true,
				createdAt: true,
			},
		});

		return user;
	}),

	// Update user profile
	updateProfile: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).max(100).optional(),
				image: z.string().url().optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const user = await ctx.db.user.update({
				where: { id: ctx.session.user.id },
				data: {
					...(input.name !== undefined && { name: input.name }),
					...(input.image !== undefined && { image: input.image }),
				},
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
				},
			});

			return user;
		}),

	// Get user preferences (theme, density, etc.)
	getPreferences: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.db.user.findUnique({
			where: { id: ctx.session.user.id },
			select: {
				preferences: true,
			},
		});

		if (!user?.preferences) {
			return {
				theme: "system",
				density: "default",
			};
		}

		try {
			const prefs = JSON.parse(user.preferences);
			return {
				theme: prefs.theme ?? "system",
				density: prefs.density ?? "default",
			};
		} catch {
			return {
				theme: "system",
				density: "default",
			};
		}
	}),

	// Update user preferences
	updatePreferences: protectedProcedure
		.input(
			z.object({
				theme: z.enum(["light", "dark", "system"]).optional(),
				density: z.enum(["compact", "default", "comfortable"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const user = await ctx.db.user.findUnique({
				where: { id: ctx.session.user.id },
				select: { preferences: true },
			});

			let currentPrefs = {};
			if (user?.preferences) {
				try {
					currentPrefs = JSON.parse(user.preferences);
				} catch {
					currentPrefs = {};
				}
			}

			const newPrefs = {
				...currentPrefs,
				...(input.theme !== undefined && { theme: input.theme }),
				...(input.density !== undefined && { density: input.density }),
			};

			const updated = await ctx.db.user.update({
				where: { id: ctx.session.user.id },
				data: {
					preferences: JSON.stringify(newPrefs),
				},
				select: {
					preferences: true,
				},
			});

			return updated;
		}),
});
