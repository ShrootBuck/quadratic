"use client";

import { api } from "~/trpc/react";

type IssueStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
type Priority = "NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

import { CheckCircle2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Filters {
	status: IssueStatus | null;
	priority: Priority | null;
	assigneeId: string | null;
	projectId: string | null;
	labelIds: string[];
	search: string;
}

interface IssueFiltersProps {
	filters: Filters;
	onChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
	onClear: () => void;
	workspaceId: string;
}

const statusOptions: { value: IssueStatus; label: string; color: string }[] = [
	{ value: "BACKLOG", label: "Backlog", color: "#8A8F98" },
	{ value: "TODO", label: "Todo", color: "#8A8F98" },
	{ value: "IN_PROGRESS", label: "In Progress", color: "#5E6AD2" },
	{ value: "DONE", label: "Done", color: "#4EC9B0" },
	{ value: "CANCELLED", label: "Cancelled", color: "#F87171" },
];

const priorityOptions: {
	value: Priority;
	label: string;
	color: string;
	icon: string;
}[] = [
	{ value: "NO_PRIORITY", label: "No Priority", color: "#8A8F98", icon: "−" },
	{ value: "LOW", label: "Low", color: "#8A8F98", icon: "↓" },
	{ value: "MEDIUM", label: "Medium", color: "#F59E0B", icon: "↑" },
	{ value: "HIGH", label: "High", color: "#F97316", icon: "↑↑" },
	{ value: "URGENT", label: "Urgent", color: "#EF4444", icon: "⚠" },
];

export function IssueFilters({
	filters,
	onChange,
	onClear,
	workspaceId,
}: IssueFiltersProps) {
	const { data: projects } = api.workspace.getProjects.useQuery({
		workspaceId,
	});
	const { data: members } = api.workspace.getMembers.useQuery({ workspaceId });
	const { data: labels } = api.workspace.getLabels.useQuery({ workspaceId });

	const hasActiveFilters =
		filters.status !== null ||
		filters.priority !== null ||
		filters.assigneeId !== null ||
		filters.projectId !== null ||
		filters.labelIds.length > 0 ||
		filters.search !== "";

	const toggleLabel = (labelId: string) => {
		const newLabelIds = filters.labelIds.includes(labelId)
			? filters.labelIds.filter((id) => id !== labelId)
			: [...filters.labelIds, labelId];
		onChange("labelIds", newLabelIds);
	};

	return (
		<ScrollArea className="h-full">
			<div className="p-4">
				{/* Search */}
				<div className="mb-6">
					<label
						className="mb-2 block font-medium text-[#8A8F98] text-xs uppercase"
						htmlFor="issue-search"
					>
						Search
					</label>
					<div className="relative">
						<Search className="absolute top-2.5 left-3 h-4 w-4 text-[#8A8F98]" />
						<Input
							className="border-[#2A2F35] bg-transparent pl-9 text-[#F7F8F8] placeholder:text-[#8A8F98]"
							id="issue-search"
							onChange={(e) => onChange("search", e.target.value)}
							placeholder="Search issues..."
							value={filters.search}
						/>
					</div>
				</div>

				{/* Status Filter */}
				<div className="mb-6">
					<div className="mb-2 block font-medium text-[#8A8F98] text-xs uppercase">
						Status
					</div>
					<div className="space-y-1">
						{statusOptions.map((option) => (
							<button
								className={cn(
									"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
									filters.status === option.value
										? "bg-[#5E6AD2]/10 text-[#F7F8F8]"
										: "text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]",
								)}
								key={option.value}
								onClick={() =>
									onChange(
										"status",
										filters.status === option.value ? null : option.value,
									)
								}
								type="button"
							>
								<span style={{ color: option.color }}>●</span>
								<span>{option.label}</span>
								{filters.status === option.value && (
									<X className="ml-auto h-3 w-3" />
								)}
							</button>
						))}
					</div>
				</div>

				{/* Priority Filter */}
				<div className="mb-6">
					<div className="mb-2 block font-medium text-[#8A8F98] text-xs uppercase">
						Priority
					</div>
					<div className="space-y-1">
						{priorityOptions.map((option) => (
							<button
								className={cn(
									"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
									filters.priority === option.value
										? "bg-[#5E6AD2]/10 text-[#F7F8F8]"
										: "text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]",
								)}
								key={option.value}
								onClick={() =>
									onChange(
										"priority",
										filters.priority === option.value ? null : option.value,
									)
								}
								type="button"
							>
								<span style={{ color: option.color }}>{option.icon}</span>
								<span>{option.label}</span>
								{filters.priority === option.value && (
									<X className="ml-auto h-3 w-3" />
								)}
							</button>
						))}
					</div>
				</div>

				{/* Assignee Filter */}
				<div className="mb-6">
					<div className="mb-2 block font-medium text-[#8A8F98] text-xs uppercase">
						Assignee
					</div>
					<div className="space-y-1">
						<button
							className={cn(
								"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
								filters.assigneeId === "unassigned"
									? "bg-[#5E6AD2]/10 text-[#F7F8F8]"
									: "text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]",
							)}
							onClick={() =>
								onChange(
									"assigneeId",
									filters.assigneeId === "unassigned" ? null : "unassigned",
								)
							}
							type="button"
						>
							<span className="text-[#8A8F98]">○</span>
							<span>No assignee</span>
							{filters.assigneeId === "unassigned" && (
								<X className="ml-auto h-3 w-3" />
							)}
						</button>
						{members?.map((member) => (
							<button
								className={cn(
									"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
									filters.assigneeId === member.user.id
										? "bg-[#5E6AD2]/10 text-[#F7F8F8]"
										: "text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]",
								)}
								key={member.user.id}
								onClick={() =>
									onChange(
										"assigneeId",
										filters.assigneeId === member.user.id
											? null
											: member.user.id,
									)
								}
								type="button"
							>
								<div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5E6AD2] text-white text-xs">
									{member.user.name?.charAt(0).toUpperCase()}
								</div>
								<span className="truncate">{member.user.name}</span>
								{filters.assigneeId === member.user.id && (
									<X className="ml-auto h-3 w-3" />
								)}
							</button>
						))}
					</div>
				</div>

				{/* Project Filter */}
				{projects && projects.length > 0 && (
					<div className="mb-6">
						<div className="mb-2 block font-medium text-[#8A8F98] text-xs uppercase">
							Project
						</div>
						<div className="space-y-1">
							{projects.map((project) => (
								<button
									className={cn(
										"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
										filters.projectId === project.id
											? "bg-[#5E6AD2]/10 text-[#F7F8F8]"
											: "text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]",
									)}
									key={project.id}
									onClick={() =>
										onChange(
											"projectId",
											filters.projectId === project.id ? null : project.id,
										)
									}
									type="button"
								>
									<span className="h-2 w-2 rounded-full bg-[#5E6AD2]" />
									<span className="truncate">{project.name}</span>
									{filters.projectId === project.id && (
										<X className="ml-auto h-3 w-3" />
									)}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Label Filter */}
				{labels && labels.length > 0 && (
					<div className="mb-6">
						<div className="mb-2 block font-medium text-[#8A8F98] text-xs uppercase">
							Labels
						</div>
						<div className="space-y-1">
							{labels.map((label) => (
								<button
									className={cn(
										"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
										filters.labelIds.includes(label.id)
											? "bg-[#5E6AD2]/10 text-[#F7F8F8]"
											: "text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]",
									)}
									key={label.id}
									onClick={() => toggleLabel(label.id)}
									type="button"
								>
									<span
										className="h-2 w-2 rounded-full"
										style={{ backgroundColor: label.color }}
									/>
									<span className="truncate">{label.name}</span>
									{filters.labelIds.includes(label.id) && (
										<CheckCircle2 className="ml-auto h-3 w-3" />
									)}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Clear All */}
				{hasActiveFilters && (
					<Button
						className="w-full text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
						onClick={onClear}
						size="sm"
						variant="ghost"
					>
						<X className="mr-2 h-4 w-4" />
						Clear all filters
					</Button>
				)}
			</div>
		</ScrollArea>
	);
}
