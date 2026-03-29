"use client";

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
// dnd-kit imports
import {
	closestCenter,
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
// Lucide icons
import {
	CheckCircle2,
	ChevronLeft,
	Circle,
	CircleDashed,
	CircleDot,
	Plus,
	Search,
	X,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
// Components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { api } from "~/trpc/react";
// Types
import type { Label, Team, User } from "../../../../generated/prisma";
import { CreateIssueModal } from "./create-issue-modal";

type IssueStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
type Priority = "NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// Status config
const statusConfig: Record<
	IssueStatus,
	{
		label: string;
		color: string;
		bgColor: string;
		icon: React.ComponentType<{
			className?: string;
			style?: React.CSSProperties;
		}>;
	}
> = {
	BACKLOG: {
		label: "Backlog",
		color: "#8A8F98",
		bgColor: "#1a1c21",
		icon: CircleDashed,
	},
	TODO: {
		label: "Todo",
		color: "#8A8F98",
		bgColor: "#1a1c21",
		icon: Circle,
	},
	IN_PROGRESS: {
		label: "In Progress",
		color: "#5E6AD2",
		bgColor: "#1a1c21",
		icon: CircleDot,
	},
	DONE: {
		label: "Done",
		color: "#4EC9B0",
		bgColor: "#1a1c21",
		icon: CheckCircle2,
	},
	CANCELLED: {
		label: "Cancelled",
		color: "#F87171",
		bgColor: "#1a1c21",
		icon: XCircle,
	},
};

const priorityConfig: Record<
	Priority,
	{
		label: string;
		color: string;
		icon: string;
	}
> = {
	NO_PRIORITY: { label: "No Priority", color: "#8A8F98", icon: "−" },
	LOW: { label: "Low", color: "#8A8F98", icon: "↓" },
	MEDIUM: { label: "Medium", color: "#F59E0B", icon: "↑" },
	HIGH: { label: "High", color: "#F97316", icon: "↑↑" },
	URGENT: { label: "Urgent", color: "#EF4444", icon: "⚠" },
};

// Issue type with relations
interface IssueWithRelations {
	id: string;
	identifier: string;
	title: string;
	status: IssueStatus;
	priority: Priority;
	teamId: string;
	projectId: string | null;
	assigneeId: string | null;
	assignee: User | null;
	team: Team;
	labels: { label: Label }[];
}

// Sortable issue card component
function SortableIssueCard({
	issue,
	isOverlay = false,
}: {
	issue: IssueWithRelations;
	isOverlay?: boolean;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: issue.id,
		data: { issue },
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
	};

	const PriorityIcon = () => (
		<span
			className="font-medium text-xs"
			style={{ color: priorityConfig[issue.priority].color }}
		>
			{priorityConfig[issue.priority].icon}
		</span>
	);

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={cn(
				"group relative cursor-grab rounded-md border bg-[#16181D] p-3 shadow-sm transition-all hover:border-[#5E6AD2] hover:shadow-md",
				isDragging && "cursor-grabbing opacity-50",
				isOverlay && "cursor-grabbing shadow-lg ring-2 ring-[#5E6AD2]",
				!isOverlay && !isDragging && "border-[#2A2F35]",
			)}
		>
			<div className="flex items-start gap-2">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="mt-0.5 shrink-0">
								<PriorityIcon />
							</div>
						</TooltipTrigger>
						<TooltipContent side="top">
							<p>{priorityConfig[issue.priority].label}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				<div className="min-w-0 flex-1">
					<p className="line-clamp-2 font-medium text-[#F7F8F8] text-sm">
						{issue.title}
					</p>
					<div className="mt-2 flex items-center justify-between gap-2">
						<span className="text-[#8A8F98] text-xs">{issue.identifier}</span>
						{issue.assignee && (
							<Avatar className="h-5 w-5">
								<AvatarImage src={issue.assignee.image ?? undefined} />
								<AvatarFallback className="bg-[#5E6AD2] text-[10px] text-white">
									{issue.assignee.name?.charAt(0).toUpperCase() ?? "U"}
								</AvatarFallback>
							</Avatar>
						)}
					</div>
					{issue.labels.length > 0 && (
						<div className="mt-2 flex flex-wrap gap-1">
							{issue.labels.map(({ label }) => (
								<Badge
									className="h-4 px-1.5 text-[10px]"
									key={label.id}
									style={{
										backgroundColor: `${label.color}20`,
										borderColor: label.color,
										color: label.color,
									}}
									variant="outline"
								>
									{label.name}
								</Badge>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// Column component
function KanbanColumn({
	status,
	issues,
	isCollapsed,
	onToggleCollapse,
	onCreateIssue,
	filters,
	searchQuery,
}: {
	status: IssueStatus;
	issues: IssueWithRelations[];
	isCollapsed: boolean;
	onToggleCollapse: () => void;
	onCreateIssue: (status: IssueStatus) => void;
	filters: {
		assigneeId: string | null;
		labelIds: string[];
	};
	searchQuery: string;
}) {
	const { setNodeRef, isOver } = useSortable({
		id: status,
		data: { type: "column", status },
	});

	const config = statusConfig[status];
	const StatusIcon = config.icon;

	// Filter issues
	const filteredIssues = useMemo(() => {
		return issues.filter((issue) => {
			if (filters.assigneeId && issue.assigneeId !== filters.assigneeId) {
				return false;
			}
			if (
				filters.labelIds.length > 0 &&
				!issue.labels.some(({ label }) => filters.labelIds.includes(label.id))
			) {
				return false;
			}
			if (
				searchQuery &&
				!issue.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
				!issue.identifier.toLowerCase().includes(searchQuery.toLowerCase())
			) {
				return false;
			}
			return true;
		});
	}, [issues, filters, searchQuery]);

	return (
		<div
			className={cn(
				"flex flex-col rounded-lg transition-all",
				isCollapsed ? "w-12" : "min-w-[280px] flex-1",
				isOver && "bg-[#5E6AD2]/5",
			)}
			ref={setNodeRef}
		>
			{/* Column Header */}
			<div
				className={cn(
					"flex items-center gap-2 rounded-t-lg border-x border-t px-3 py-2",
					"border-[#2A2F35] bg-[#16181D]",
					isCollapsed &&
						"flex-col items-center justify-center rounded-b-lg border-b py-3",
				)}
			>
				<Button
					className={cn(
						"h-6 w-6 p-0 text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]",
						isCollapsed && "rotate-180",
					)}
					onClick={onToggleCollapse}
					size="sm"
					variant="ghost"
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<StatusIcon className="h-4 w-4" style={{ color: config.color }} />
				{!isCollapsed && (
					<>
						<span className="font-medium text-[#F7F8F8] text-sm">
							{config.label}
						</span>
						<Badge className="bg-[#2A2F35] text-[#8A8F98]" variant="secondary">
							{filteredIssues.length}
						</Badge>
					</>
				)}
				{isCollapsed && (
					<span className="mt-1 font-medium text-[#8A8F98] text-[10px] [writing-mode:vertical-lr]">
						{filteredIssues.length}
					</span>
				)}
			</div>

			{/* Column Content */}
			{!isCollapsed && (
				<div className="flex flex-1 flex-col rounded-b-lg border border-[#2A2F35] border-t-0 bg-[#0F1115]">
					{/* Create Issue Button */}
					<div className="p-2">
						<Button
							className="w-full justify-start gap-2 border border-[#2A2F35] border-dashed text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
							onClick={() => onCreateIssue(status)}
							size="sm"
							variant="ghost"
						>
							<Plus className="h-3.5 w-3.5" />
							<span className="text-xs">Create issue</span>
						</Button>
					</div>

					{/* Issues List */}
					<div className="flex-1 space-y-2 overflow-y-auto p-2">
						<SortableContext
							items={filteredIssues.map((i) => i.id)}
							strategy={verticalListSortingStrategy}
						>
							{filteredIssues.map((issue) => (
								<SortableIssueCard issue={issue} key={issue.id} />
							))}
						</SortableContext>
					</div>
				</div>
			)}
		</div>
	);
}

// Main Kanban Board Component
interface KanbanBoardProps {
	issues: IssueWithRelations[];
	workspaceId: string;
	isLoading: boolean;
}

export function KanbanBoard({
	issues,
	workspaceId,
	isLoading,
}: KanbanBoardProps) {
	const [collapsedColumns, setCollapsedColumns] = useState<Set<IssueStatus>>(
		new Set(),
	);
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [_defaultStatus, setDefaultStatus] = useState<IssueStatus>("BACKLOG");
	const [activeId, setActiveId] = useState<string | null>(null);
	const [filters, _setFilters] = useState({
		assigneeId: null as string | null,
		labelIds: [] as string[],
	});
	const [searchQuery, setSearchQuery] = useState("");

	const utils = api.useUtils();
	const updateMutation = api.issue.update.useMutation({
		onSuccess: () => {
			utils.issue.list.invalidate();
		},
	});

	// Group issues by status
	const issuesByStatus = useMemo(() => {
		const grouped: Record<IssueStatus, IssueWithRelations[]> = {
			BACKLOG: [],
			TODO: [],
			IN_PROGRESS: [],
			DONE: [],
			CANCELLED: [],
		};

		for (const issue of issues) {
			if (grouped[issue.status]) {
				grouped[issue.status].push(issue);
			}
		}

		return grouped;
	}, [issues]);

	// Sensors for drag and drop
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	// Handle drag start
	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	};

	// Handle drag end
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveId(null);

		if (!over) return;

		const activeId = active.id as string;
		const overId = over.id as string;

		// Find the issue being dragged
		const draggedIssue = issues.find((i) => i.id === activeId);
		if (!draggedIssue) return;

		// Check if dropped on a column (status)
		const targetStatus = overId as IssueStatus;
		if (statusConfig[targetStatus] && draggedIssue.status !== targetStatus) {
			updateMutation.mutate({
				id: activeId,
				status: targetStatus,
			});
		}
	};

	// Toggle column collapse
	const toggleColumn = (status: IssueStatus) => {
		setCollapsedColumns((prev) => {
			const next = new Set(prev);
			if (next.has(status)) {
				next.delete(status);
			} else {
				next.add(status);
			}
			return next;
		});
	};

	// Handle create issue
	const handleCreateIssue = (status: IssueStatus) => {
		setDefaultStatus(status);
		setCreateModalOpen(true);
	};

	// Get active issue for drag overlay
	const activeIssue = activeId ? issues.find((i) => i.id === activeId) : null;

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-[#8A8F98]">Loading board...</div>
			</div>
		);
	}

	const statusOrder: IssueStatus[] = [
		"BACKLOG",
		"TODO",
		"IN_PROGRESS",
		"DONE",
		"CANCELLED",
	];

	return (
		<div className="flex h-full flex-col">
			{/* Toolbar */}
			<div className="flex items-center gap-4 border-[#2A2F35] border-b px-4 py-3">
				{/* Search */}
				<div className="relative">
					<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-[#8A8F98]" />
					<Input
						className="w-64 border-[#2A2F35] bg-transparent pl-9 text-[#F7F8F8] text-sm placeholder:text-[#8A8F98]"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search issues..."
						value={searchQuery}
					/>
					{searchQuery && (
						<Button
							className="absolute top-1 right-1 h-6 w-6 p-0 text-[#8A8F98] hover:text-[#F7F8F8]"
							onClick={() => setSearchQuery("")}
							size="sm"
							variant="ghost"
						>
							<X className="h-3 w-3" />
						</Button>
					)}
				</div>

				{/* Quick Filters */}
				<div className="flex items-center gap-2">
					<span className="text-[#8A8F98] text-xs">Quick filters:</span>
					{/* Assignee filter placeholder */}
					<Badge
						className="cursor-pointer border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35]"
						variant="outline"
					>
						Assignee
					</Badge>
					{/* Label filter placeholder */}
					<Badge
						className="cursor-pointer border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35]"
						variant="outline"
					>
						Labels
					</Badge>
				</div>
			</div>

			{/* Board */}
			<div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
				<DndContext
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
					onDragStart={handleDragStart}
					sensors={sensors}
				>
					<div className="flex h-full gap-4">
						{statusOrder.map((status) => (
							<KanbanColumn
								filters={filters}
								isCollapsed={collapsedColumns.has(status)}
								issues={issuesByStatus[status]}
								key={status}
								onCreateIssue={handleCreateIssue}
								onToggleCollapse={() => toggleColumn(status)}
								searchQuery={searchQuery}
								status={status}
							/>
						))}
					</div>

					{/* Drag Overlay */}
					<DragOverlay>
						{activeIssue ? (
							<SortableIssueCard isOverlay issue={activeIssue} />
						) : null}
					</DragOverlay>
				</DndContext>
			</div>

			{/* Create Issue Modal */}
			<CreateIssueModal
				onOpenChange={setCreateModalOpen}
				open={createModalOpen}
				workspaceId={workspaceId}
			/>
		</div>
	);
}
