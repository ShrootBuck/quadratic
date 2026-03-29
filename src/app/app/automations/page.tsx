"use client";

import { formatDistanceToNow } from "date-fns";
import {
	ChevronDown,
	ChevronUp,
	History,
	MoreHorizontal,
	Plus,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AUTOMATIONS_LIMIT } from "~/constants";
import { api } from "~/trpc/react";

// Types
interface Condition {
	id?: string;
	field: "team" | "project" | "label" | "priority";
	op: "equals" | "not_equals" | "contains" | "not_contains";
	value: string;
}

interface Action {
	id?: string;
	type:
		| "change_status"
		| "change_assignee"
		| "add_label"
		| "remove_label"
		| "update_priority"
		| "send_notification";
	params: Record<string, unknown>;
}

interface AutomationTemplate {
	id: string;
	name: string;
	description: string;
	trigger: string;
	conditions: Array<{
		field: string;
		op: string;
		value: string;
	}>;
	actions: Array<{
		type: string;
		params: Record<string, unknown>;
	}>;
}

export default function AutomationsPage() {
	const [selectedTeam, setSelectedTeam] = useState<string>("all");
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [selectedTemplate, setSelectedTemplate] =
		useState<AutomationTemplate | null>(null);
	const [logsDialogOpen, setLogsDialogOpen] = useState(false);
	const [selectedAutomationId, setSelectedAutomationId] = useState<
		string | null
	>(null);

	const { data: workspace } = api.workspace.getCurrent.useQuery();
	const { data: teams } = api.team.list.useQuery(
		{ workspaceId: workspace?.id ?? "" },
		{ enabled: !!workspace?.id },
	);
	const { data: automations, refetch } = api.automation.list.useQuery(
		{
			workspaceId: workspace?.id ?? "",
			teamId: selectedTeam === "all" ? undefined : selectedTeam,
		},
		{ enabled: !!workspace?.id },
	);
	const { data: templates } = api.automation.templates.useQuery();

	const toggleMutation = api.automation.toggle.useMutation({
		onSuccess: () => {
			refetch();
			toast.success("Automation updated");
		},
	});

	const deleteMutation = api.automation.delete.useMutation({
		onSuccess: () => {
			refetch();
			toast.success("Automation deleted");
		},
	});

	const handleToggle = (id: string, enabled: boolean) => {
		toggleMutation.mutate({ id, enabled });
	};

	const handleDelete = (id: string) => {
		if (confirm("Are you sure you want to delete this automation?")) {
			deleteMutation.mutate({ id });
		}
	};

	const handleCreateFromTemplate = (template: AutomationTemplate) => {
		setSelectedTemplate(template);
		setCreateDialogOpen(true);
	};

	const viewLogs = (automationId: string) => {
		setSelectedAutomationId(automationId);
		setLogsDialogOpen(true);
	};

	return (
		<div className="container mx-auto max-w-6xl p-6">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Workflow Automations
					</h1>
					<p className="mt-1 text-muted-foreground">
						Automate repetitive tasks and streamline your workflow with custom
						rules
					</p>
				</div>
				<div className="flex gap-3">
					<Select onValueChange={setSelectedTeam} value={selectedTeam}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Filter by team" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Teams</SelectItem>
							{teams?.map((team) => (
								<SelectItem key={team.id} value={team.id}>
									{team.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Dialog onOpenChange={setCreateDialogOpen} open={createDialogOpen}>
						<DialogTrigger asChild>
							<Button onClick={() => setSelectedTemplate(null)}>
								<Plus className="mr-2 h-4 w-4" />
								Create Automation
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl">
							<CreateAutomationDialog
								initialTemplate={selectedTemplate}
								onSuccess={() => {
									setCreateDialogOpen(false);
									refetch();
								}}
								teams={teams ?? []}
								templates={templates ?? []}
							/>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Templates Section */}
			<div className="mb-8">
				<h2 className="mb-4 font-semibold text-lg">Quick Start Templates</h2>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{templates?.map((template) => (
						<Card
							className="cursor-pointer transition-colors hover:border-primary/50"
							key={template.id}
							onClick={() => handleCreateFromTemplate(template)}
						>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">{template.name}</CardTitle>
								<CardDescription className="line-clamp-2 text-xs">
									{template.description}
								</CardDescription>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="flex items-center gap-2">
									<Badge className="text-xs" variant="secondary">
										{template.trigger.replace(/_/g, " ")}
									</Badge>
									<span className="text-muted-foreground text-xs">
										{template.actions.length} action
										{template.actions.length !== 1 ? "s" : ""}
									</span>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Active Automations */}
			<div>
				<h2 className="mb-4 font-semibold text-lg">Active Automations</h2>
				<div className="space-y-3">
					{automations?.length === 0 ? (
						<div className="rounded-lg border-2 border-dashed py-12 text-center">
							<p className="text-muted-foreground">
								No automations yet. Create one from a template or start from
								scratch.
							</p>
						</div>
					) : (
						automations?.map((automation) => (
							<Card key={automation.id}>
								<CardContent className="p-4">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="mb-1 flex items-center gap-3">
												<h3 className="font-medium">{automation.name}</h3>
												<Badge
													className="text-xs"
													variant={automation.enabled ? "default" : "secondary"}
												>
													{automation.enabled ? "Active" : "Disabled"}
												</Badge>
												{automation.team && (
													<Badge className="text-xs" variant="outline">
														{automation.team.key}
													</Badge>
												)}
											</div>
											<p className="mb-2 text-muted-foreground text-sm">
												{automation.description || "No description"}
											</p>
											<div className="flex items-center gap-2 text-muted-foreground text-xs">
												<span>
													Trigger: {automation.trigger.replace(/_/g, " ")}
												</span>
												<span>•</span>
												<span>
													{JSON.parse(automation.actions).length} action
													{JSON.parse(automation.actions).length !== 1
														? "s"
														: ""}
												</span>
												<span>•</span>
												<span>{automation._count.logs} executions</span>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Switch
												checked={automation.enabled}
												onCheckedChange={(checked) =>
													handleToggle(automation.id, checked)
												}
											/>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														className="h-8 w-8"
														size="icon"
														variant="ghost"
													>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => viewLogs(automation.id)}
													>
														<History className="mr-2 h-4 w-4" />
														View History
													</DropdownMenuItem>
													<DropdownMenuItem
														className="text-destructive"
														onClick={() => handleDelete(automation.id)}
													>
														<Trash2 className="mr-2 h-4 w-4" />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								</CardContent>
							</Card>
						))
					)}
				</div>
			</div>

			{/* Logs Dialog */}
			<Dialog onOpenChange={setLogsDialogOpen} open={logsDialogOpen}>
				<DialogContent className="max-h-[80vh] max-w-3xl">
					<DialogHeader>
						<DialogTitle>Automation History</DialogTitle>
						<DialogDescription>
							View execution history for this automation rule
						</DialogDescription>
					</DialogHeader>
					<AutomationLogs
						automationId={selectedAutomationId}
						workspaceId={workspace?.id ?? ""}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// Create Automation Dialog Component
function CreateAutomationDialog({
	templates: _templates,
	teams,
	initialTemplate,
	onSuccess,
}: {
	templates: AutomationTemplate[];
	teams: Array<{ id: string; name: string; key: string }>;
	initialTemplate: AutomationTemplate | null;
	onSuccess: () => void;
}) {
	const [name, setName] = useState(initialTemplate?.name ?? "");
	const [description, setDescription] = useState(
		initialTemplate?.description ?? "",
	);
	const [trigger, setTrigger] = useState(
		initialTemplate?.trigger ?? "ISSUE_CREATED",
	);
	const [teamId, setTeamId] = useState<string>("");
	const [conditions, setConditions] = useState<Condition[]>(
		(initialTemplate?.conditions as Condition[]) ?? [],
	);
	const [actions, setActions] = useState<Action[]>(
		(initialTemplate?.actions as Action[]) ?? [],
	);
	const [showAdvanced, setShowAdvanced] = useState(false);

	const createMutation = api.automation.create.useMutation({
		onSuccess: () => {
			toast.success("Automation created successfully");
			onSuccess();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate({
			name,
			description,
			trigger: trigger as
				| "ISSUE_CREATED"
				| "ISSUE_UPDATED"
				| "STATUS_CHANGED"
				| "ASSIGNEE_CHANGED"
				| "PRIORITY_CHANGED",
			conditions,
			actions,
			teamId: teamId || undefined,
		});
	};

	const addCondition = () => {
		setConditions([
			...conditions,
			{
				id: Math.random().toString(36).slice(2),
				field: "priority",
				op: "equals",
				value: "HIGH",
			},
		]);
	};

	const removeCondition = (index: number) => {
		setConditions(conditions.filter((_, i) => i !== index));
	};

	const updateCondition = (
		index: number,
		field: keyof Condition,
		value: string,
	) => {
		const newConditions = [...conditions];
		newConditions[index] = {
			...newConditions[index],
			[field]: value,
		} as Condition;
		setConditions(newConditions);
	};

	const addAction = () => {
		setActions([
			...actions,
			{
				id: Math.random().toString(36).slice(2),
				type: "change_status",
				params: { status: "IN_PROGRESS" },
			},
		]);
	};

	const removeAction = (index: number) => {
		setActions(actions.filter((_, i) => i !== index));
	};

	const updateAction = (index: number, updates: Partial<Action>) => {
		const newActions = [...actions];
		newActions[index] = { ...newActions[index], ...updates } as Action;
		setActions(newActions);
	};

	const updateActionParams = (
		index: number,
		params: Record<string, unknown>,
	) => {
		const newActions = [...actions];
		newActions[index] = { ...newActions[index], params } as Action;
		setActions(newActions);
	};

	return (
		<form onSubmit={handleSubmit}>
			<DialogHeader>
				<DialogTitle>Create Automation Rule</DialogTitle>
				<DialogDescription>
					Set up an automation to trigger actions when certain conditions are
					met.
				</DialogDescription>
			</DialogHeader>

			<ScrollArea className="max-h-[60vh] pr-4">
				<div className="space-y-6 py-4">
					{/* Basic Info */}
					<div className="space-y-4">
						<div>
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g., Auto-assign bugs to QA"
								required
								value={name}
							/>
						</div>
						<div>
							<Label htmlFor="description">Description (optional)</Label>
							<Textarea
								id="description"
								onChange={(e) => setDescription(e.target.value)}
								placeholder="What does this automation do?"
								rows={2}
								value={description}
							/>
						</div>
					</div>

					<Separator />

					{/* Trigger */}
					<div className="space-y-4">
						<Label>When this happens (Trigger)</Label>
						<Select onValueChange={setTrigger} value={trigger}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ISSUE_CREATED">Issue is created</SelectItem>
								<SelectItem value="ISSUE_UPDATED">Issue is updated</SelectItem>
								<SelectItem value="STATUS_CHANGED">
									Status is changed
								</SelectItem>
								<SelectItem value="ASSIGNEE_CHANGED">
									Assignee is changed
								</SelectItem>
								<SelectItem value="PRIORITY_CHANGED">
									Priority is changed
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<Separator />

					{/* Conditions */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label>If these conditions are met (optional)</Label>
							<Button
								onClick={addCondition}
								size="sm"
								type="button"
								variant="outline"
							>
								<Plus className="mr-1 h-3 w-3" />
								Add Condition
							</Button>
						</div>
						{conditions.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No conditions - automation will run on every trigger
							</p>
						) : (
							<div className="space-y-2">
								{conditions.map((condition, index) => (
									<div className="flex items-center gap-2" key={condition.id}>
										<Select
											onValueChange={(v) => updateCondition(index, "field", v)}
											value={condition.field}
										>
											<SelectTrigger className="w-[140px]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="team">Team</SelectItem>
												<SelectItem value="project">Project</SelectItem>
												<SelectItem value="label">Label</SelectItem>
												<SelectItem value="priority">Priority</SelectItem>
											</SelectContent>
										</Select>
										<Select
											onValueChange={(v) => updateCondition(index, "op", v)}
											value={condition.op}
										>
											<SelectTrigger className="w-[140px]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="equals">equals</SelectItem>
												<SelectItem value="not_equals">
													does not equal
												</SelectItem>
												<SelectItem value="contains">contains</SelectItem>
												<SelectItem value="not_contains">
													does not contain
												</SelectItem>
											</SelectContent>
										</Select>
										<Input
											className="flex-1"
											onChange={(e) =>
												updateCondition(index, "value", e.target.value)
											}
											placeholder="Value"
											value={condition.value}
										/>
										<Button
											onClick={() => removeCondition(index)}
											size="icon"
											type="button"
											variant="ghost"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						)}
					</div>

					<Separator />

					{/* Actions */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label>Then do these actions</Label>
							<Button
								onClick={addAction}
								size="sm"
								type="button"
								variant="outline"
							>
								<Plus className="mr-1 h-3 w-3" />
								Add Action
							</Button>
						</div>
						{actions.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								Add at least one action
							</p>
						) : (
							<div className="space-y-3">
								{actions.map((action, index) => (
									<div
										className="space-y-3 rounded-lg border p-3"
										key={action.id}
									>
										<div className="flex items-center gap-2">
											<Select
												onValueChange={(v) =>
													updateAction(index, { type: v as Action["type"] })
												}
												value={action.type}
											>
												<SelectTrigger className="w-[200px]">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="change_status">
														Change status to
													</SelectItem>
													<SelectItem value="change_assignee">
														Change assignee to
													</SelectItem>
													<SelectItem value="add_label">Add label</SelectItem>
													<SelectItem value="remove_label">
														Remove label
													</SelectItem>
													<SelectItem value="update_priority">
														Update priority to
													</SelectItem>
													<SelectItem value="send_notification">
														Send notification
													</SelectItem>
												</SelectContent>
											</Select>
											<Button
												className="ml-auto"
												onClick={() => removeAction(index)}
												size="icon"
												type="button"
												variant="ghost"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>

										{/* Action params based on type */}
										{action.type === "change_status" && (
											<Select
												onValueChange={(v) =>
													updateActionParams(index, { status: v })
												}
												value={(action.params.status as string) ?? "BACKLOG"}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select status" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="BACKLOG">Backlog</SelectItem>
													<SelectItem value="TODO">Todo</SelectItem>
													<SelectItem value="IN_PROGRESS">
														In Progress
													</SelectItem>
													<SelectItem value="DONE">Done</SelectItem>
													<SelectItem value="CANCELLED">Cancelled</SelectItem>
												</SelectContent>
											</Select>
										)}

										{action.type === "change_assignee" && (
											<Input
												onChange={(e) =>
													updateActionParams(index, {
														assigneeId: e.target.value,
													})
												}
												placeholder="User ID or {{creatorId}}"
												value={(action.params.assigneeId as string) ?? ""}
											/>
										)}

										{(action.type === "add_label" ||
											action.type === "remove_label") && (
											<Input
												onChange={(e) =>
													updateActionParams(index, { labelId: e.target.value })
												}
												placeholder="Label ID"
												value={(action.params.labelId as string) ?? ""}
											/>
										)}

										{action.type === "update_priority" && (
											<Select
												onValueChange={(v) =>
													updateActionParams(index, { priority: v })
												}
												value={
													(action.params.priority as string) ?? "NO_PRIORITY"
												}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select priority" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="NO_PRIORITY">
														No Priority
													</SelectItem>
													<SelectItem value="LOW">Low</SelectItem>
													<SelectItem value="MEDIUM">Medium</SelectItem>
													<SelectItem value="HIGH">High</SelectItem>
													<SelectItem value="URGENT">Urgent</SelectItem>
												</SelectContent>
											</Select>
										)}

										{action.type === "send_notification" && (
											<Textarea
												onChange={(e) =>
													updateActionParams(index, { message: e.target.value })
												}
												placeholder="Notification message"
												rows={2}
												value={(action.params.message as string) ?? ""}
											/>
										)}
									</div>
								))}
							</div>
						)}
					</div>

					<Separator />

					{/* Advanced Options */}
					<div>
						<button
							className="flex items-center text-muted-foreground text-sm hover:text-foreground"
							onClick={() => setShowAdvanced(!showAdvanced)}
							type="button"
						>
							{showAdvanced ? (
								<ChevronUp className="mr-1 h-4 w-4" />
							) : (
								<ChevronDown className="mr-1 h-4 w-4" />
							)}
							Advanced Options
						</button>

						{showAdvanced && (
							<div className="mt-4 space-y-4">
								<div>
									<Label>Apply to team (optional)</Label>
									<Select onValueChange={setTeamId} value={teamId}>
										<SelectTrigger>
											<SelectValue placeholder="All teams" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="">All teams</SelectItem>
											{teams.map((team) => (
												<SelectItem key={team.id} value={team.id}>
													{team.name} ({team.key})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<p className="mt-1 text-muted-foreground text-xs">
										Leave empty to apply to all teams in the workspace
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</ScrollArea>

			<DialogFooter>
				<Button
					disabled={createMutation.isPending || actions.length === 0 || !name}
					type="submit"
				>
					{createMutation.isPending ? "Creating..." : "Create Automation"}
				</Button>
			</DialogFooter>
		</form>
	);
}

// Automation Logs Component
function AutomationLogs({
	automationId,
	workspaceId,
}: {
	automationId: string | null;
	workspaceId: string;
}) {
	const { data, isLoading } = api.automation.logs.useQuery(
		{
			workspaceId,
			automationId: automationId ?? undefined,
			limit: AUTOMATIONS_LIMIT,
		},
		{ enabled: !!workspaceId },
	);

	if (isLoading) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				Loading logs...
			</div>
		);
	}

	if (!data?.logs.length) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				No execution history yet
			</div>
		);
	}

	return (
		<ScrollArea className="max-h-[50vh]">
			<div className="space-y-3">
				{data.logs.map((log) => (
					<div className="rounded-lg border p-4" key={log.id}>
						<div className="mb-2 flex items-start justify-between">
							<div className="flex items-center gap-2">
								<Badge
									variant={
										log.status === "SUCCESS"
											? "default"
											: log.status === "FAILED"
												? "destructive"
												: "secondary"
									}
								>
									{log.status}
								</Badge>
								<span className="text-muted-foreground text-sm">
									{formatDistanceToNow(new Date(log.executedAt), {
										addSuffix: true,
									})}
								</span>
							</div>
							{automationId === null && (
								<span className="text-muted-foreground text-xs">
									{log.rule.name}
								</span>
							)}
						</div>

						{log.error && (
							<p className="mb-2 text-destructive text-sm">
								Error: {log.error}
							</p>
						)}

						{log.issueId && (
							<p className="text-muted-foreground text-xs">
								Issue: {log.issueId}
							</p>
						)}
					</div>
				))}
			</div>
		</ScrollArea>
	);
}
