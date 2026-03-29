import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { CustomFieldType } from "../../../../generated/prisma";

const customFieldTypeSchema = z.nativeEnum(CustomFieldType);

const createCustomFieldInput = z.object({
	name: z.string().min(1).max(50),
	type: customFieldTypeSchema,
	description: z.string().max(200).optional(),
	options: z.array(z.string()).optional(), // For SELECT and MULTI_SELECT types
	workspaceId: z.string(),
	teamId: z.string().optional(),
});

const updateCustomFieldInput = z.object({
	id: z.string(),
	name: z.string().min(1).max(50).optional(),
	description: z.string().max(200).optional(),
	options: z.array(z.string()).optional(),
	order: z.number().int().optional(),
});

const customFieldIdSchema = z.object({
	id: z.string(),
});

const listCustomFieldsInput = z.object({
	workspaceId: z.string(),
	teamId: z.string().optional(),
});

const setCustomFieldValueInput = z.object({
	issueId: z.string(),
	customFieldId: z.string(),
	value: z.unknown(), // Will be validated based on field type
});

export const customFieldRouter = createTRPCRouter({
	// Create a new custom field
	create: protectedProcedure
		.input(createCustomFieldInput)
		.mutation(async ({ ctx, input }) => {
			const { workspaceId, teamId, name, type, description, options } = input;

			// Check workspace membership
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

			// Verify options are provided for SELECT and MULTI_SELECT types
			if (
				(type === "SELECT" || type === "MULTI_SELECT") &&
				(!options || options.length === 0)
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Options are required for SELECT and MULTI_SELECT field types",
				});
			}

			// Verify team belongs to workspace if teamId is provided
			if (teamId) {
				const team = await ctx.db.team.findFirst({
					where: {
						id: teamId,
						workspaceId,
					},
				});

				if (!team) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Team not found",
					});
				}
			}

			// Get max order for the workspace/team
			const maxOrderField = await ctx.db.customField.findFirst({
				where: {
					workspaceId,
					teamId: teamId ?? null,
				},
				orderBy: {
					order: "desc",
				},
			});

			const order = (maxOrderField?.order ?? -1) + 1;

			const customField = await ctx.db.customField.create({
				data: {
					name,
					type,
					description,
					options: options ? JSON.stringify(options) : null,
					order,
					workspaceId,
					teamId,
				},
				include: {
					team: true,
					workspace: true,
				},
			});

			return customField;
		}),

	// Get custom field by ID
	byId: protectedProcedure
		.input(customFieldIdSchema)
		.query(async ({ ctx, input }) => {
			const customField = await ctx.db.customField.findUnique({
				where: { id: input.id },
				include: {
					team: true,
					workspace: true,
					values: {
						include: {
							issue: {
								include: {
									team: true,
									assignee: true,
								},
							},
						},
					},
				},
			});

			if (!customField) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Custom field not found",
				});
			}

			// Check workspace access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: customField.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this custom field",
				});
			}

			return {
				...customField,
				options: customField.options ? JSON.parse(customField.options) : null,
			};
		}),

	// Update a custom field
	update: protectedProcedure
		.input(updateCustomFieldInput)
		.mutation(async ({ ctx, input }) => {
			const { id, name, description, options, order } = input;

			const existingField = await ctx.db.customField.findUnique({
				where: { id },
			});

			if (!existingField) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Custom field not found",
				});
			}

			// Check workspace access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: existingField.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this custom field",
				});
			}

			// If options are being updated, validate they're provided for SELECT types
			if (options !== undefined) {
				if (
					(existingField.type === "SELECT" ||
						existingField.type === "MULTI_SELECT") &&
					options.length === 0
				) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message:
							"Options are required for SELECT and MULTI_SELECT field types",
					});
				}
			}

			const customField = await ctx.db.customField.update({
				where: { id },
				data: {
					...(name !== undefined && { name }),
					...(description !== undefined && { description }),
					...(options !== undefined && { options: JSON.stringify(options) }),
					...(order !== undefined && { order }),
				},
				include: {
					team: true,
					workspace: true,
				},
			});

			return {
				...customField,
				options: customField.options ? JSON.parse(customField.options) : null,
			};
		}),

	// Delete a custom field
	delete: protectedProcedure
		.input(customFieldIdSchema)
		.mutation(async ({ ctx, input }) => {
			const customField = await ctx.db.customField.findUnique({
				where: { id: input.id },
			});

			if (!customField) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Custom field not found",
				});
			}

			// Check workspace access
			const membership = await ctx.db.workspaceMember.findFirst({
				where: {
					workspaceId: customField.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			if (!membership) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this custom field",
				});
			}

			await ctx.db.customField.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	// List custom fields
	list: protectedProcedure
		.input(listCustomFieldsInput)
		.query(async ({ ctx, input }) => {
			const { workspaceId, teamId } = input;

			// Check workspace membership
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

			const where: Record<string, unknown> = {
				workspaceId,
			};

			if (teamId) {
				where.OR = [{ teamId }, { teamId: null }];
			}

			const customFields = await ctx.db.customField.findMany({
				where,
				include: {
					team: true,
					_count: {
						select: {
							values: true,
						},
					},
				},
				orderBy: [{ order: "asc" }, { createdAt: "asc" }],
			});

			return customFields.map((field) => ({
				...field,
				options: field.options ? JSON.parse(field.options) : null,
			}));
		}),

	// Reorder custom fields
	reorder: protectedProcedure
		.input(
			z.object({
				workspaceId: z.string(),
				teamId: z.string().optional(),
				fieldIds: z.array(z.string()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { workspaceId, teamId: _teamId, fieldIds } = input;

			// Check workspace membership
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

			// Update order for each field
			await Promise.all(
				fieldIds.map((fieldId, index) =>
					ctx.db.customField.update({
						where: { id: fieldId },
						data: { order: index },
					}),
				),
			);

			return { success: true };
		}),

	// Set custom field value on an issue
	setValue: protectedProcedure
		.input(setCustomFieldValueInput)
		.mutation(async ({ ctx, input }) => {
			const { issueId, customFieldId, value } = input;

			// Verify issue exists
			const issue = await ctx.db.issue.findUnique({
				where: { id: issueId },
			});

			if (!issue) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Issue not found",
				});
			}

			// Verify custom field exists and belongs to same workspace
			const customField = await ctx.db.customField.findUnique({
				where: { id: customFieldId },
			});

			if (!customField) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Custom field not found",
				});
			}

			if (customField.workspaceId !== issue.workspaceId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Custom field does not belong to this workspace",
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

			// Validate value based on field type
			const validatedValue = validateCustomFieldValue(
				customField.type,
				value,
				customField.options ? JSON.parse(customField.options) : null,
			);

			// Upsert the value
			const fieldValue = await ctx.db.customFieldValue.upsert({
				where: {
					customFieldId_issueId: {
						customFieldId,
						issueId,
					},
				},
				create: {
					customFieldId,
					issueId,
					value: JSON.stringify(validatedValue),
				},
				update: {
					value: JSON.stringify(validatedValue),
				},
				include: {
					customField: true,
					issue: true,
				},
			});

			return {
				...fieldValue,
				value: validatedValue,
			};
		}),

	// Get custom field values for an issue
	getIssueValues: protectedProcedure
		.input(z.object({ issueId: z.string() }))
		.query(async ({ ctx, input }) => {
			const { issueId } = input;

			// Verify issue exists
			const issue = await ctx.db.issue.findUnique({
				where: { id: issueId },
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

			const values = await ctx.db.customFieldValue.findMany({
				where: { issueId },
				include: {
					customField: true,
				},
			});

			return values.map((v) => ({
				...v,
				value: JSON.parse(v.value),
			}));
		}),

	// Delete custom field value from an issue
	deleteValue: protectedProcedure
		.input(
			z.object({
				issueId: z.string(),
				customFieldId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { issueId, customFieldId } = input;

			// Verify issue exists
			const issue = await ctx.db.issue.findUnique({
				where: { id: issueId },
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

			await ctx.db.customFieldValue.delete({
				where: {
					customFieldId_issueId: {
						customFieldId,
						issueId,
					},
				},
			});

			return { success: true };
		}),
});

// Helper function to validate and normalize custom field values
function validateCustomFieldValue(
	type: CustomFieldType,
	value: unknown,
	options: string[] | null,
): unknown {
	switch (type) {
		case "TEXT":
			if (typeof value !== "string") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "TEXT field requires a string value",
				});
			}
			return value;

		case "NUMBER":
			if (typeof value !== "number" || Number.isNaN(value)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "NUMBER field requires a numeric value",
				});
			}
			return value;

		case "URL":
			if (typeof value !== "string") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "URL field requires a string value",
				});
			}
			// Basic URL validation
			try {
				new URL(value);
			} catch {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid URL format",
				});
			}
			return value;

		case "DATE": {
			if (typeof value !== "string") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "DATE field requires an ISO date string",
				});
			}
			// Validate date format
			const date = new Date(value);
			if (Number.isNaN(date.getTime())) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid date format",
				});
			}
			return value;
		}

		case "SELECT":
			if (typeof value !== "string") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "SELECT field requires a string value",
				});
			}
			if (options && !options.includes(value)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Invalid option. Must be one of: ${options.join(", ")}`,
				});
			}
			return value;

		case "MULTI_SELECT":
			if (!Array.isArray(value)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "MULTI_SELECT field requires an array of strings",
				});
			}
			if (!value.every((v) => typeof v === "string")) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "MULTI_SELECT field requires an array of strings",
				});
			}
			if (options) {
				const invalidOptions = value.filter((v) => !options.includes(v));
				if (invalidOptions.length > 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Invalid options: ${invalidOptions.join(", ")}`,
					});
				}
			}
			return value;

		default:
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Unknown field type: ${type}`,
			});
	}
}
