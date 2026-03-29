"use client";

import { FileText, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label as LabelComponent } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { api } from "~/trpc/react";

type IssueStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
type Priority = "NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface CreateTemplateModalProps {
	isOpen: boolean;
	onClose: () => void;
	workspaceId: string;
}

const priorityOptions: { value: Priority; label: string }[] = [
	{ value: "NO_PRIORITY", label: "No Priority" },
	{ value: "LOW", label: "Low" },
	{ value: "MEDIUM", label: "Medium" },
	{ value: "HIGH", label: "High" },
	{ value: "URGENT", label: "Urgent" },
];

const statusOptions: { value: IssueStatus; label: string }[] = [
	{ value: "BACKLOG", label: "Backlog" },
	{ value: "TODO", label: "Todo" },
	{ value: "IN_PROGRESS", label: "In Progress" },
	{ value: "DONE", label: "Done" },
	{ value: "CANCELLED", label: "Cancelled" },
];

function CreateTemplateModal({
	isOpen,
	onClose,
	workspaceId,
}: CreateTemplateModalProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [priority, setPriority] = useState<Priority>("NO_PRIORITY");
	const [status, setStatus] = useState<IssueStatus>("BACKLOG");
	const [teamId, setTeamId] = useState("");

	const utils = api.useUtils();
	const { data: teams } = api.workspace.getTeams.useQuery({ workspaceId });

	const createMutation = api.template.create.useMutation({
		onSuccess: () => {
			void utils.template.list.invalidate({ workspaceId });
			resetForm();
			onClose();
		},
	});

	const resetForm = () => {
		setName("");
		setDescription("");
		setTitle("");
		setContent("");
		setPriority("NO_PRIORITY");
		setStatus("BACKLOG");
		setTeamId("");
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !title.trim()) return;

		createMutation.mutate({
			name: name.trim(),
			description: description.trim() || undefined,
			title: title.trim(),
			content: content.trim() || undefined,
			priority,
			status,
			workspaceId,
			teamId: teamId || undefined,
			labelIds: [],
		});
	};

	return (
		<Dialog onOpenChange={onClose} open={isOpen}>
			<DialogContent className="border-[#2A2F35] bg-[#0F1115] sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="text-[#F7F8F8]">Create Template</DialogTitle>
					<DialogDescription className="text-[#8A8F98]">
						Create a template to quickly create issues with predefined fields.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<ScrollArea className="max-h-[60vh]">
						<div className="space-y-4 py-4 pr-4">
							<div className="space-y-2">
								<LabelComponent className="text-[#8A8F98]" htmlFor="name">
									Template Name *
								</LabelComponent>
								<Input
									autoFocus
									className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8] placeholder:text-[#8A8F98]"
									id="name"
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g., Bug Report, Feature Request"
									value={name}
								/>
							</div>

							<div className="space-y-2">
								<LabelComponent
									className="text-[#8A8F98]"
									htmlFor="description"
								>
									Description
								</LabelComponent>
								<Input
									className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8] placeholder:text-[#8A8F98]"
									id="description"
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Brief description of when to use this template"
									value={description}
								/>
							</div>

							<div className="space-y-2">
								<LabelComponent className="text-[#8A8F98]" htmlFor="team">
									Team
								</LabelComponent>
								<Select onValueChange={setTeamId} value={teamId}>
									<SelectTrigger className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8]">
										<SelectValue placeholder="All teams (workspace template)" />
									</SelectTrigger>
									<SelectContent className="border-[#2A2F35] bg-[#1A1D21]">
										<SelectItem
											className="text-[#F7F8F8] focus:bg-[#2A2F35]"
											value=""
										>
											All teams
										</SelectItem>
										{teams?.map((team) => (
											<SelectItem
												className="text-[#F7F8F8] focus:bg-[#2A2F35]"
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

							<div className="space-y-2">
								<LabelComponent className="text-[#8A8F98]" htmlFor="title">
									Default Title *
								</LabelComponent>
								<Input
									className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8] placeholder:text-[#8A8F98]"
									id="title"
									onChange={(e) => setTitle(e.target.value)}
									placeholder="e.g., [Bug] "
									value={title}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<LabelComponent className="text-[#8A8F98]" htmlFor="status">
										Default Status
									</LabelComponent>
									<Select
										onValueChange={(v) => setStatus(v as IssueStatus)}
										value={status}
									>
										<SelectTrigger className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="border-[#2A2F35] bg-[#1A1D21]">
											{statusOptions.map((option) => (
												<SelectItem
													className="text-[#F7F8F8] focus:bg-[#2A2F35]"
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
									<LabelComponent className="text-[#8A8F98]" htmlFor="priority">
										Default Priority
									</LabelComponent>
									<Select
										onValueChange={(v) => setPriority(v as Priority)}
										value={priority}
									>
										<SelectTrigger className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="border-[#2A2F35] bg-[#1A1D21]">
											{priorityOptions.map((option) => (
												<SelectItem
													className="text-[#F7F8F8] focus:bg-[#2A2F35]"
													key={option.value}
													value={option.value}
												>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<LabelComponent className="text-[#8A8F98]" htmlFor="content">
									Default Description
								</LabelComponent>
								<Textarea
									className="min-h-[100px] border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8] placeholder:text-[#8A8F98]"
									id="content"
									onChange={(e) => setContent(e.target.value)}
									placeholder="Default content for issues created with this template..."
									value={content}
								/>
							</div>
						</div>
					</ScrollArea>

					<DialogFooter className="mt-4">
						<Button
							className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
							onClick={onClose}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							className="bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
							disabled={
								!name.trim() || !title.trim() || createMutation.isPending
							}
							type="submit"
						>
							{createMutation.isPending ? "Creating..." : "Create Template"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

interface DeleteTemplateDialogProps {
	isOpen: boolean;
	onClose: () => void;
	template: {
		id: string;
		name: string;
		isDefault?: boolean;
	};
	workspaceId: string;
}

function DeleteTemplateDialog({
	isOpen,
	onClose,
	template,
	workspaceId,
}: DeleteTemplateDialogProps) {
	const utils = api.useUtils();

	const deleteMutation = api.template.delete.useMutation({
		onSuccess: () => {
			void utils.template.list.invalidate({ workspaceId });
			onClose();
		},
	});

	const handleDelete = () => {
		if (template.isDefault) {
			// Cannot delete default templates
			onClose();
			return;
		}
		deleteMutation.mutate({ id: template.id });
	};

	return (
		<Dialog onOpenChange={onClose} open={isOpen}>
			<DialogContent className="border-[#2A2F35] bg-[#0F1115] sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-[#F7F8F8]">
						{template.isDefault
							? "Cannot Delete Default Template"
							: "Delete Template"}
					</DialogTitle>
					<DialogDescription className="text-[#8A8F98]">
						{template.isDefault
							? "Default templates cannot be deleted."
							: `Are you sure you want to delete the template "${template.name}"?`}
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="mt-4">
					<Button
						className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
						onClick={onClose}
						variant="outline"
					>
						{template.isDefault ? "OK" : "Cancel"}
					</Button>
					{!template.isDefault && (
						<Button
							className="bg-red-600 text-white hover:bg-red-700"
							disabled={deleteMutation.isPending}
							onClick={handleDelete}
						>
							{deleteMutation.isPending ? "Deleting..." : "Delete Template"}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function TemplatesPage() {
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [deletingTemplate, setDeletingTemplate] = useState<{
		id: string;
		name: string;
		isDefault?: boolean;
	} | null>(null);

	const { workspaceId } = useCurrentWorkspace();
	const { data: templates, isLoading } = api.template.list.useQuery(
		{
			workspaceId: workspaceId ?? "",
		},
		{
			enabled: !!workspaceId,
		},
	);

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-[#2A2F35] border-b bg-[#0F1115] px-6 py-4">
				<div>
					<h1 className="font-semibold text-[#F7F8F8] text-xl">Templates</h1>
					<p className="text-[#8A8F98] text-sm">
						Create and manage issue templates for your workspace
					</p>
				</div>
				<Button
					className="gap-2 bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
					onClick={() => setIsCreateModalOpen(true)}
				>
					<Plus className="h-4 w-4" />
					New Template
				</Button>
			</div>

			{/* Content */}
			<ScrollArea className="flex-1 p-6">
				<Card className="border-[#2A2F35] bg-[#0F1115]">
					<CardHeader>
						<CardTitle className="text-[#F7F8F8]">All Templates</CardTitle>
						<CardDescription className="text-[#8A8F98]">
							{templates?.length ?? 0} template
							{templates?.length !== 1 ? "s" : ""} available
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="space-y-2">
								{Array.from({ length: 5 }).map((_, index) => (
									<div
										className="h-16 animate-pulse rounded-md bg-[#1A1D21]"
										// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton items
										key={`skeleton-${index}`}
									/>
								))}
							</div>
						) : templates?.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2A2F35]">
									<FileText className="h-6 w-6 text-[#8A8F98]" />
								</div>
								<h3 className="mb-1 font-medium text-[#F7F8F8]">
									No templates yet
								</h3>
								<p className="max-w-sm text-[#8A8F98] text-sm">
									Create templates to quickly create issues with predefined
									fields. Perfect for bug reports, feature requests, and tasks.
								</p>
								<Button
									className="mt-4 bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
									onClick={() => setIsCreateModalOpen(true)}
								>
									<Plus className="mr-2 h-4 w-4" />
									Create your first template
								</Button>
							</div>
						) : (
							<div className="divide-y divide-[#2A2F35]">
								{templates?.map((template) => (
									<div
										className="flex items-start justify-between py-4 first:pt-0 last:pb-0"
										key={template.id}
									>
										<div className="flex items-start gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2A2F35]">
												<FileText className="h-5 w-5 text-[#5E6AD2]" />
											</div>
											<div>
												<div className="flex items-center gap-2">
													<h3 className="font-medium text-[#F7F8F8]">
														{template.name}
													</h3>
													{"isDefault" in template && template.isDefault && (
														<span className="rounded-full bg-[#5E6AD2]/20 px-2 py-0.5 text-[#5E6AD2] text-xs">
															Default
														</span>
													)}
												</div>
												{template.description && (
													<p className="mt-1 text-[#8A8F98] text-sm">
														{template.description}
													</p>
												)}
												<div className="mt-2 flex items-center gap-3 text-[#8A8F98] text-xs">
													<span className="rounded bg-[#2A2F35] px-2 py-1">
														Status:{" "}
														{"status" in template ? template.status : "BACKLOG"}
													</span>
													<span className="rounded bg-[#2A2F35] px-2 py-1">
														Priority:{" "}
														{"priority" in template
															? template.priority
															: "NO_PRIORITY"}
													</span>
													{template.team && "name" in template.team && (
														<span className="rounded bg-[#2A2F35] px-2 py-1">
															Team: {template.team.name}
														</span>
													)}
												</div>
											</div>
										</div>

										<div className="flex items-center gap-2">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														className="h-8 w-8 text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
														size="icon"
														variant="ghost"
													>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent
													align="end"
													className="border-[#2A2F35] bg-[#1A1D21]"
												>
													<DropdownMenuItem
														className="text-red-400 hover:bg-[#2A2F35] hover:text-red-300 focus:bg-[#2A2F35] focus:text-red-300"
														onClick={() =>
															setDeletingTemplate({
																id: template.id,
																name: template.name,
																isDefault:
																	"isDefault" in template
																		? template.isDefault
																		: false,
															})
														}
													>
														<Trash2 className="mr-2 h-4 w-4" />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</ScrollArea>

			{/* Modals */}
			<CreateTemplateModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				workspaceId={workspaceId ?? ""}
			/>

			{deletingTemplate && (
				<DeleteTemplateDialog
					isOpen={!!deletingTemplate}
					onClose={() => setDeletingTemplate(null)}
					template={deletingTemplate}
					workspaceId={workspaceId ?? ""}
				/>
			)}
		</div>
	);
}
