import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const NotificationType = z.enum([
	"ASSIGNED",
	"MENTIONED",
	"STATUS_CHANGED",
	"COMMENTED",
	"ISSUE_CREATED",
	"CYCLE_STARTED",
	"CYCLE_ENDED",
]);

const listNotificationsInput = z.object({
	workspaceId: z.string(),
	limit: z.number().min(1).max(50).default(20),
	offset: z.number().min(0).default(0),
	unreadOnly: z.boolean().default(false),
});

const markAsReadInput = z.object({
	id: z.string(),
});

const markAllAsReadInput = z.object({
	workspaceId: z.string(),
});

const createNotificationInput = z.object({
	type: NotificationType,
	title: z.string(),
	content: z.string().optional(),
	workspaceId: z.string(),
	userId: z.string(),
	issueId: z.string().optional(),
	actorId: z.string().optional(),
	mentionedInComment: z.boolean().optional(),
});

const updatePreferencesInput = z.object({
	workspaceId: z.string(),
	notifyOnAssign: z.boolean().optional(),
	notifyOnMention: z.boolean().optional(),
	notifyOnStatusChange: z.boolean().optional(),
	notifyOnComment: z.boolean().optional(),
	notifyOnIssueCreated: z.boolean().optional(),
	notifyOnCycleStart: z.boolean().optional(),
	notifyOnCycleEnd: z.boolean().optional(),
});

export const notificationRouter = createTRPCRouter({
	// List notifications for the current user
	list: protectedProcedure
		.input(listNotificationsInput)
		.query(async ({ ctx, input }) => {
			const where = {
				userId: ctx.session.user.id,
				workspaceId: input.workspaceId,
				...(input.unreadOnly ? { read: false } : {}),
			};

			const [notifications, totalCount, unreadCount] = await Promise.all([
				ctx.db.notification.findMany({
					where,
					include: {
						issue: {
							include: {
								team: true,
							},
						},
						actor: {
							select: {
								id: true,
								name: true,
								image: true,
							},
						},
					},
					orderBy: { createdAt: "desc" },
					take: input.limit,
					skip: input.offset,
				}),
				ctx.db.notification.count({ where }),
				ctx.db.notification.count({
					where: {
						userId: ctx.session.user.id,
						workspaceId: input.workspaceId,
						read: false,
					},
				}),
			]);

			return {
				notifications,
				totalCount,
				unreadCount,
			};
		}),

	// Get unread count
	getUnreadCount: protectedProcedure
		.input(z.object({ workspaceId: z.string() }))
		.query(async ({ ctx, input }) => {
			const count = await ctx.db.notification.count({
				where: {
					userId: ctx.session.user.id,
					workspaceId: input.workspaceId,
					read: false,
				},
			});
			return count;
		}),

	// Mark a notification as read
	markAsRead: protectedProcedure
		.input(markAsReadInput)
		.mutation(async ({ ctx, input }) => {
			const notification = await ctx.db.notification.findUnique({
				where: { id: input.id },
			});

			if (!notification) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Notification not found",
				});
			}

			if (notification.userId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not authorized to mark this notification as read",
				});
			}

			const updated = await ctx.db.notification.update({
				where: { id: input.id },
				data: { read: true },
			});

			return updated;
		}),

	// Mark all notifications as read
	markAllAsRead: protectedProcedure
		.input(markAllAsReadInput)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.notification.updateMany({
				where: {
					userId: ctx.session.user.id,
					workspaceId: input.workspaceId,
					read: false,
				},
				data: { read: true },
			});

			return { success: true };
		}),

	// Create a notification (internal use)
	create: protectedProcedure
		.input(createNotificationInput)
		.mutation(async ({ ctx, input }) => {
			// Check if the user has notification preferences
			const preferences = await ctx.db.notificationPreferences.findFirst({
				where: {
					userId: input.userId,
					workspaceId: input.workspaceId,
				},
			});

			// Check if this notification type is enabled
			if (preferences) {
				const shouldNotify = (() => {
					switch (input.type) {
						case "ASSIGNED":
							return preferences.notifyOnAssign;
						case "MENTIONED":
							return preferences.notifyOnMention;
						case "STATUS_CHANGED":
							return preferences.notifyOnStatusChange;
						case "COMMENTED":
							return preferences.notifyOnComment;
						case "ISSUE_CREATED":
							return preferences.notifyOnIssueCreated;
						case "CYCLE_STARTED":
							return preferences.notifyOnCycleStart;
						case "CYCLE_ENDED":
							return preferences.notifyOnCycleEnd;
						default:
							return true;
					}
				})();

				if (!shouldNotify) {
					return null;
				}
			}

			const notification = await ctx.db.notification.create({
				data: {
					type: input.type,
					title: input.title,
					content: input.content,
					workspaceId: input.workspaceId,
					userId: input.userId,
					issueId: input.issueId,
					actorId: input.actorId,
					mentionedInComment: input.mentionedInComment,
				},
			});

			return notification;
		}),

	// Get notification preferences
	getPreferences: protectedProcedure
		.input(z.object({ workspaceId: z.string() }))
		.query(async ({ ctx, input }) => {
			let preferences = await ctx.db.notificationPreferences.findFirst({
				where: {
					userId: ctx.session.user.id,
					workspaceId: input.workspaceId,
				},
			});

			// Create default preferences if not exists
			if (!preferences) {
				preferences = await ctx.db.notificationPreferences.create({
					data: {
						userId: ctx.session.user.id,
						workspaceId: input.workspaceId,
					},
				});
			}

			return preferences;
		}),

	// Update notification preferences
	updatePreferences: protectedProcedure
		.input(updatePreferencesInput)
		.mutation(async ({ ctx, input }) => {
			const { workspaceId, ...data } = input;

			// Check if preferences exist
			const existing = await ctx.db.notificationPreferences.findFirst({
				where: {
					userId: ctx.session.user.id,
					workspaceId: input.workspaceId,
				},
			});

			if (existing) {
				return await ctx.db.notificationPreferences.update({
					where: { id: existing.id },
					data,
				});
			} else {
				return await ctx.db.notificationPreferences.create({
					data: {
						userId: ctx.session.user.id,
						workspaceId: input.workspaceId,
						...data,
					},
				});
			}
		}),
});
