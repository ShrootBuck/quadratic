"use client";

import { LayoutGrid, ListTodo, Plus } from "lucide-react";
import { useState } from "react";
import { CreateIssueModal } from "@/components/features/issues/create-issue-modal";
import { KanbanBoard } from "@/components/features/issues/kanban-board";
import { Button } from "@/components/ui/button";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import {
	BOARD_PAGINATION_LIMIT,
	type IssueStatus,
	type Priority,
} from "~/constants";
import { api } from "~/trpc/react";

interface Filters {
	status: IssueStatus | null;
	priority: Priority | null;
	assigneeId: string | null;
	projectId: string | null;
	labelIds: string[];
	search: string;
}

export default function BoardPage() {
	const [filters] = useState<Filters>({
		status: null,
		priority: null,
		assigneeId: null,
		projectId: null,
		labelIds: [],
		search: "",
	});
	const [createModalOpen, setCreateModalOpen] = useState(false);

	const { workspaceId } = useCurrentWorkspace();

	const { data, isLoading } = api.issue.list.useQuery(
		{
			workspaceId: workspaceId ?? "",
			status: filters.status ?? undefined,
			priority: filters.priority ?? undefined,
			assigneeId: filters.assigneeId ?? undefined,
			projectId: filters.projectId ?? undefined,
			labelIds: filters.labelIds.length > 0 ? filters.labelIds : undefined,
			search: filters.search || undefined,
			limit: BOARD_PAGINATION_LIMIT,
		},
		{
			enabled: !!workspaceId,
		},
	);

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-[#2A2F35] border-b px-6 py-4">
				<div>
					<h1 className="font-semibold text-[#F7F8F8] text-xl">Board</h1>
					<p className="text-[#8A8F98] text-sm">
						{data?.pagination.total ?? 0} issues
					</p>
				</div>
				<Button
					className="bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
					onClick={() => setCreateModalOpen(true)}
					size="sm"
				>
					<Plus className="mr-2 h-4 w-4" />
					New Issue
				</Button>
			</div>

			{/* View Switcher */}
			<div className="flex items-center gap-2 border-[#2A2F35] border-b px-6 py-2">
				<Button
					className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
					onClick={() => (window.location.href = "/app/issues")}
					size="sm"
					variant="outline"
				>
					<ListTodo className="mr-2 h-4 w-4" />
					List
				</Button>
				<Button
					className="border-[#2A2F35] bg-[#2A2F35] text-[#F7F8F8]"
					size="sm"
					variant="outline"
				>
					<LayoutGrid className="mr-2 h-4 w-4" />
					Board
				</Button>
			</div>

			{/* Kanban Board */}
			<KanbanBoard
				isLoading={isLoading}
				issues={data?.issues ?? []}
				workspaceId={workspaceId ?? ""}
			/>

			{/* Create Issue Modal */}
			<CreateIssueModal
				onOpenChange={setCreateModalOpen}
				open={createModalOpen}
				workspaceId={workspaceId ?? ""}
			/>
		</div>
	);
}
