"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";

type IssueStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
type Priority = "NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// Define minimal types we need
interface User {
	id: string;
	name: string | null;
	email: string;
	image: string | null;
}

interface Label {
	id: string;
	name: string;
	color: string;
}

interface Team {
	id: string;
	name: string;
	key: string;
	color: string;
}

interface Project {
	id: string;
	name: string;
}

interface Issue {
	id: string;
	identifier: string;
	title: string;
	status: IssueStatus;
	priority: Priority;
	createdAt: Date;
	teamId: string;
	projectId: string | null;
	assigneeId: string | null;
	cycleId: string | null;
	team: Team;
	project: Project | null;
	assignee: User | null;
	labels: { label: Label }[];
}

import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Check,
	CheckCircle2,
	ChevronRight,
	Circle,
	CircleDashed,
	CircleDot,
	MoreHorizontal,
	XCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type IssueWithRelations = Issue & {
	team: Team;
	project: Project | null;
	assignee: User | null;
	labels: { label: Label }[];
};

type GroupBy = "none" | "status" | "assignee" | "priority" | "project";
type SortField = "identifier" | "title" | "status" | "priority" | "createdAt";
type SortDirection = "asc" | "desc";

interface IssueListTableProps {
	issues: IssueWithRelations[];
	isLoading: boolean;
	groupBy: GroupBy;
	workspaceId: string;
}

const statusIcons = {
	BACKLOG: CircleDashed,
	TODO: Circle,
	IN_PROGRESS: CircleDot,
	DONE: CheckCircle2,
	CANCELLED: XCircle,
};

const statusLabels: Record<IssueStatus, string> = {
	BACKLOG: "Backlog",
	TODO: "Todo",
	IN_PROGRESS: "In Progress",
	DONE: "Done",
	CANCELLED: "Cancelled",
};

const statusColors: Record<IssueStatus, string> = {
	BACKLOG: "#8A8F98",
	TODO: "#8A8F98",
	IN_PROGRESS: "#5E6AD2",
	DONE: "#4EC9B0",
	CANCELLED: "#F87171",
};

const priorityIcons: Record<Priority, string> = {
	NO_PRIORITY: "−",
	LOW: "↓",
	MEDIUM: "↑",
	HIGH: "↑↑",
	URGENT: "⚠",
};

const priorityColors: Record<Priority, string> = {
	NO_PRIORITY: "#8A8F98",
	LOW: "#8A8F98",
	MEDIUM: "#F59E0B",
	HIGH: "#F97316",
	URGENT: "#EF4444",
};

const priorityLabels: Record<Priority, string> = {
	NO_PRIORITY: "No Priority",
	LOW: "Low",
	MEDIUM: "Medium",
	HIGH: "High",
	URGENT: "Urgent",
};

export function IssueListTable({
	issues,
	isLoading,
	groupBy,
	workspaceId,
}: IssueListTableProps) {
	const [sortField, setSortField] = useState<SortField>("createdAt");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [focusedIndex, setFocusedIndex] = useState<number>(-1);
	const tableRef = useRef<HTMLDivElement>(null);
	const utils = api.useUtils();

	const updateMutation = api.issue.update.useMutation({
		onSuccess: () => {
			utils.issue.list.invalidate();
		},
	});

	const deleteMutation = api.issue.delete.useMutation({
		onSuccess: () => {
			utils.issue.list.invalidate();
			setSelectedIds(new Set());
		},
	});

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
	};

	const getSortIcon = (field: SortField) => {
		if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
		return sortDirection === "asc" ? (
			<ArrowUp className="ml-2 h-4 w-4" />
		) : (
			<ArrowDown className="ml-2 h-4 w-4" />
		);
	};

	const sortedIssues = [...issues].sort((a, b) => {
		let comparison = 0;
		switch (sortField) {
			case "identifier":
				comparison = a.identifier.localeCompare(b.identifier);
				break;
			case "title":
				comparison = a.title.localeCompare(b.title);
				break;
			case "status":
				comparison = a.status.localeCompare(b.status);
				break;
			case "priority":
				comparison = a.priority.localeCompare(b.priority);
				break;
			case "createdAt":
				comparison =
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				break;
		}
		return sortDirection === "asc" ? comparison : -comparison;
	});

	const toggleSelection = (id: string) => {
		const newSelected = new Set(selectedIds);
		if (newSelected.has(id)) {
			newSelected.delete(id);
		} else {
			newSelected.add(id);
		}
		setSelectedIds(newSelected);
	};

	const toggleAll = () => {
		if (selectedIds.size === sortedIssues.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(sortedIssues.map((i) => i.id)));
		}
	};

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			switch (e.key) {
				case "j":
					e.preventDefault();
					setFocusedIndex((prev) =>
						Math.min(prev + 1, sortedIssues.length - 1),
					);
					break;
				case "k":
					e.preventDefault();
					setFocusedIndex((prev) => Math.max(prev - 1, 0));
					break;
				case "x":
					e.preventDefault();
					if (focusedIndex >= 0 && focusedIndex < sortedIssues.length) {
						toggleSelection(sortedIssues[focusedIndex]?.id ?? "");
					}
					break;
				case "Enter":
					e.preventDefault();
					if (focusedIndex >= 0 && focusedIndex < sortedIssues.length) {
						window.location.href = `/issues/${sortedIssues[focusedIndex]?.id}`;
					}
					break;
			}
		},
		[focusedIndex, sortedIssues, toggleSelection],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	const groupIssues = (
		issues: IssueWithRelations[],
	): [string, IssueWithRelations[]][] => {
		if (groupBy === "none") return [["", issues]];

		const groups = new Map<string, IssueWithRelations[]>();

		for (const issue of issues) {
			let key: string;
			switch (groupBy) {
				case "status":
					key = issue.status;
					break;
				case "assignee":
					key = issue.assignee?.name ?? "Unassigned";
					break;
				case "priority":
					key = issue.priority;
					break;
				case "project":
					key = issue.project?.name ?? "No Project";
					break;
				default:
					key = "";
			}

			if (!groups.has(key)) {
				groups.set(key, []);
			}
			groups.get(key)?.push(issue);
		}

		return Array.from(groups.entries());
	};

	const groupedIssues = groupIssues(sortedIssues);

	const getGroupLabel = (key: string): string => {
		switch (groupBy) {
			case "status":
				return statusLabels[key as IssueStatus] ?? key;
			case "priority":
				return priorityLabels[key as Priority] ?? key;
			default:
				return key;
		}
	};

	const handleStatusChange = (issueId: string, status: IssueStatus) => {
		updateMutation.mutate({ id: issueId, status });
	};

	const handlePriorityChange = (issueId: string, priority: Priority) => {
		updateMutation.mutate({ id: issueId, priority });
	};

	const handleBulkDelete = () => {
		for (const id of selectedIds) {
			deleteMutation.mutate({ id });
		}
	};

	if (isLoading) {
		return (
			<div className="p-4">
				<div className="space-y-2">
					{Array.from({ length: 10 }).map((_, i) => (
						<Skeleton className="h-12 w-full bg-[#2A2F35]" key={i} />
					))}
				</div>
			</div>
		);
	}

	if (sortedIssues.length === 0) {
		return (
			<div className="flex h-64 flex-col items-center justify-center text-[#8A8F98]">
				<Circle className="mb-4 h-12 w-12 opacity-20" />
				<p>No issues found</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col" ref={tableRef}>
			{/* Bulk Actions Bar */}
			{selectedIds.size > 0 && (
				<div className="flex items-center justify-between border-[#2A2F35] border-b bg-[#1a1c21] px-4 py-2">
					<span className="text-[#F7F8F8] text-sm">
						{selectedIds.size} selected
					</span>
					<div className="flex gap-2">
						<Button
							className="text-[#F87171] hover:bg-[#2A2F35] hover:text-[#F87171]"
							onClick={handleBulkDelete}
							size="sm"
							variant="ghost"
						>
							Delete
						</Button>
					</div>
				</div>
			)}

			{/* Table Header */}
			<div className="grid grid-cols-[auto_auto_1fr_120px_120px_120px_40px] items-center border-[#2A2F35] border-b bg-[#0F1115] px-4 py-2 font-medium text-[#8A8F98] text-xs uppercase tracking-wider">
				<Checkbox
					checked={
						selectedIds.size === sortedIssues.length && sortedIssues.length > 0
					}
					className="border-[#2A2F35] data-[state=checked]:border-[#5E6AD2] data-[state=checked]:bg-[#5E6AD2]"
					onCheckedChange={toggleAll}
				/>
				<Button
					className="justify-start text-[#8A8F98] hover:text-[#F7F8F8]"
					onClick={() => handleSort("identifier")}
					size="sm"
					variant="ghost"
				>
					ID {getSortIcon("identifier")}
				</Button>
				<Button
					className="justify-start text-[#8A8F98] hover:text-[#F7F8F8]"
					onClick={() => handleSort("title")}
					size="sm"
					variant="ghost"
				>
					Title {getSortIcon("title")}
				</Button>
				<Button
					className="justify-start text-[#8A8F98] hover:text-[#F7F8F8]"
					onClick={() => handleSort("status")}
					size="sm"
					variant="ghost"
				>
					Status {getSortIcon("status")}
				</Button>
				<Button
					className="justify-start text-[#8A8F98] hover:text-[#F7F8F8]"
					onClick={() => handleSort("priority")}
					size="sm"
					variant="ghost"
				>
					Priority {getSortIcon("priority")}
				</Button>
				<span className="px-3">Assignee</span>
				<span />
			</div>

			{/* Issue List */}
			<div className="flex-1 overflow-auto">
				{groupedIssues.map(([groupKey, groupIssues], groupIndex) => (
					<div key={groupKey || groupIndex}>
						{groupBy !== "none" && (
							<div className="sticky top-0 z-10 flex items-center gap-2 border-[#2A2F35] border-b bg-[#16181D] px-4 py-2">
								<ChevronRight className="h-4 w-4 text-[#8A8F98]" />
								<span className="font-medium text-[#F7F8F8]">
									{getGroupLabel(groupKey)}
								</span>
								<Badge
									className="bg-[#2A2F35] text-[#8A8F98]"
									variant="secondary"
								>
									{groupIssues.length}
								</Badge>
							</div>
						)}
						{groupIssues.map((issue, index) => {
							const globalIndex = groupIndex * 1000 + index;
							const isFocused = focusedIndex === globalIndex;
							const isSelected = selectedIds.has(issue.id);
							const StatusIcon = statusIcons[issue.status];

							return (
								<div
									className={cn(
										"grid grid-cols-[auto_auto_1fr_120px_120px_120px_40px] items-center border-[#2A2F35] border-b px-4 py-2 transition-colors",
										isFocused && "bg-[#1e2127]",
										isSelected && "bg-[#5E6AD2]/10",
										!isFocused && !isSelected && "hover:bg-[#16181D]",
									)}
									key={issue.id}
									onClick={() => setFocusedIndex(globalIndex)}
									onDoubleClick={() => {
										window.location.href = `/issues/${issue.id}`;
									}}
								>
									<Checkbox
										checked={isSelected}
										className="border-[#2A2F35] data-[state=checked]:border-[#5E6AD2] data-[state=checked]:bg-[#5E6AD2]"
										onCheckedChange={() => toggleSelection(issue.id)}
										onClick={(e) => e.stopPropagation()}
									/>
									<span className="px-3 text-[#8A8F98] text-sm">
										{issue.identifier}
									</span>
									<div className="flex items-center gap-2 overflow-hidden px-3">
										<span className="truncate text-[#F7F8F8] text-sm">
											{issue.title}
										</span>
										{issue.labels.length > 0 && (
											<div className="flex shrink-0 gap-1">
												{issue.labels.map(({ label }) => (
													<Badge
														className="h-5 border px-2 text-xs"
														key={label.id}
														style={{
															backgroundColor: `${label.color}20`,
															color: label.color,
															borderColor: label.color,
														}}
														variant="outline"
													>
														{label.name}
													</Badge>
												))}
											</div>
										)}
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												className="h-8 justify-start gap-2 text-[#8A8F98] hover:text-[#F7F8F8]"
												onClick={(e) => e.stopPropagation()}
												size="sm"
												variant="ghost"
											>
												<StatusIcon
													className="h-4 w-4"
													style={{ color: statusColors[issue.status] }}
												/>
												<span className="hidden sm:inline">
													{statusLabels[issue.status]}
												</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="border-[#2A2F35] bg-[#16181D]">
											{(Object.keys(statusIcons) as IssueStatus[]).map(
												(status) => (
													<DropdownMenuItem
														className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
														key={status}
														onClick={() => handleStatusChange(issue.id, status)}
													>
														{issue.status === status && (
															<Check className="mr-2 h-4 w-4" />
														)}
														{statusLabels[status]}
													</DropdownMenuItem>
												),
											)}
										</DropdownMenuContent>
									</DropdownMenu>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												className="h-8 justify-start gap-2 text-[#8A8F98] hover:text-[#F7F8F8]"
												onClick={(e) => e.stopPropagation()}
												size="sm"
												variant="ghost"
											>
												<span style={{ color: priorityColors[issue.priority] }}>
													{priorityIcons[issue.priority]}
												</span>
												<span className="hidden sm:inline">
													{priorityLabels[issue.priority]}
												</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="border-[#2A2F35] bg-[#16181D]">
											{(Object.keys(priorityIcons) as Priority[]).map(
												(priority) => (
													<DropdownMenuItem
														className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
														key={priority}
														onClick={() =>
															handlePriorityChange(issue.id, priority)
														}
													>
														{issue.priority === priority && (
															<Check className="mr-2 h-4 w-4" />
														)}
														<span style={{ color: priorityColors[priority] }}>
															{priorityIcons[priority]}
														</span>
														{priorityLabels[priority]}
													</DropdownMenuItem>
												),
											)}
										</DropdownMenuContent>
									</DropdownMenu>
									<div className="flex justify-center px-3">
										{issue.assignee ? (
											<Avatar className="h-6 w-6">
												<AvatarImage src={issue.assignee.image ?? undefined} />
												<AvatarFallback className="bg-[#5E6AD2] text-white text-xs">
													{issue.assignee.name?.charAt(0).toUpperCase()}
												</AvatarFallback>
											</Avatar>
										) : (
											<span className="text-[#8A8F98] text-xs">—</span>
										)}
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												className="h-8 w-8 p-0 text-[#8A8F98] hover:text-[#F7F8F8]"
												onClick={(e) => e.stopPropagation()}
												size="sm"
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
												onClick={() => {
													window.location.href = `/issues/${issue.id}`;
												}}
											>
												View Issue
											</DropdownMenuItem>
											<DropdownMenuSeparator className="bg-[#2A2F35]" />
											<DropdownMenuItem
												className="text-[#F87171] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
												onClick={() => deleteMutation.mutate({ id: issue.id })}
											>
												Delete Issue
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
}
