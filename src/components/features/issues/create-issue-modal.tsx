"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

type IssueStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
type Priority = "NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

import { FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CreateIssueModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	workspaceId: string;
	defaultTeamId?: string;
	defaultProjectId?: string;
	defaultTemplateId?: string;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
	{ value: "NO_PRIORITY", label: "No Priority", color: "#8A8F98" },
	{ value: "LOW", label: "Low", color: "#8A8F98" },
	{ value: "MEDIUM", label: "Medium", color: "#F59E0B" },
	{ value: "HIGH", label: "High", color: "#F97316" },
	{ value: "URGENT", label: "Urgent", color: "#EF4444" },
];

const statusOptions: { value: IssueStatus; label: string }[] = [
	{ value: "BACKLOG", label: "Backlog" },
	{ value: "TODO", label: "Todo" },
	{ value: "IN_PROGRESS", label: "In Progress" },
	{ value: "DONE", label: "Done" },
	{ value: "CANCELLED", label: "Cancelled" },
];

export function CreateIssueModal({
	open,
	onOpenChange,
	workspaceId,
	defaultTeamId,
	defaultProjectId,
	defaultTemplateId,
}: CreateIssueModalProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [teamId, setTeamId] = useState(defaultTeamId || "");
	const [projectId, setProjectId] = useState(defaultProjectId || "");
	const [assigneeId, setAssigneeId] = useState("");
	const [priority, setPriority] = useState<Priority>("NO_PRIORITY");
	const [status, setStatus] = useState<IssueStatus>("BACKLOG");
	const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
	const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
		defaultTemplateId || null,
	);

	const utils = api.useUtils();

	const { data: teams } = api.workspace.getTeams.useQuery({ workspaceId });
	const { data: projects } = api.workspace.getProjects.useQuery({
		workspaceId,
		teamId: teamId || undefined,
	});
	const { data: members } = api.workspace.getMembers.useQuery({ workspaceId });
	const { data: labels } = api.workspace.getLabels.useQuery({ workspaceId });
	const { data: templates } = api.template.list.useQuery({
		workspaceId,
		teamId: teamId || undefined,
	});

	const createMutation = api.issue.create.useMutation({
		onSuccess: () => {
			utils.issue.list.invalidate();
			resetForm();
			onOpenChange(false);
		},
	});

	const resetForm = () => {
		setTitle("");
		setDescription("");
		setTeamId(defaultTeamId || "");
		setProjectId(defaultProjectId || "");
		setAssigneeId("");
		setPriority("NO_PRIORITY");
		setStatus("BACKLOG");
		setSelectedLabelIds([]);
		setSelectedTemplateId(null);
	};

	const applyTemplate = (templateId: string) => {
		const template = templates?.find((t) => t.id === templateId);
		if (!template) return;

		setSelectedTemplateId(templateId);
		if (template.title) {
			setTitle(template.title);
		}
		if (template.content) {
			try {
				// Try to parse as JSON (TipTap content), otherwise use as plain text
				JSON.parse(template.content);
				// For now, just use a placeholder if it's structured content
				setDescription("");
			} catch {
				setDescription(template.content);
			}
		}
		if ("priority" in template) {
			setPriority(template.priority as Priority);
		}
		if ("status" in template) {
			setStatus(template.status as IssueStatus);
		}
		if ("labelIds" in template && template.labelIds) {
			try {
				const labelIds = JSON.parse(template.labelIds as string);
				setSelectedLabelIds(labelIds);
			} catch {
				setSelectedLabelIds([]);
			}
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim() || !teamId) return;

		createMutation.mutate({
			title: title.trim(),
			description: description.trim() || undefined,
			teamId,
			projectId: projectId || undefined,
			assigneeId: assigneeId || undefined,
			priority,
			status,
			labelIds: selectedLabelIds,
		});
	};

	const toggleLabel = (labelId: string) => {
		setSelectedLabelIds((prev) =>
			prev.includes(labelId)
				? prev.filter((id) => id !== labelId)
				: [...prev, labelId],
		);
	};

	const isLoading = createMutation.isPending;

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className="border-[#2A2F35] bg-[#16181D] sm:max-w-[600px]"
				trapFocus={false}
			>
				<DialogHeader>
					<DialogTitle className="text-[#F7F8F8]">Create New Issue</DialogTitle>
					<DialogDescription className="text-[#8A8F98]">
						Add a new issue to track your work.
					</DialogDescription>
				</DialogHeader>

				<form className="space-y-6 py-4" onSubmit={handleSubmit}>
					{/* Template Selector */}
					{templates && templates.length > 0 && (
						<div className="space-y-2">
							<Label className="text-[#F7F8F8]">Template</Label>
							<div className="flex items-center gap-2">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											className="flex items-center gap-2 border-[#2A2F35] bg-transparent text-[#F7F8F8] hover:bg-[#2A2F35]"
											type="button"
											variant="outline"
										>
											<FileText className="h-4 w-4" />
											{selectedTemplateId
												? templates.find((t) => t.id === selectedTemplateId)
														?.name
												: "Apply template"}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="start"
										className="max-h-[300px] overflow-auto border-[#2A2F35] bg-[#16181D]"
									>
										{templates.map((template) => (
											<DropdownMenuItem
												className="cursor-pointer text-[#F7F8F8] focus:bg-[#2A2F35] focus:text-[#F7F8F8]"
												key={template.id}
												onClick={() => applyTemplate(template.id)}
											>
												<div className="flex flex-col">
													<span className="font-medium">{template.name}</span>
													{template.description && (
														<span className="text-[#8A8F98] text-xs">
															{template.description}
														</span>
													)}
												</div>
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
								{selectedTemplateId && (
									<Button
										className="h-8 px-2 text-[#8A8F98] hover:text-[#F7F8F8]"
										onClick={() => setSelectedTemplateId(null)}
										size="sm"
										type="button"
										variant="ghost"
									>
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
						</div>
					)}

					{/* Title */}
					<div className="space-y-2">
						<Label className="text-[#F7F8F8]" htmlFor="title">
							Title *
						</Label>
						<Input
							autoFocus
							className="border-[#2A2F35] bg-transparent text-[#F7F8F8] placeholder:text-[#8A8F98]"
							id="title"
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Issue title"
							value={title}
						/>
					</div>

					{/* Description */}
					<div className="space-y-2">
						<Label className="text-[#F7F8F8]" htmlFor="description">
							Description
						</Label>
						<Textarea
							className="min-h-[100px] border-[#2A2F35] bg-transparent text-[#F7F8F8] placeholder:text-[#8A8F98]"
							id="description"
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Add a description..."
							value={description}
						/>
					</div>

					{/* Team */}
					<div className="space-y-2">
						<Label className="text-[#F7F8F8]" htmlFor="team">
							Team *
						</Label>
						<Select onValueChange={setTeamId} value={teamId}>
							<SelectTrigger className="border-[#2A2F35] bg-transparent text-[#F7F8F8]">
								<SelectValue placeholder="Select a team" />
							</SelectTrigger>
							<SelectContent className="border-[#2A2F35] bg-[#16181D]">
								{teams?.map((team) => (
									<SelectItem
										className="text-[#F7F8F8] focus:bg-[#2A2F35] focus:text-[#F7F8F8]"
										key={team.id}
										value={team.id}
									>
										<div className="flex items-center gap-2">
											<span
												className="h-2 w-2 rounded-full"
												style={{ backgroundColor: team.color }}
											/>
											{team.name}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Project */}
					<div className="space-y-2">
						<Label className="text-[#F7F8F8]" htmlFor="project">
							Project
						</Label>
						<Select
							disabled={!teamId || !projects?.length}
							onValueChange={setProjectId}
							value={projectId}
						>
							<SelectTrigger className="border-[#2A2F35] bg-transparent text-[#F7F8F8]">
								<SelectValue placeholder="Select a project" />
							</SelectTrigger>
							<SelectContent className="border-[#2A2F35] bg-[#16181D]">
								<SelectItem
									className="text-[#F7F8F8] focus:bg-[#2A2F35] focus:text-[#F7F8F8]"
									value=""
								>
									No Project
								</SelectItem>
								{projects?.map((project) => (
									<SelectItem
										className="text-[#F7F8F8] focus:bg-[#2A2F35] focus:text-[#F7F8F8]"
										key={project.id}
										value={project.id}
									>
										{project.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Assignee */}
					<div className="space-y-2">
						<Label className="text-[#F7F8F8]" htmlFor="assignee">
							Assignee
						</Label>
						<Select onValueChange={setAssigneeId} value={assigneeId}>
							<SelectTrigger className="border-[#2A2F35] bg-transparent text-[#F7F8F8]">
								<SelectValue placeholder="Unassigned" />
							</SelectTrigger>
							<SelectContent className="border-[#2A2F35] bg-[#16181D]">
								<SelectItem
									className="text-[#F7F8F8] focus:bg-[#2A2F35] focus:text-[#F7F8F8]"
									value=""
								>
									Unassigned
								</SelectItem>
								{members?.map((member) => (
									<SelectItem
										className="text-[#F7F8F8] focus:bg-[#2A2F35] focus:text-[#F7F8F8]"
										key={member.user.id}
										value={member.user.id}
									>
										<div className="flex items-center gap-2">
											<div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5E6AD2] text-white text-xs">
												{member.user.name?.charAt(0).toUpperCase()}
											</div>
											{member.user.name}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Status & Priority */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label className="text-[#F7F8F8]" htmlFor="status">
								Status
							</Label>
							<Select
								onValueChange={(v) => setStatus(v as IssueStatus)}
								value={status}
							>
								<SelectTrigger className="border-[#2A2F35] bg-transparent text-[#F7F8F8]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="border-[#2A2F35] bg-[#16181D]">
									{statusOptions.map((option) => (
										<SelectItem
											className="text-[#F7F8F8] focus:bg-[#2A2F35] focus:text-[#F7F8F8]"
											key={option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label className="text-[#F7F8F8]" htmlFor="priority">
								Priority
							</Label>
							<Select
								onValueChange={(v) => setPriority(v as Priority)}
								value={priority}
							>
								<SelectTrigger className="border-[#2A2F35] bg-transparent text-[#F7F8F8]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="border-[#2A2F35] bg-[#16181D]">
									{priorityOptions.map((option) => (
										<SelectItem
											className="text-[#F7F8F8] focus:bg-[#2A2F35] focus:text-[#F7F8F8]"
											key={option.value}
											value={option.value}
										>
											<div className="flex items-center gap-2">
												<span style={{ color: option.color }}>●</span>
												{option.label}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Labels */}
					{labels && labels.length > 0 && (
						<div className="space-y-2">
							<Label className="text-[#F7F8F8]">Labels</Label>
							<div className="flex flex-wrap gap-2">
								{labels.map((label) => (
									<button
										className="cursor-pointer"
										key={label.id}
										onClick={() => toggleLabel(label.id)}
										type="button"
									>
										<Badge
											className="border px-2 py-1 text-xs"
											style={{
												backgroundColor: selectedLabelIds.includes(label.id)
													? `${label.color}40`
													: `${label.color}10`,
												borderColor: label.color,
												color: label.color,
											}}
											variant="outline"
										>
											{label.name}
											{selectedLabelIds.includes(label.id) && (
												<X className="ml-1 inline h-3 w-3" />
											)}
										</Badge>
									</button>
								))}
							</div>
						</div>
					)}

					{/* Actions */}
					<div className="flex justify-end gap-2 pt-4">
						<Button
							className="border-[#2A2F35] bg-transparent text-[#F7F8F8] hover:bg-[#2A2F35]"
							onClick={() => onOpenChange(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							className="bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
							disabled={!title.trim() || !teamId || isLoading}
							type="submit"
						>
							{isLoading ? "Creating..." : "Create Issue"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
