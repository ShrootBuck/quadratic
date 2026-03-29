import { createHash, randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	API_KEY_EXPIRY_MAX,
	API_KEY_EXPIRY_MIN,
	API_KEY_NAME_MAX,
	API_KEY_NAME_MIN,
	PAGINATION_MAX_LIMIT,
} from "~/constants";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// API Key scope enum
const ApiKeyScope = z.enum(["READ", "WRITE", "ADMIN"]);

// Webhook event enum
const WebhookEvent = z.enum([
	"ISSUE_CREATED",
	"ISSUE_UPDATED",
	"ISSUE_DELETED",
]);

// Webhook status enum
const WebhookStatus = z.enum(["ACTIVE", "PAUSED", "FAILED"]);

// Generate a secure API key
function generateApiKey(): string {
	return `quad_${randomBytes(32).toString("hex")}`;
}

// Hash the API key for storage
function hashApiKey(key: string): string {
	return createHash("sha256").update(key).digest("hex");
}

// Generate webhook secret
function generateWebhookSecret(): string {
	return randomBytes(32).toString("hex");
}

// Create API key input
const createApiKeyInput = z.object({
	name: z.string().min(API_KEY_NAME_MIN).max(API_KEY_NAME_MAX),
	scope: ApiKeyScope.default("READ"),
	expiresInDays: z
		.number()
		.int()
		.min(API_KEY_EXPIRY_MIN)
		.max(API_KEY_EXPIRY_MAX)
		.optional(),
});

// Revoke API key input
const revokeApiKeyInput = z.object({
	id: z.string(),
});

// List API keys input
const listApiKeysInput = z.object({
	workspaceId: z.string(),
});

// Create webhook input
const createWebhookInput = z.object({
	name: z.string().min(API_KEY_NAME_MIN).max(API_KEY_NAME_MAX),
	url: z.string().url(),
	events: z.array(WebhookEvent).min(1),
});

// Update webhook input
const updateWebhookInput = z.object({
	id: z.string(),
	name: z.string().min(API_KEY_NAME_MIN).max(API_KEY_NAME_MAX).optional(),
	url: z.string().url().optional(),
	events: z.array(WebhookEvent).min(1).optional(),
	status: WebhookStatus.optional(),
});

// List webhooks input
const listWebhooksInput = z.object({
	workspaceId: z.string(),
});

// Webhook deliveries input
const webhookDeliveriesInput = z.object({
	webhookId: z.string(),
	limit: z.number().min(1).max(PAGINATION_MAX_LIMIT).default(50),
});

export const apiKeysRouter = createTRPCRouter({
	// Create a new API key
	create: protectedProcedure
		.input(createApiKeyInput)
		.mutation(async ({ ctx, input }) => {
			// Get user's workspace
			const membership = await ctx.db.workspaceMember.findFirst({
				where: { userId: ctx.session.user.id },
				include: { workspace: true },
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a member of any workspace",
				});
			}

			// Generate the API key and hash
			const apiKey = generateApiKey();
			const keyHash = hashApiKey(apiKey);
			const keyPrefix = apiKey.slice(0, 12);

			// Calculate expiration if provided
			const expiresAt = input.expiresInDays
				? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
				: null;

			await ctx.db.apiKey.create({
				data: {
					name: input.name,
					keyHash,
					keyPrefix,
					scope: input.scope,
					expiresAt,
					workspaceId: membership.workspaceId,
					createdById: ctx.session.user.id,
				},
			});

			// Return the actual key - this is the only time it will be shown
			return {
				success: true,
				apiKey,
				message: "Copy this key now - it won't be shown again!",
			};
		}),

	// List API keys for workspace
	list: protectedProcedure
		.input(listApiKeysInput)
		.query(async ({ ctx, input }) => {
			// Verify user has access to workspace
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: input.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this workspace",
				});
			}

			const apiKeys = await ctx.db.apiKey.findMany({
				where: {
					workspaceId: input.workspaceId,
					isRevoked: false,
				},
				select: {
					id: true,
					name: true,
					keyPrefix: true,
					scope: true,
					lastUsedAt: true,
					expiresAt: true,
					createdAt: true,
				},
				orderBy: { createdAt: "desc" },
			});

			return apiKeys;
		}),

	// Revoke an API key
	revoke: protectedProcedure
		.input(revokeApiKeyInput)
		.mutation(async ({ ctx, input }) => {
			const apiKey = await ctx.db.apiKey.findUnique({
				where: { id: input.id },
			});

			if (!apiKey) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "API key not found",
				});
			}

			// Verify user has access to workspace
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: apiKey.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to revoke this API key",
				});
			}

			await ctx.db.apiKey.update({
				where: { id: input.id },
				data: {
					isRevoked: true,
					revokedAt: new Date(),
					revokedById: ctx.session.user.id,
				},
			});

			return { success: true };
		}),

	// Create a webhook
	createWebhook: protectedProcedure
		.input(createWebhookInput)
		.mutation(async ({ ctx, input }) => {
			// Get user's workspace
			const membership = await ctx.db.workspaceMember.findFirst({
				where: { userId: ctx.session.user.id },
				include: { workspace: true },
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a member of any workspace",
				});
			}

			const secret = generateWebhookSecret();

			const webhook = await ctx.db.webhook.create({
				data: {
					name: input.name,
					url: input.url,
					events: JSON.stringify(input.events),
					secret,
					workspaceId: membership.workspaceId,
					createdById: ctx.session.user.id,
				},
			});

			return {
				...webhook,
				events: input.events,
				secret, // Only returned on creation
			};
		}),

	// List webhooks for workspace
	listWebhooks: protectedProcedure
		.input(listWebhooksInput)
		.query(async ({ ctx, input }) => {
			// Verify user has access to workspace
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: input.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this workspace",
				});
			}

			const webhooks = await ctx.db.webhook.findMany({
				where: {
					workspaceId: input.workspaceId,
				},
				include: {
					_count: {
						select: {
							deliveries: {
								where: {
									createdAt: {
										gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
									},
								},
							},
						},
					},
				},
				orderBy: { createdAt: "desc" },
			});

			return webhooks.map((webhook) => ({
				...webhook,
				events: JSON.parse(webhook.events) as string[],
				secret: undefined, // Never return the secret
			}));
		}),

	// Update a webhook
	updateWebhook: protectedProcedure
		.input(updateWebhookInput)
		.mutation(async ({ ctx, input }) => {
			const webhook = await ctx.db.webhook.findUnique({
				where: { id: input.id },
			});

			if (!webhook) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Webhook not found",
				});
			}

			// Verify user has access to workspace
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: webhook.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to update this webhook",
				});
			}

			const updated = await ctx.db.webhook.update({
				where: { id: input.id },
				data: {
					...(input.name !== undefined && { name: input.name }),
					...(input.url !== undefined && { url: input.url }),
					...(input.events !== undefined && {
						events: JSON.stringify(input.events),
					}),
					...(input.status !== undefined && { status: input.status }),
				},
			});

			return {
				...updated,
				events: input.events ?? JSON.parse(updated.events),
				secret: undefined,
			};
		}),

	// Delete a webhook
	deleteWebhook: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const webhook = await ctx.db.webhook.findUnique({
				where: { id: input.id },
			});

			if (!webhook) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Webhook not found",
				});
			}

			// Verify user has access to workspace
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: webhook.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to delete this webhook",
				});
			}

			await ctx.db.webhook.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	// Get webhook deliveries
	deliveries: protectedProcedure
		.input(webhookDeliveriesInput)
		.query(async ({ ctx, input }) => {
			const webhook = await ctx.db.webhook.findUnique({
				where: { id: input.webhookId },
			});

			if (!webhook) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Webhook not found",
				});
			}

			// Verify user has access to workspace
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: webhook.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to view these deliveries",
				});
			}

			const deliveries = await ctx.db.webhookDelivery.findMany({
				where: {
					webhookId: input.webhookId,
				},
				orderBy: { createdAt: "desc" },
				take: input.limit,
			});

			return deliveries.map((delivery) => ({
				...delivery,
				payload: JSON.parse(delivery.payload) as Record<string, unknown>,
			}));
		}),
});
