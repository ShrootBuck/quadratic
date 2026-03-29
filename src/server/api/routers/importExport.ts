import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// CSV field mapping schema
const csvFieldMappingSchema = z.object({
	title: z.string().default("title"),
	description: z.string().default("description"),
	status: z.string().default("status"),
	priority: z.string().default("priority"),
	assigneeEmail: z.string().optional(),
	teamKey: z.string().default("team"),
	projectName: z.string().optional(),
	labels: z.string().optional(),
	createdAt: z.string().optional(),
});

// Export filters schema
const exportFiltersSchema = z.object({
	workspaceId: z.string(),
	teamId: z.string().optional(),
	projectId: z.string().optional(),
	status: z
		.enum(["BACKLOG", "TODO", "IN_PROGRESS", "DONE", "CANCELLED"])
		.optional(),
	priority: z
		.enum(["NO_PRIORITY", "LOW", "MEDIUM", "HIGH", "URGENT"])
		.optional(),
	assigneeId: z.string().optional(),
	labelIds: z.array(z.string()).optional(),
});

// Import preview item schema
const importPreviewItemSchema = z.object({
	title: z.string(),
	description: z.string().optional(),
	status: z
		.enum(["BACKLOG", "TODO", "IN_PROGRESS", "DONE", "CANCELLED"])
		.default("BACKLOG"),
	priority: z
		.enum(["NO_PRIORITY", "LOW", "MEDIUM", "HIGH", "URGENT"])
		.default("NO_PRIORITY"),
	assigneeEmail: z.string().optional(),
	teamKey: z.string().optional(),
	projectName: z.string().optional(),
	labels: z.array(z.string()).default([]),
});

// Linear issue format schema
const linearIssueSchema = z.object({
	id: z.string().optional(),
	identifier: z.string().optional(),
	title: z.string(),
	description: z.string().optional(),
	state: z
		.object({
			name: z.string(),
		})
		.optional(),
	priority: z.number().optional(),
	assignee: z
		.object({
			email: z.string(),
		})
		.optional(),
	team: z
		.object({
			key: z.string(),
		})
		.optional(),
	project: z
		.object({
			name: z.string(),
		})
		.optional(),
	labels: z
		.array(
			z.object({
				name: z.string(),
			}),
		)
		.optional(),
	createdAt: z.string().optional(),
	comments: z
		.array(
			z.object({
				body: z.string(),
				user: z.object({
					email: z.string(),
				}),
				createdAt: z.string(),
			}),
		)
		.optional(),
});

// GitHub issue format schema
const githubIssueSchema = z.object({
	number: z.number(),
	title: z.string(),
	body: z.string().nullable(),
	state: z.enum(["open", "closed"]),
	user: z.object({
		login: z.string(),
		email: z.string().optional(),
	}),
	assignee: z
		.object({
			login: z.string(),
			email: z.string().optional(),
		})
		.optional(),
	labels: z
		.array(
			z.object({
				name: z.string(),
				color: z.string().optional(),
			}),
		)
		.optional(),
	created_at: z.string(),
	updated_at: z.string(),
	comments: z
		.array(
			z.object({
				body: z.string(),
				user: z.object({
					login: z.string(),
				}),
				created_at: z.string(),
			}),
		)
		.optional(),
});

// Helper functions
function mapLinearStatus(
	stateName: string,
): "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED" {
	const stateMap: Record<
		string,
		"BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED"
	> = {
		Backlog: "BACKLOG",
		Todo: "TODO",
		"In Progress": "IN_PROGRESS",
		Done: "DONE",
		Canceled: "CANCELLED",
	};
	return stateMap[stateName] || "BACKLOG";
}

function mapLinearPriority(
	priority: number,
): "NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT" {
	const priorityMap: Record<
		number,
		"NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT"
	> = {
		0: "NO_PRIORITY",
		1: "URGENT",
		2: "HIGH",
		3: "MEDIUM",
		4: "LOW",
	};
	return priorityMap[priority] ?? "NO_PRIORITY";
}

function mapGitHubStatus(
	state: "open" | "closed",
): "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED" {
	return state === "open" ? "TODO" : "DONE";
}

function escapeCsvValue(value: string | null | undefined): string {
	if (value === null || value === undefined) return "";
	const escaped = value.replace(/"/g, '""');
	if (
		escaped.includes(",") ||
		escaped.includes('"') ||
		escaped.includes("\n")
	) {
		return `"${escaped}"`;
	}
	return escaped;
}

function parseCSV(csvText: string): Record<string, string>[] {
	const lines = csvText.trim().split("\n");
	if (lines.length < 2) return [];

	const firstLine = lines[0];
	if (!firstLine) return [];

	const headers = parseCSVLine(firstLine);
	const results: Record<string, string>[] = [];

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;
		const values = parseCSVLine(line);
		const row: Record<string, string> = {};
		headers.forEach((header, index) => {
			row[header] = values[index] ?? "";
		});
		results.push(row);
	}

	return results;
}

function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		const nextChar = line[i + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				current += '"';
				i++; // Skip next quote
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === "," && !inQuotes) {
			result.push(current.trim());
			current = "";
		} else {
			current += char;
		}
	}

	result.push(current.trim());
	return result;
}

export const importExportRouter = createTRPCRouter({
	// Export issues to CSV
	exportToCSV: protectedProcedure
		.input(exportFiltersSchema)
		.mutation(async ({ ctx, input }) => {
			const {
				workspaceId,
				teamId,
				projectId,
				status,
				priority,
				assigneeId,
				labelIds,
			} = input;

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

			// Build where clause
			const where: Record<string, unknown> = { workspaceId };
			if (teamId) where.teamId = teamId;
			if (projectId) where.projectId = projectId;
			if (status) where.status = status;
			if (priority) where.priority = priority;
			if (assigneeId) where.assigneeId = assigneeId;
			if (labelIds?.length) {
				where.labels = {
					some: {
						labelId: { in: labelIds },
					},
				};
			}

			// Get all issues with relations
			const issues = await ctx.db.issue.findMany({
				where,
				include: {
					team: true,
					project: true,
					assignee: true,
					creator: true,
					labels: {
						include: {
							label: true,
						},
					},
					comments: {
						include: {
							author: true,
						},
						orderBy: { createdAt: "asc" },
					},
					history: {
						include: {
							actor: true,
						},
						orderBy: { createdAt: "desc" },
					},
				},
				orderBy: { createdAt: "desc" },
			});

			// Generate CSV headers
			const headers = [
				"identifier",
				"title",
				"description",
				"status",
				"priority",
				"team",
				"project",
				"assignee",
				"assigneeEmail",
				"creator",
				"creatorEmail",
				"labels",
				"createdAt",
				"updatedAt",
				"dueDate",
				"comments",
			];

			// Generate CSV rows
			const rows = issues.map((issue) => {
				const comments = issue.comments
					.map(
						(c) =>
							`${c.author.name}: ${typeof c.content === "string" ? c.content : JSON.stringify(c.content)}`,
					)
					.join(" | ");

				return [
					escapeCsvValue(issue.identifier),
					escapeCsvValue(issue.title),
					escapeCsvValue(issue.description ?? ""),
					escapeCsvValue(issue.status),
					escapeCsvValue(issue.priority),
					escapeCsvValue(issue.team.name),
					escapeCsvValue(issue.project?.name ?? ""),
					escapeCsvValue(issue.assignee?.name ?? ""),
					escapeCsvValue(issue.assignee?.email ?? ""),
					escapeCsvValue(issue.creator.name),
					escapeCsvValue(issue.creator.email),
					escapeCsvValue(issue.labels.map((l) => l.label.name).join(", ")),
					escapeCsvValue(issue.createdAt.toISOString()),
					escapeCsvValue(issue.updatedAt.toISOString()),
					escapeCsvValue(issue.dueDate?.toISOString() ?? ""),
					escapeCsvValue(comments),
				];
			});

			// Combine into CSV string
			const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
				"\n",
			);

			return {
				csv,
				filename: `issues-export-${new Date().toISOString().split("T")[0]}.csv`,
				count: issues.length,
			};
		}),

	// Export issues to JSON
	exportToJSON: protectedProcedure
		.input(exportFiltersSchema)
		.mutation(async ({ ctx, input }) => {
			const {
				workspaceId,
				teamId,
				projectId,
				status,
				priority,
				assigneeId,
				labelIds,
			} = input;

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

			// Build where clause
			const where: Record<string, unknown> = { workspaceId };
			if (teamId) where.teamId = teamId;
			if (projectId) where.projectId = projectId;
			if (status) where.status = status;
			if (priority) where.priority = priority;
			if (assigneeId) where.assigneeId = assigneeId;
			if (labelIds?.length) {
				where.labels = {
					some: {
						labelId: { in: labelIds },
					},
				};
			}

			// Get all issues with relations
			const issues = await ctx.db.issue.findMany({
				where,
				include: {
					team: true,
					project: true,
					assignee: true,
					creator: true,
					labels: {
						include: {
							label: true,
						},
					},
					comments: {
						include: {
							author: true,
						},
						orderBy: { createdAt: "asc" },
					},
					history: {
						include: {
							actor: true,
						},
						orderBy: { createdAt: "desc" },
					},
				},
				orderBy: { createdAt: "desc" },
			});

			// Format for export
			const exportData = {
				exportDate: new Date().toISOString(),
				workspaceId,
				count: issues.length,
				issues: issues.map((issue) => ({
					id: issue.id,
					identifier: issue.identifier,
					number: issue.number,
					title: issue.title,
					description: issue.description,
					status: issue.status,
					priority: issue.priority,
					dueDate: issue.dueDate,
					createdAt: issue.createdAt,
					updatedAt: issue.updatedAt,
					team: {
						id: issue.team.id,
						name: issue.team.name,
						key: issue.team.key,
					},
					project: issue.project
						? {
								id: issue.project.id,
								name: issue.project.name,
								status: issue.project.status,
							}
						: null,
					assignee: issue.assignee
						? {
								id: issue.assignee.id,
								name: issue.assignee.name,
								email: issue.assignee.email,
							}
						: null,
					creator: {
						id: issue.creator.id,
						name: issue.creator.name,
						email: issue.creator.email,
					},
					labels: issue.labels.map((l) => ({
						id: l.label.id,
						name: l.label.name,
						color: l.label.color,
					})),
					comments: issue.comments.map((c) => ({
						id: c.id,
						content: c.content,
						author: {
							id: c.author.id,
							name: c.author.name,
							email: c.author.email,
						},
						createdAt: c.createdAt,
					})),
					history: issue.history.map((h) => ({
						id: h.id,
						field: h.field,
						oldValue: h.oldValue,
						newValue: h.newValue,
						actor: {
							id: h.actor.id,
							name: h.actor.name,
							email: h.actor.email,
						},
						createdAt: h.createdAt,
					})),
				})),
			};

			return {
				json: JSON.stringify(exportData, null, 2),
				filename: `issues-export-${new Date().toISOString().split("T")[0]}.json`,
				count: issues.length,
			};
		}),

	// Preview CSV import
	previewCSVImport: protectedProcedure
		.input(
			z.object({
				workspaceId: z.string(),
				csvData: z.string(),
				fieldMapping: csvFieldMappingSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { workspaceId, csvData, fieldMapping } = input;

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

			// Parse CSV
			const rows = parseCSV(csvData);
			if (rows.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No data found in CSV",
				});
			}

			// Get workspace data for validation
			const teams = await ctx.db.team.findMany({
				where: { workspaceId },
			});
			const projects = await ctx.db.project.findMany({
				where: { workspaceId },
			});
			const workspaceLabels = await ctx.db.label.findMany({
				where: { workspaceId },
			});
			const users = await ctx.db.workspaceMember.findMany({
				where: { workspaceId },
				include: { user: true },
			});

			// Validate and map rows
			const preview = rows.map((row, index) => {
				const title = row[fieldMapping.title]?.trim();
				const teamKey = row[fieldMapping.teamKey]?.trim();
				const status = row[fieldMapping.status]
					?.trim()
					.toUpperCase()
					.replace(/\s+/g, "_");
				const priority = row[fieldMapping.priority]
					?.trim()
					.toUpperCase()
					.replace(/\s+/g, "_");
				const assigneeEmail = fieldMapping.assigneeEmail
					? row[fieldMapping.assigneeEmail]?.trim()
					: undefined;
				const projectName = fieldMapping.projectName
					? row[fieldMapping.projectName]?.trim()
					: undefined;
				const labelsStr = fieldMapping.labels
					? row[fieldMapping.labels]?.trim()
					: "";

				// Validate required fields
				const errors: string[] = [];
				if (!title) errors.push("Title is required");
				if (!teamKey) errors.push("Team is required");

				// Validate team
				const team = teams.find((t) => t.key === teamKey);
				if (teamKey && !team) {
					errors.push(`Team '${teamKey}' not found`);
				}

				// Validate status
				const validStatus = [
					"BACKLOG",
					"TODO",
					"IN_PROGRESS",
					"DONE",
					"CANCELLED",
				].includes(status ?? "");
				const mappedStatus = validStatus
					? (status as
							| "BACKLOG"
							| "TODO"
							| "IN_PROGRESS"
							| "DONE"
							| "CANCELLED")
					: "BACKLOG";

				// Validate priority
				const validPriority = [
					"NO_PRIORITY",
					"LOW",
					"MEDIUM",
					"HIGH",
					"URGENT",
				].includes(priority ?? "");
				const mappedPriority = validPriority
					? (priority as "NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT")
					: "NO_PRIORITY";

				// Validate assignee
				let assigneeId: string | undefined;
				if (assigneeEmail) {
					const member = users.find((m) => m.user.email === assigneeEmail);
					if (member) {
						assigneeId = member.userId;
					} else {
						errors.push(`User with email '${assigneeEmail}' not found`);
					}
				}

				// Validate project
				let projectId: string | undefined;
				if (projectName) {
					const project = projects.find((p) => p.name === projectName);
					if (project) {
						projectId = project.id;
					} else {
						errors.push(`Project '${projectName}' not found`);
					}
				}

				// Parse labels
				const labelNames = labelsStr
					? labelsStr
							.split(",")
							.map((l) => l.trim())
							.filter(Boolean)
					: [];
				const labels: string[] = [];
				for (const labelName of labelNames) {
					const label = workspaceLabels.find((l) => l.name === labelName);
					if (label) {
						labels.push(label.id);
					}
				}

				return {
					row: index + 1,
					data: {
						title: title ?? "",
						description: fieldMapping.description
							? (row[fieldMapping.description]?.trim() ?? "")
							: "",
						status: mappedStatus,
						priority: mappedPriority,
						teamKey: teamKey ?? "",
						teamId: team?.id,
						assigneeEmail,
						assigneeId,
						projectName,
						projectId,
						labels,
					},
					errors,
					isValid: errors.length === 0,
				};
			});

			return {
				preview,
				totalRows: rows.length,
				validRows: preview.filter((p) => p.isValid).length,
				invalidRows: preview.filter((p) => !p.isValid).length,
			};
		}),

	// Import from CSV (after preview)
	importFromCSV: protectedProcedure
		.input(
			z.object({
				workspaceId: z.string(),
				items: z.array(
					importPreviewItemSchema.extend({
						teamId: z.string(),
						assigneeId: z.string().optional(),
						projectId: z.string().optional(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { workspaceId, items } = input;

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

			const results = [];
			const errors = [];

			for (const item of items) {
				try {
					// Get next issue number
					const lastIssue = await ctx.db.issue.findFirst({
						where: { teamId: item.teamId },
						orderBy: { number: "desc" },
					});
					const nextNumber = (lastIssue?.number ?? 0) + 1;

					// Get team key for identifier
					const team = await ctx.db.team.findUnique({
						where: { id: item.teamId },
					});

					if (!team) {
						errors.push({ item, error: "Team not found" });
						continue;
					}

					// Get workspace labels
					const labelIds: string[] = [];
					for (const labelName of item.labels) {
						const label = await ctx.db.label.findFirst({
							where: {
								workspaceId,
								name: labelName,
							},
						});
						if (label) {
							labelIds.push(label.id);
						}
					}

					// Create issue
					const issue = await ctx.db.issue.create({
						data: {
							identifier: `${team.key}-${nextNumber}`,
							number: nextNumber,
							title: item.title,
							description: item.description,
							status: item.status,
							priority: item.priority,
							workspaceId,
							teamId: item.teamId,
							projectId: item.projectId,
							assigneeId: item.assigneeId,
							creatorId: ctx.session.user.id,
							labels: {
								create: labelIds.map((labelId) => ({
									label: { connect: { id: labelId } },
								})),
							},
						},
					});

					results.push(issue);
				} catch (error) {
					errors.push({ item, error: String(error) });
				}
			}

			return {
				imported: results.length,
				errors: errors.length,
				details: errors,
			};
		}),

	// Preview Linear JSON import
	previewLinearImport: protectedProcedure
		.input(
			z.object({
				workspaceId: z.string(),
				jsonData: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { workspaceId, jsonData } = input;

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

			// Parse JSON
			let issues: unknown[];
			try {
				const parsed = JSON.parse(jsonData);
				issues = Array.isArray(parsed) ? parsed : (parsed.issues ?? []);
			} catch {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid JSON format",
				});
			}

			// Get workspace data for validation
			const teams = await ctx.db.team.findMany({
				where: { workspaceId },
			});
			const users = await ctx.db.workspaceMember.findMany({
				where: { workspaceId },
				include: { user: true },
			});
			const workspaceLabels = await ctx.db.label.findMany({
				where: { workspaceId },
			});

			// Validate each issue
			const preview = [];
			for (let i = 0; i < issues.length; i++) {
				const parseResult = linearIssueSchema.safeParse(issues[i]);
				const errors: string[] = [];

				if (!parseResult.success) {
					errors.push(`Invalid issue format: ${parseResult.error.message}`);
					preview.push({
						row: i + 1,
						data: issues[i],
						errors,
						isValid: false,
					});
					continue;
				}

				const issue = parseResult.data;

				// Validate team
				const teamKey = issue.team?.key;
				const team = teamKey ? teams.find((t) => t.key === teamKey) : null;
				if (teamKey && !team) {
					errors.push(`Team '${teamKey}' not found`);
				}

				// Validate assignee
				let assigneeId: string | undefined;
				if (issue.assignee?.email) {
					const member = users.find(
						(m) => m.user.email === issue.assignee?.email,
					);
					if (member) {
						assigneeId = member.userId;
					} else {
						errors.push(`User with email '${issue.assignee.email}' not found`);
					}
				}

				// Map labels
				const labels: string[] = [];
				if (issue.labels) {
					for (const label of issue.labels) {
						const existingLabel = workspaceLabels.find(
							(l) => l.name === label.name,
						);
						if (existingLabel) {
							labels.push(existingLabel.id);
						}
					}
				}

				preview.push({
					row: i + 1,
					data: {
						title: issue.title,
						description: issue.description ?? "",
						status: mapLinearStatus(issue.state?.name ?? ""),
						priority: mapLinearPriority(issue.priority ?? 0),
						teamKey: teamKey ?? "",
						teamId: team?.id,
						assigneeEmail: issue.assignee?.email,
						assigneeId,
						projectName: issue.project?.name,
						labels,
						comments: issue.comments?.map((c) => ({
							content: c.body,
							authorEmail: c.user.email,
							createdAt: c.createdAt,
						})),
					},
					errors,
					isValid: errors.length === 0,
				});
			}

			return {
				preview,
				totalRows: issues.length,
				validRows: preview.filter((p) => p.isValid).length,
				invalidRows: preview.filter((p) => !p.isValid).length,
			};
		}),

	// Import from Linear JSON
	importFromLinear: protectedProcedure
		.input(
			z.object({
				workspaceId: z.string(),
				items: z.array(
					importPreviewItemSchema.extend({
						teamId: z.string(),
						assigneeId: z.string().optional(),
						projectId: z.string().optional(),
						comments: z
							.array(
								z.object({
									content: z.string(),
									authorEmail: z.string(),
									createdAt: z.string(),
								}),
							)
							.optional(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { workspaceId, items } = input;

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

			const results = [];
			const errors = [];

			// Get all workspace members for comment authors
			const members = await ctx.db.workspaceMember.findMany({
				where: { workspaceId },
				include: { user: true },
			});

			for (const item of items) {
				try {
					// Get next issue number
					const lastIssue = await ctx.db.issue.findFirst({
						where: { teamId: item.teamId },
						orderBy: { number: "desc" },
					});
					const nextNumber = (lastIssue?.number ?? 0) + 1;

					// Get team
					const team = await ctx.db.team.findUnique({
						where: { id: item.teamId },
					});

					if (!team) {
						errors.push({ item, error: "Team not found" });
						continue;
					}

					// Create issue with comments
					const issue = await ctx.db.$transaction(async (tx) => {
						const newIssue = await tx.issue.create({
							data: {
								identifier: `${team.key}-${nextNumber}`,
								number: nextNumber,
								title: item.title,
								description: item.description,
								status: item.status,
								priority: item.priority,
								workspaceId,
								teamId: item.teamId,
								projectId: item.projectId,
								assigneeId: item.assigneeId,
								creatorId: ctx.session.user.id,
								labels: {
									create: item.labels.map((labelId) => ({
										label: { connect: { id: labelId } },
									})),
								},
							},
						});

						// Create comments if provided
						if (item.comments) {
							for (const comment of item.comments) {
								const author = members.find(
									(m) => m.user.email === comment.authorEmail,
								);
								if (author) {
									await tx.comment.create({
										data: {
											content: comment.content,
											issueId: newIssue.id,
											authorId: author.userId,
											createdAt: new Date(comment.createdAt),
										},
									});
								}
							}
						}

						return newIssue;
					});

					results.push(issue);
				} catch (error) {
					errors.push({ item, error: String(error) });
				}
			}

			return {
				imported: results.length,
				errors: errors.length,
				details: errors,
			};
		}),

	// Preview GitHub Issues import
	previewGitHubImport: protectedProcedure
		.input(
			z.object({
				workspaceId: z.string(),
				jsonData: z.string(),
				defaultTeamKey: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { workspaceId, jsonData, defaultTeamKey } = input;

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

			// Parse JSON
			let issues: unknown[];
			try {
				const parsed = JSON.parse(jsonData);
				issues = Array.isArray(parsed) ? parsed : [parsed];
			} catch {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid JSON format",
				});
			}

			// Get workspace data
			const teams = await ctx.db.team.findMany({
				where: { workspaceId },
			});
			const defaultTeam = teams.find((t) => t.key === defaultTeamKey);
			const users = await ctx.db.workspaceMember.findMany({
				where: { workspaceId },
				include: { user: true },
			});
			const workspaceLabels = await ctx.db.label.findMany({
				where: { workspaceId },
			});

			// Validate each issue
			const preview = [];
			for (let i = 0; i < issues.length; i++) {
				const parseResult = githubIssueSchema.safeParse(issues[i]);
				const errors: string[] = [];

				if (!parseResult.success) {
					errors.push(`Invalid issue format: ${parseResult.error.message}`);
					preview.push({
						row: i + 1,
						data: issues[i],
						errors,
						isValid: false,
					});
					continue;
				}

				const issue = parseResult.data;

				// Validate default team
				if (!defaultTeam) {
					errors.push(`Default team '${defaultTeamKey}' not found`);
				}

				// Validate assignee
				let assigneeId: string | undefined;
				if (issue.assignee?.email) {
					const member = users.find(
						(m) => m.user.email === issue.assignee?.email,
					);
					if (member) {
						assigneeId = member.userId;
					}
				}

				// Map labels
				const labels: string[] = [];
				if (issue.labels) {
					for (const label of issue.labels) {
						const existingLabel = workspaceLabels.find(
							(l) => l.name === label.name,
						);
						if (existingLabel) {
							labels.push(existingLabel.id);
						}
					}
				}

				preview.push({
					row: i + 1,
					data: {
						title: issue.title,
						description:
							issue.body ?? `Imported from GitHub issue #${issue.number}`,
						status: mapGitHubStatus(issue.state),
						priority: "NO_PRIORITY",
						teamKey: defaultTeamKey,
						teamId: defaultTeam?.id,
						assigneeEmail: issue.assignee?.email,
						assigneeId,
						labels,
						gitHubNumber: issue.number,
						comments: issue.comments?.map((c) => ({
							content: c.body,
							authorUsername: c.user.login,
							createdAt: c.created_at,
						})),
					},
					errors,
					isValid: errors.length === 0,
				});
			}

			return {
				preview,
				totalRows: issues.length,
				validRows: preview.filter((p) => p.isValid).length,
				invalidRows: preview.filter((p) => !p.isValid).length,
			};
		}),

	// Import from GitHub Issues
	importFromGitHub: protectedProcedure
		.input(
			z.object({
				workspaceId: z.string(),
				items: z.array(
					importPreviewItemSchema.extend({
						teamId: z.string(),
						assigneeId: z.string().optional(),
						gitHubNumber: z.number().optional(),
						comments: z
							.array(
								z.object({
									content: z.string(),
									authorUsername: z.string(),
									createdAt: z.string(),
								}),
							)
							.optional(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { workspaceId, items } = input;

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

			const results = [];
			const errors = [];

			for (const item of items) {
				try {
					// Get next issue number
					const lastIssue = await ctx.db.issue.findFirst({
						where: { teamId: item.teamId },
						orderBy: { number: "desc" },
					});
					const nextNumber = (lastIssue?.number ?? 0) + 1;

					// Get team
					const team = await ctx.db.team.findUnique({
						where: { id: item.teamId },
					});

					if (!team) {
						errors.push({ item, error: "Team not found" });
						continue;
					}

					// Create issue
					const issue = await ctx.db.issue.create({
						data: {
							identifier: `${team.key}-${nextNumber}`,
							number: nextNumber,
							title: item.title,
							description: item.description,
							status: item.status,
							priority: item.priority,
							workspaceId,
							teamId: item.teamId,
							assigneeId: item.assigneeId,
							creatorId: ctx.session.user.id,
							labels: {
								create: item.labels.map((labelId) => ({
									label: { connect: { id: labelId } },
								})),
							},
						},
					});

					results.push(issue);
				} catch (error) {
					errors.push({ item, error: String(error) });
				}
			}

			return {
				imported: results.length,
				errors: errors.length,
				details: errors,
			};
		}),
});
