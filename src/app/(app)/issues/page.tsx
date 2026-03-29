"use client";

import { ChevronDown, Filter, Plus } from "lucide-react";
import { useState } from "react";
import { CreateIssueModal } from "@/components/features/issues/create-issue-modal";
import { IssueFilters } from "@/components/features/issues/issue-filters";
import { IssueListTable } from "@/components/features/issues/issue-list-table";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "~/trpc/react";

type IssueStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
type Priority = "NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Filters {
	status: IssueStatus | null;
	priority: Priority | null;
	assigneeId: string | null;
	projectId: string | null;
	labelIds: string[];
	search: string;
}

type GroupBy = "none" | "status" | "assignee" | "priority" | "project";

export default function IssuesPage() {
	const [filters, setFilters] = useState<Filters>({
		status: null,
		priority: null,
		assigneeId: null,
		projectId: null,
		labelIds: [],
		search: "",
	});
	const [groupBy, setGroupBy] = useState<GroupBy>("none");
	const [showFilters, setShowFilters] = useState(true);
	const [createModalOpen, setCreateModalOpen] = useState(false);

	// For now, we'll use a mock workspace ID since we're in single-workspace mode
	const workspaceId = "clz1234567890";

	const { data, isLoading } = api.issue.list.useQuery({
		workspaceId,
		status: filters.status ?? undefined,
		priority: filters.priority ?? undefined,
		assigneeId: filters.assigneeId ?? undefined,
		projectId: filters.projectId ?? undefined,
		labelIds: filters.labelIds.length > 0 ? filters.labelIds : undefined,
		search: filters.search || undefined,
		limit: 50,
	});

	const handleFilterChange = <K extends keyof Filters>(
		key: K,
		value: Filters[K],
	) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const clearFilters = () => {
		setFilters({
			status: null,
			priority: null,
			assigneeId: null,
			projectId: null,
			labelIds: [],
			search: "",
		});
	};

	const hasActiveFilters =
		filters.status !== null ||
		filters.priority !== null ||
		filters.assigneeId !== null ||
		filters.projectId !== null ||
		filters.labelIds.length > 0 ||
		filters.search !== "";

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-[#2A2F35] border-b px-6 py-4">
				<div>
					<h1 className="font-semibold text-[#F7F8F8] text-xl">Issues</h1>
					<p className="text-[#8A8F98] text-sm">
						{data?.pagination.total ?? 0} issues
						{hasActiveFilters && (
							<span className="ml-2 text-[#5E6AD2]">(filtered)</span>
						)}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
						onClick={() => setShowFilters(!showFilters)}
						size="sm"
						variant="outline"
					>
						<Filter className="mr-2 h-4 w-4" />
						Filters
						{hasActiveFilters && (
							<span className="ml-2 rounded-full bg-[#5E6AD2] px-2 py-0.5 text-white text-xs">
								{
									[
										filters.status,
										filters.priority,
										filters.assigneeId,
										filters.projectId,
										...filters.labelIds,
										filters.search,
									].filter(Boolean).length
								}
							</span>
						)}
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
								size="sm"
								variant="outline"
							>
								Group by
								<ChevronDown className="ml-2 h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="border-[#2A2F35] bg-[#16181D]">
							<DropdownMenuItem
								className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
								onClick={() => setGroupBy("none")}
							>
								{groupBy === "none" && "✓ "}No Grouping
							</DropdownMenuItem>
							<DropdownMenuItem
								className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
								onClick={() => setGroupBy("status")}
							>
								{groupBy === "status" && "✓ "}Status
							</DropdownMenuItem>
							<DropdownMenuItem
								className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
								onClick={() => setGroupBy("priority")}
							>
								{groupBy === "priority" && "✓ "}Priority
							</DropdownMenuItem>
							<DropdownMenuItem
								className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
								onClick={() => setGroupBy("assignee")}
							>
								{groupBy === "assignee" && "✓ "}Assignee
							</DropdownMenuItem>
							<DropdownMenuItem
								className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
								onClick={() => setGroupBy("project")}
							>
								{groupBy === "project" && "✓ "}Project
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<Button
						className="bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
						onClick={() => setCreateModalOpen(true)}
						size="sm"
					>
						<Plus className="mr-2 h-4 w-4" />
						New Issue
					</Button>
				</div>
			</div>

			{/* Content */}
			<div className="flex flex-1 overflow-hidden">
				{/* Filters Sidebar */}
				{showFilters && (
					<div className="w-64 border-[#2A2F35] border-r">
						<IssueFilters
							filters={filters}
							onChange={handleFilterChange}
							onClear={clearFilters}
							workspaceId={workspaceId}
						/>
					</div>
				)}

				{/* Issue List */}
				<div className="flex-1 overflow-auto">
					<IssueListTable
						groupBy={groupBy}
						isLoading={isLoading}
						issues={data?.issues ?? []}
						workspaceId={workspaceId}
					/>
				</div>
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
