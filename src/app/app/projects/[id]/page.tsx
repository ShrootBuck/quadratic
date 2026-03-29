"use client";

import { format } from "date-fns";
import {
	AlertCircle,
	Archive,
	ArrowLeft,
	Calendar,
	CheckCircle2,
	FolderKanban,
	LayoutGrid,
	ListTodo,
	MoreHorizontal,
	Pencil,
	Target,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "~/trpc/react";

type ProjectStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const colorOptions = [
	{ name: "Purple", value: "#5E6AD2" },
	{ name: "Blue", value: "#3B82F6" },
	{ name: "Green", value: "#4EC9B0" },
	{ name: "Yellow", value: "#FBBF24" },
	{ name: "Orange", value: "#F97316" },
	{ name: "Red", value: "#F87171" },
	{ name: "Pink", value: "#EC4899" },
];

const projectStatuses: { value: ProjectStatus; label: string }[] = [
	{ value: "PLANNED", label: "Planned" },
	{ value: "IN_PROGRESS", label: "In Progress" },
	{ value: "COMPLETED", label: "Completed" },
	{ value: "CANCELLED", label: "Archived" },
];

export default function ProjectDetailPage() {
	const params = useParams();
	const router = useRouter();
	const projectId = params.id as string;

	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("overview");

	const { data: project, isLoading } = api.project.getById.useQuery({
		id: projectId,
	});

	const { data: membersData } = api.workspace.getMembers.useQuery({
		workspaceId: project?.workspaceId ?? "",
	});

	const utils = api.useUtils();

	const updateProject = api.project.update.useMutation({
		onSuccess: () => {
			utils.project.getById.invalidate({ id: projectId });
			setEditModalOpen(false);
		},
	});

	const archiveProject = api.project.archive.useMutation({
		onSuccess: () => {
			router.push("/app/projects");
		},
	});

	const deleteProject = api.project.delete.useMutation({
		onSuccess: () => {
			router.push("/app/projects");
		},
	});

	const calculateProgress = () => {
		if (!project || project.issues.length === 0) return 0;
		const completed = project.issues.filter((i) => i.status === "DONE").length;
		return Math.round((completed / project.issues.length) * 100);
	};

	const getStatusLabel = (status: ProjectStatus) => {
		switch (status) {
			case "PLANNED":
				return "Planned";
			case "IN_PROGRESS":
				return "In Progress";
			case "COMPLETED":
				return "Completed";
			case "CANCELLED":
				return "Archived";
			default:
				return status;
		}
	};

	const getStatusBadgeColor = (status: ProjectStatus) => {
		switch (status) {
			case "IN_PROGRESS":
				return "bg-[#5E6AD2]/20 text-[#5E6AD2] border-[#5E6AD2]/30";
			case "COMPLETED":
				return "bg-[#4EC9B0]/20 text-[#4EC9B0] border-[#4EC9B0]/30";
			case "CANCELLED":
				return "bg-[#8A8F98]/20 text-[#8A8F98] border-[#8A8F98]/30";
			default:
				return "bg-[#8A8F98]/20 text-[#8A8F98] border-[#8A8F98]/30";
		}
	};

	const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		updateProject.mutate({
			id: projectId,
			name: formData.get("name") as string,
			description: (formData.get("description") as string) || undefined,
			status: formData.get("status") as ProjectStatus,
			leadId: (formData.get("leadId") as string) || null,
			startDate: formData.get("startDate")
				? new Date(formData.get("startDate") as string)
				: null,
			targetDate: formData.get("targetDate")
				? new Date(formData.get("targetDate") as string)
				: null,
			color: formData.get("color") as string,
		});
	};

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5E6AD2] border-t-transparent" />
			</div>
		);
	}

	if (!project) {
		return (
			<div className="flex h-full flex-col items-center justify-center">
				<AlertCircle className="mb-4 h-12 w-12 text-[#8A8F98]" />
				<h1 className="mb-2 font-semibold text-[#F7F8F8] text-xl">
					Project not found
				</h1>
				<Link className="text-[#5E6AD2] hover:underline" href="/app/projects">
					Go back to projects
				</Link>
			</div>
		);
	}

	const progress = calculateProgress();
	const issuesByStatus = {
		backlog: project.issues.filter((i) => i.status === "BACKLOG").length,
		todo: project.issues.filter((i) => i.status === "TODO").length,
		inProgress: project.issues.filter((i) => i.status === "IN_PROGRESS").length,
		done: project.issues.filter((i) => i.status === "DONE").length,
		cancelled: project.issues.filter((i) => i.status === "CANCELLED").length,
	};

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="border-[#2A2F35] border-b px-6 py-4">
				<div className="mb-4 flex items-center gap-4">
					<Link
						className="flex items-center gap-2 text-[#8A8F98] hover:text-[#F7F8F8]"
						href="/app/projects"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Projects
					</Link>
				</div>

				<div className="flex items-start justify-between">
					<div className="flex items-center gap-4">
						<div
							className="flex h-12 w-12 items-center justify-center rounded-xl"
							style={{ backgroundColor: `${project.color}20` }}
						>
							<FolderKanban
								className="h-6 w-6"
								style={{ color: project.color }}
							/>
						</div>

						<div>
							<div className="flex items-center gap-3">
								<h1 className="font-semibold text-2xl text-[#F7F8F8]">
									{project.name}
								</h1>
								<Badge
									className={cn("border", getStatusBadgeColor(project.status))}
									variant="outline"
								>
									{getStatusLabel(project.status)}
								</Badge>
							</div>

							<div className="mt-1 flex items-center gap-4 text-[#8A8F98] text-sm">
								<div className="flex items-center gap-1">
									<div
										className="h-2 w-2 rounded-full"
										style={{ backgroundColor: project.team.color }}
									/>
									<span>{project.team.name}</span>
								</div>
								{project.lead && (
									<div className="flex items-center gap-1">
										<Target className="h-3 w-3" />
										<span>{project.lead.name}</span>
									</div>
								)}
								{(project.startDate || project.targetDate) && (
									<div className="flex items-center gap-1">
										<Calendar className="h-3 w-3" />
										<span>
											{project.startDate
												? format(new Date(project.startDate), "MMM d")
												: "No start date"}
											{project.targetDate
												? ` - ${format(new Date(project.targetDate), "MMM d, yyyy")}`
												: ""}
										</span>
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button
							className="text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
							onClick={() => setEditModalOpen(true)}
							variant="outline"
						>
							<Pencil className="mr-2 h-4 w-4" />
							Edit
						</Button>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									className="text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
									size="icon"
									variant="outline"
								>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="border-[#2A2F35] bg-[#16181D]"
							>
								{project.status !== "CANCELLED" && (
									<DropdownMenuItem
										className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
										onClick={() => archiveProject.mutate({ id: projectId })}
									>
										<Archive className="mr-2 h-4 w-4" />
										Archive Project
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									className="text-[#F87171] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
									onClick={() => setDeleteModalOpen(true)}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete Project
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Progress Bar */}
				<div className="mt-6">
					<div className="mb-2 flex items-center justify-between text-sm">
						<span className="text-[#8A8F98]">Progress</span>
						<span className="font-medium text-[#F7F8F8]">
							{progress}% (
							{project.issues.filter((i) => i.status === "DONE").length}/
							{project.issues.length} issues)
						</span>
					</div>
					<div className="h-2 w-full overflow-hidden rounded-full bg-[#2A2F35]">
						<div
							className="h-full rounded-full transition-all"
							style={{ width: `${progress}%`, backgroundColor: project.color }}
						/>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<Tabs
				className="flex flex-1 flex-col"
				onValueChange={setActiveTab}
				value={activeTab}
			>
				<div className="border-[#2A2F35] border-b px-6">
					<TabsList className="bg-transparent">
						<TabsTrigger
							className="text-[#8A8F98] data-[state=active]:border-[#5E6AD2] data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:text-[#F7F8F8]"
							value="overview"
						>
							Overview
						</TabsTrigger>
						<TabsTrigger
							className="text-[#8A8F98] data-[state=active]:border-[#5E6AD2] data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:text-[#F7F8F8]"
							value="board"
						>
							<LayoutGrid className="mr-2 h-4 w-4" />
							Board
						</TabsTrigger>
						<TabsTrigger
							className="text-[#8A8F98] data-[state=active]:border-[#5E6AD2] data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:text-[#F7F8F8]"
							value="list"
						>
							<ListTodo className="mr-2 h-4 w-4" />
							List
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent className="flex-1 overflow-auto" value="overview">
					<div className="grid h-full grid-cols-3 gap-6 p-6">
						<div className="col-span-2 space-y-6">
							{/* Description */}
							<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-4">
								<h3 className="mb-3 font-medium text-[#F7F8F8]">Description</h3>
								{project.description ? (
									<p className="whitespace-pre-wrap text-[#8A8F98] text-sm">
										{project.description}
									</p>
								) : (
									<p className="text-[#8A8F98] text-sm italic">
										No description provided
									</p>
								)}
							</div>

							{/* Recent Issues */}
							<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-4">
								<h3 className="mb-3 font-medium text-[#F7F8F8]">
									Recent Issues
								</h3>
								{project.issues.length > 0 ? (
									<div className="space-y-2">
										{project.issues.slice(0, 5).map((issue) => (
											<Link
												className="flex items-center gap-3 rounded-md border border-[#2A2F35] bg-[#0F1115] p-3 transition-colors hover:border-[#5E6AD2]"
												href={`/app/issues/${issue.id}`}
												key={issue.id}
											>
												<span className="font-medium text-[#5E6AD2] text-sm">
													{issue.identifier}
												</span>
												<span className="flex-1 truncate text-[#F7F8F8] text-sm">
													{issue.title}
												</span>
												<Badge
													className={cn(
														"text-xs",
														issue.status === "DONE" &&
															"bg-[#4EC9B0]/20 text-[#4EC9B0]",
														issue.status === "IN_PROGRESS" &&
															"bg-[#5E6AD2]/20 text-[#5E6AD2]",
														issue.status === "CANCELLED" &&
															"bg-[#8A8F98]/20 text-[#8A8F98]",
														(issue.status === "BACKLOG" ||
															issue.status === "TODO") &&
															"bg-[#8A8F98]/20 text-[#8A8F98]",
													)}
													variant="secondary"
												>
													{issue.status.replace("_", " ")}
												</Badge>
											</Link>
										))}
									</div>
								) : (
									<p className="text-[#8A8F98] text-sm">No issues yet</p>
								)}
							</div>
						</div>

						<div className="space-y-6">
							{/* Stats */}
							<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-4">
								<h3 className="mb-4 font-medium text-[#F7F8F8]">Issue Stats</h3>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="h-2 w-2 rounded-full bg-[#8A8F98]" />
											<span className="text-[#8A8F98] text-sm">Backlog</span>
										</div>
										<span className="font-medium text-[#F7F8F8]">
											{issuesByStatus.backlog}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="h-2 w-2 rounded-full bg-[#8A8F98]" />
											<span className="text-[#8A8F98] text-sm">Todo</span>
										</div>
										<span className="font-medium text-[#F7F8F8]">
											{issuesByStatus.todo}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="h-2 w-2 rounded-full bg-[#5E6AD2]" />
											<span className="text-[#8A8F98] text-sm">
												In Progress
											</span>
										</div>
										<span className="font-medium text-[#F7F8F8]">
											{issuesByStatus.inProgress}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="h-2 w-2 rounded-full bg-[#4EC9B0]" />
											<span className="text-[#8A8F98] text-sm">Done</span>
										</div>
										<span className="font-medium text-[#F7F8F8]">
											{issuesByStatus.done}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="h-2 w-2 rounded-full bg-[#F87171]" />
											<span className="text-[#8A8F98] text-sm">Cancelled</span>
										</div>
										<span className="font-medium text-[#F7F8F8]">
											{issuesByStatus.cancelled}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</TabsContent>

				<TabsContent className="flex-1 overflow-auto p-6" value="board">
					<div className="h-full rounded-lg border border-[#2A2F35] bg-[#16181D] p-8">
						<div className="flex h-full flex-col items-center justify-center text-center">
							<LayoutGrid className="mb-4 h-12 w-12 text-[#8A8F98]" />
							<h3 className="mb-2 font-medium text-[#F7F8F8]">Board View</h3>
							<p className="text-[#8A8F98]">
								Board view coming soon. Use the Issues page with project filter
								for now.
							</p>
							<Button
								className="mt-4 bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
								onClick={() => router.push("/app/issues/board")}
							>
								Go to Board
							</Button>
						</div>
					</div>
				</TabsContent>

				<TabsContent className="flex-1 overflow-auto p-6" value="list">
					<div className="h-full rounded-lg border border-[#2A2F35] bg-[#16181D] p-8">
						<div className="flex h-full flex-col items-center justify-center text-center">
							<ListTodo className="mb-4 h-12 w-12 text-[#8A8F98]" />
							<h3 className="mb-2 font-medium text-[#F7F8F8]">List View</h3>
							<p className="text-[#8A8F98]">
								List view coming soon. Use the Issues page with project filter
								for now.
							</p>
							<Button
								className="mt-4 bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
								onClick={() => router.push("/app/issues")}
							>
								Go to Issues
							</Button>
						</div>
					</div>
				</TabsContent>
			</Tabs>

			{/* Edit Modal */}
			<Dialog onOpenChange={setEditModalOpen} open={editModalOpen}>
				<DialogContent className="border-[#2A2F35] bg-[#16181D] sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle className="text-[#F7F8F8]">Edit Project</DialogTitle>
					</DialogHeader>
					<form className="space-y-4 pt-4" onSubmit={handleEditSubmit}>
						<div className="space-y-2">
							<Label className="text-[#F7F8F8]" htmlFor="name">
								Name
							</Label>
							<Input
								className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]"
								defaultValue={project.name}
								id="name"
								name="name"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label className="text-[#F7F8F8]" htmlFor="description">
								Description
							</Label>
							<Textarea
								className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]"
								defaultValue={project.description || ""}
								id="description"
								name="description"
							/>
						</div>

						<div className="space-y-2">
							<Label className="text-[#F7F8F8]">Status</Label>
							<Select defaultValue={project.status} name="status">
								<SelectTrigger className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="border-[#2A2F35] bg-[#16181D]">
									{projectStatuses.map((status) => (
										<SelectItem
											className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
											key={status.value}
											value={status.value}
										>
											{status.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label className="text-[#F7F8F8]">Project Lead</Label>
							<Select defaultValue={project.leadId || ""} name="leadId">
								<SelectTrigger className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]">
									<SelectValue placeholder="Select a lead" />
								</SelectTrigger>
								<SelectContent className="border-[#2A2F35] bg-[#16181D]">
									<SelectItem
										className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
										value=""
									>
										No lead
									</SelectItem>
									{membersData?.map((member) => (
										<SelectItem
											className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
											key={member.user.id}
											value={member.user.id}
										>
											{member.user.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label className="text-[#F7F8F8]">Color</Label>
							<div className="flex flex-wrap gap-2">
								{colorOptions.map((color) => (
									<label className="cursor-pointer" key={color.value}>
										<input
											className="sr-only"
											defaultChecked={project.color === color.value}
											name="color"
											type="radio"
											value={color.value}
										/>
										<div
											className={cn(
												"flex h-8 w-8 items-center justify-center rounded-full transition-all",
												project.color === color.value
													? "ring-2 ring-white ring-offset-2 ring-offset-[#16181D]"
													: "hover:scale-110",
											)}
											style={{ backgroundColor: color.value }}
										>
											{project.color === color.value && (
												<CheckCircle2 className="h-4 w-4 text-white" />
											)}
										</div>
									</label>
								))}
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-[#F7F8F8]" htmlFor="startDate">
									Start Date
								</Label>
								<Input
									className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]"
									defaultValue={
										project.startDate
											? format(new Date(project.startDate), "yyyy-MM-dd")
											: ""
									}
									id="startDate"
									name="startDate"
									type="date"
								/>
							</div>

							<div className="space-y-2">
								<Label className="text-[#F7F8F8]" htmlFor="targetDate">
									Target Date
								</Label>
								<Input
									className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]"
									defaultValue={
										project.targetDate
											? format(new Date(project.targetDate), "yyyy-MM-dd")
											: ""
									}
									id="targetDate"
									name="targetDate"
									type="date"
								/>
							</div>
						</div>

						<Button
							className="w-full bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
							disabled={updateProject.isPending}
							type="submit"
						>
							{updateProject.isPending ? "Saving..." : "Save Changes"}
						</Button>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Modal */}
			<Dialog onOpenChange={setDeleteModalOpen} open={deleteModalOpen}>
				<DialogContent className="border-[#2A2F35] bg-[#16181D] sm:max-w-[400px]">
					<DialogHeader>
						<DialogTitle className="text-[#F7F8F8]">Delete Project</DialogTitle>
						<DialogDescription className="text-[#8A8F98]">
							Are you sure you want to delete this project? This action cannot
							be undone. All issues associated with this project will remain but
							will no longer be linked to the project.
						</DialogDescription>
					</DialogHeader>
					<div className="flex gap-3 pt-4">
						<Button
							className="flex-1 text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
							onClick={() => setDeleteModalOpen(false)}
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							className="flex-1 bg-[#F87171] text-white hover:bg-[#DC2626]"
							disabled={deleteProject.isPending}
							onClick={() => deleteProject.mutate({ id: projectId })}
						>
							{deleteProject.isPending ? "Deleting..." : "Delete"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
