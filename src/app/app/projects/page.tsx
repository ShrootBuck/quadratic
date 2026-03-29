"use client";

import { format } from "date-fns";
import {
	Archive,
	CheckCircle2,
	Clock,
	FolderKanban,
	MoreHorizontal,
	Plus,
	Target,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { cn } from "@/lib/utils";
import { api } from "~/trpc/react";

type ProjectStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface CreateProjectForm {
	name: string;
	description: string;
	teamId: string;
	color: string;
	startDate: string;
	targetDate: string;
	leadId: string;
}

const colorOptions = [
	{ name: "Purple", value: "#5E6AD2" },
	{ name: "Blue", value: "#3B82F6" },
	{ name: "Green", value: "#4EC9B0" },
	{ name: "Yellow", value: "#FBBF24" },
	{ name: "Orange", value: "#F97316" },
	{ name: "Red", value: "#F87171" },
	{ name: "Pink", value: "#EC4899" },
];

export default function ProjectsPage() {
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [formData, setFormData] = useState<CreateProjectForm>({
		name: "",
		description: "",
		teamId: "",
		color: "#5E6AD2",
		startDate: "",
		targetDate: "",
		leadId: "",
	});

	const { workspaceId } = useCurrentWorkspace();

	const { data: projectsData, isLoading } = api.project.list.useQuery({
		workspaceId,
		limit: 50,
	});

	const { data: teamsData } = api.workspace.getTeams.useQuery({
		workspaceId,
	});

	const { data: membersData } = api.workspace.getMembers.useQuery({
		workspaceId,
	});

	const utils = api.useUtils();

	const createProject = api.project.create.useMutation({
		onSuccess: () => {
			utils.project.list.invalidate({ workspaceId });
			setCreateModalOpen(false);
			setFormData({
				name: "",
				description: "",
				teamId: "",
				color: "#5E6AD2",
				startDate: "",
				targetDate: "",
				leadId: "",
			});
		},
	});

	const archiveProject = api.project.archive.useMutation({
		onSuccess: () => {
			utils.project.list.invalidate({ workspaceId });
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.teamId) return;

		createProject.mutate({
			name: formData.name,
			description: formData.description || undefined,
			teamId: formData.teamId,
			workspaceId,
			color: formData.color,
			leadId: formData.leadId || undefined,
			startDate: formData.startDate ? new Date(formData.startDate) : undefined,
			targetDate: formData.targetDate
				? new Date(formData.targetDate)
				: undefined,
		});
	};

	const calculateProgress = (project: { issues: { status: string }[] }) => {
		if (project.issues.length === 0) return 0;
		const completed = project.issues.filter((i) => i.status === "DONE").length;
		return Math.round((completed / project.issues.length) * 100);
	};

	const activeProjects =
		projectsData?.projects.filter(
			(p) => p.status === "PLANNED" || p.status === "IN_PROGRESS",
		) ?? [];
	const completedProjects =
		projectsData?.projects.filter((p) => p.status === "COMPLETED") ?? [];
	const cancelledProjects =
		projectsData?.projects.filter((p) => p.status === "CANCELLED") ?? [];

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-[#2A2F35] border-b px-6 py-4">
				<div>
					<h1 className="font-semibold text-[#F7F8F8] text-xl">Projects</h1>
					<p className="text-[#8A8F98] text-sm">
						{projectsData?.total ?? 0} projects
					</p>
				</div>
				<Dialog onOpenChange={setCreateModalOpen} open={createModalOpen}>
					<DialogTrigger asChild>
						<Button className="bg-[#5E6AD2] text-white hover:bg-[#4F57B3]">
							<Plus className="mr-2 h-4 w-4" />
							New Project
						</Button>
					</DialogTrigger>
					<DialogContent className="border-[#2A2F35] bg-[#16181D] sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle className="text-[#F7F8F8]">
								Create New Project
							</DialogTitle>
						</DialogHeader>
						<form className="space-y-4 pt-4" onSubmit={handleSubmit}>
							<div className="space-y-2">
								<Label className="text-[#F7F8F8]" htmlFor="name">
									Name
								</Label>
								<Input
									className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] placeholder:text-[#8A8F98]"
									id="name"
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder="e.g., Website Redesign"
									required
									value={formData.name}
								/>
							</div>

							<div className="space-y-2">
								<Label className="text-[#F7F8F8]" htmlFor="description">
									Description
								</Label>
								<Textarea
									className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] placeholder:text-[#8A8F98]"
									id="description"
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									placeholder="Project description..."
									value={formData.description}
								/>
							</div>

							<div className="space-y-2">
								<Label className="text-[#F7F8F8]">Team</Label>
								<Select
									onValueChange={(value) =>
										setFormData({ ...formData, teamId: value })
									}
									value={formData.teamId}
								>
									<SelectTrigger className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]">
										<SelectValue placeholder="Select a team" />
									</SelectTrigger>
									<SelectContent className="border-[#2A2F35] bg-[#16181D]">
										{teamsData?.map((team) => (
											<SelectItem
												className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
												key={team.id}
												value={team.id}
											>
												<div className="flex items-center gap-2">
													<div
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
								<Label className="text-[#F7F8F8]">Project Lead</Label>
								<Select
									onValueChange={(value) =>
										setFormData({ ...formData, leadId: value })
									}
									value={formData.leadId}
								>
									<SelectTrigger className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]">
										<SelectValue placeholder="Select a lead" />
									</SelectTrigger>
									<SelectContent className="border-[#2A2F35] bg-[#16181D]">
										{membersData?.map((member) => (
											<SelectItem
												className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
												key={member.user.id}
												value={member.user.id}
											>
												<div className="flex items-center gap-2">
													{member.user.name}
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label className="text-[#F7F8F8]">Color</Label>
								<div className="flex flex-wrap gap-2">
									{colorOptions.map((color) => (
										<button
											className={cn(
												"flex h-8 w-8 items-center justify-center rounded-full transition-all",
												formData.color === color.value
													? "ring-2 ring-white ring-offset-2 ring-offset-[#16181D]"
													: "hover:scale-110",
											)}
											key={color.value}
											onClick={() =>
												setFormData({ ...formData, color: color.value })
											}
											style={{ backgroundColor: color.value }}
											type="button"
										>
											{formData.color === color.value && (
												<CheckCircle2 className="h-4 w-4 text-white" />
											)}
										</button>
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
										id="startDate"
										onChange={(e) =>
											setFormData({ ...formData, startDate: e.target.value })
										}
										type="date"
										value={formData.startDate}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-[#F7F8F8]" htmlFor="targetDate">
										Target Date
									</Label>
									<Input
										className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]"
										id="targetDate"
										onChange={(e) =>
											setFormData({ ...formData, targetDate: e.target.value })
										}
										type="date"
										value={formData.targetDate}
									/>
								</div>
							</div>

							<Button
								className="w-full bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
								disabled={createProject.isPending || !formData.teamId}
								type="submit"
							>
								{createProject.isPending ? "Creating..." : "Create Project"}
							</Button>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-auto p-6">
				{isLoading ? (
					<div className="space-y-4">
						{["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
							<div
								className="h-20 animate-pulse rounded-lg bg-[#2A2F35]"
								key={key}
							/>
						))}
					</div>
				) : (
					<div className="space-y-8">
						{/* Active Projects */}
						{activeProjects.length > 0 && (
							<section>
								<h2 className="mb-4 font-medium text-[#8A8F98] text-sm">
									Active
								</h2>
								<div className="space-y-2">
									{activeProjects.map((project) => (
										<ProjectCard
											key={project.id}
											onArchive={() =>
												archiveProject.mutate({ id: project.id })
											}
											progress={calculateProgress(project)}
											project={project}
										/>
									))}
								</div>
							</section>
						)}

						{/* Completed Projects */}
						{completedProjects.length > 0 && (
							<section>
								<h2 className="mb-4 font-medium text-[#8A8F98] text-sm">
									Completed
								</h2>
								<div className="space-y-2">
									{completedProjects.map((project) => (
										<ProjectCard
											key={project.id}
											onArchive={() =>
												archiveProject.mutate({ id: project.id })
											}
											progress={calculateProgress(project)}
											project={project}
										/>
									))}
								</div>
							</section>
						)}

						{/* Cancelled Projects */}
						{cancelledProjects.length > 0 && (
							<section>
								<h2 className="mb-4 font-medium text-[#8A8F98] text-sm">
									Archived
								</h2>
								<div className="space-y-2">
									{cancelledProjects.map((project) => (
										<ProjectCard
											key={project.id}
											onArchive={() => {}}
											progress={calculateProgress(project)}
											project={project}
										/>
									))}
								</div>
							</section>
						)}

						{projectsData?.projects.length === 0 && (
							<div className="py-12 text-center">
								<FolderKanban className="mx-auto mb-4 h-12 w-12 text-[#8A8F98]" />
								<h3 className="mb-2 font-medium text-[#F7F8F8]">
									No projects yet
								</h3>
								<p className="text-[#8A8F98]">
									Create your first project to get started
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

function ProjectCard({
	project,
	progress,
	onArchive,
}: {
	project: {
		id: string;
		name: string;
		description: string | null;
		status: ProjectStatus;
		startDate: Date | null;
		targetDate: Date | null;
		color: string;
		team: { name: string; color: string };
		lead: {
			id: string;
			name: string;
			email: string;
			image: string | null;
		} | null;
		issues: { id: string; status: string }[];
	};
	progress: number;
	onArchive: () => void;
}) {
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

	const getStatusColor = (status: ProjectStatus) => {
		switch (status) {
			case "IN_PROGRESS":
				return "bg-[#5E6AD2]/20 text-[#5E6AD2]";
			case "COMPLETED":
				return "bg-[#4EC9B0]/20 text-[#4EC9B0]";
			case "CANCELLED":
				return "bg-[#8A8F98]/20 text-[#8A8F98]";
			default:
				return "bg-[#8A8F98]/20 text-[#8A8F98]";
		}
	};

	return (
		<div className="flex items-center gap-4 rounded-lg border border-[#2A2F35] bg-[#16181D] p-4 transition-colors hover:border-[#5E6AD2]">
			<Link
				className="flex flex-1 items-center gap-4"
				href={`/app/projects/${project.id}`}
			>
				<div
					className="flex h-10 w-10 items-center justify-center rounded-lg"
					style={{ backgroundColor: `${project.color}20` }}
				>
					<FolderKanban className="h-5 w-5" style={{ color: project.color }} />
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-3">
						<h3 className="truncate font-medium text-[#F7F8F8]">
							{project.name}
						</h3>
						<span
							className={cn(
								"rounded-full px-2 py-0.5 text-xs",
								getStatusColor(project.status),
							)}
						>
							{getStatusLabel(project.status)}
						</span>
					</div>

					{project.description && (
						<p className="mt-1 truncate text-[#8A8F98] text-sm">
							{project.description}
						</p>
					)}

					<div className="mt-2 flex items-center gap-4 text-[#8A8F98] text-xs">
						{project.startDate && (
							<div className="flex items-center gap-1">
								<Clock className="h-3 w-3" />
								<span>
									{format(new Date(project.startDate), "MMM d")}
									{project.targetDate
										? ` - ${format(new Date(project.targetDate), "MMM d, yyyy")}`
										: ""}
								</span>
							</div>
						)}
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
						<span>{project.issues.length} issues</span>
					</div>
				</div>

				{/* Progress Bar */}
				<div className="w-32">
					<div className="mb-1 flex items-center justify-between text-xs">
						<span className="text-[#8A8F98]">{progress}%</span>
						<span className="text-[#8A8F98]">
							{project.issues.filter((i) => i.status === "DONE").length}/
							{project.issues.length}
						</span>
					</div>
					<div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2A2F35]">
						<div
							className="h-full rounded-full transition-all"
							style={{ width: `${progress}%`, backgroundColor: project.color }}
						/>
					</div>
				</div>
			</Link>

			{/* Actions */}
			{project.status !== "CANCELLED" && (
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
						className="border-[#2A2F35] bg-[#16181D]"
					>
						<DropdownMenuItem
							className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
							onClick={onArchive}
						>
							<Archive className="mr-2 h-4 w-4" />
							Archive Project
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
}
