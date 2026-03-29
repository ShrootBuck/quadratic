"use client";

import { format } from "date-fns";
import {
	ArrowLeft,
	Calendar,
	ChartBar,
	CheckCircle2,
	Circle,
	Edit,
	LayoutGrid,
	ListTodo,
	MoreVertical,
	Plus,
	RotateCcw,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { api } from "~/trpc/react";

type CycleStatus = "UPCOMING" | "CURRENT" | "COMPLETED";
type IssueStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";

const statusLabels: Record<IssueStatus, string> = {
	BACKLOG: "Backlog",
	TODO: "Todo",
	IN_PROGRESS: "In Progress",
	DONE: "Done",
	CANCELLED: "Cancelled",
};

const statusColors: Record<IssueStatus, string> = {
	BACKLOG: "bg-[#8A8F98]",
	TODO: "bg-[#8A8F98]",
	IN_PROGRESS: "bg-[#5E6AD2]",
	DONE: "bg-[#4EC9B0]",
	CANCELLED: "bg-[#F87171]",
};

export default function CycleDetailPage() {
	const params = useParams();
	const cycleId = params.id as string;
	const [view, setView] = useState<"list" | "board">("list");
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [addIssueModalOpen, setAddIssueModalOpen] = useState(false);

	const { data: cycle, isLoading } = api.cycle.getById.useQuery({
		id: cycleId,
	});

	const utils = api.useUtils();

	const updateCycle = api.cycle.update.useMutation({
		onSuccess: () => {
			utils.cycle.getById.invalidate({ id: cycleId });
			setEditModalOpen(false);
		},
	});

	const deleteCycle = api.cycle.delete.useMutation({
		onSuccess: () => {
			window.location.href = "/app/cycles";
		},
	});

	const removeIssue = api.cycle.removeIssue.useMutation({
		onSuccess: () => {
			utils.cycle.getById.invalidate({ id: cycleId });
		},
	});

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-[#8A8F98]">Loading cycle...</div>
			</div>
		);
	}

	if (!cycle) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-[#8A8F98]">Cycle not found</div>
			</div>
		);
	}

	const completedIssues = cycle.issues.filter(
		(i) => i.status === "DONE",
	).length;
	const progress =
		cycle.issues.length > 0
			? Math.round((completedIssues / cycle.issues.length) * 100)
			: 0;

	const getStatusIcon = (status: CycleStatus) => {
		switch (status) {
			case "CURRENT":
				return <RotateCcw className="h-5 w-5 text-[#5E6AD2]" />;
			case "COMPLETED":
				return <CheckCircle2 className="h-5 w-5 text-[#4EC9B0]" />;
			default:
				return <Circle className="h-5 w-5 text-[#8A8F98]" />;
		}
	};

	const getStatusLabel = (status: CycleStatus) => {
		switch (status) {
			case "CURRENT":
				return "Current";
			case "COMPLETED":
				return "Completed";
			default:
				return "Upcoming";
		}
	};

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="border-[#2A2F35] border-b px-6 py-4">
				<div className="mb-4 flex items-center gap-2">
					<Link href="/app/cycles">
						<Button
							className="text-[#8A8F98] hover:text-[#F7F8F8]"
							size="sm"
							variant="ghost"
						>
							<ArrowLeft className="mr-1 h-4 w-4" />
							Back to Cycles
						</Button>
					</Link>
				</div>

				<div className="flex items-start justify-between">
					<div className="flex items-start gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#16181D]">
							{getStatusIcon(cycle.status as CycleStatus)}
						</div>

						<div>
							<div className="flex items-center gap-3">
								<h1 className="font-semibold text-2xl text-[#F7F8F8]">
									{cycle.name}
								</h1>
								<Badge
									className={cn(
										cycle.status === "CURRENT" &&
											"bg-[#5E6AD2]/20 text-[#5E6AD2]",
										cycle.status === "COMPLETED" &&
											"bg-[#4EC9B0]/20 text-[#4EC9B0]",
										cycle.status === "UPCOMING" &&
											"bg-[#8A8F98]/20 text-[#8A8F98]",
									)}
								>
									{getStatusLabel(cycle.status as CycleStatus)}
								</Badge>
							</div>

							{cycle.description && (
								<p className="mt-1 max-w-2xl text-[#8A8F98]">
									{cycle.description}
								</p>
							)}

							<div className="mt-2 flex items-center gap-4 text-[#8A8F98] text-sm">
								<div className="flex items-center gap-1">
									<Calendar className="h-4 w-4" />
									<span>
										{format(new Date(cycle.startDate), "MMM d, yyyy")} -{" "}
										{format(new Date(cycle.endDate), "MMM d, yyyy")}
									</span>
								</div>
								<div className="flex items-center gap-1">
									<div
										className="h-2 w-2 rounded-full"
										style={{ backgroundColor: cycle.team.color }}
									/>
									<span>{cycle.team.name}</span>
								</div>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Link href={`/app/cycles/${cycleId}/analytics`}>
							<Button className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]">
								<ChartBar className="mr-2 h-4 w-4" />
								Analytics
							</Button>
						</Link>

						<Button
							className="bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
							onClick={() => setAddIssueModalOpen(true)}
						>
							<Plus className="mr-2 h-4 w-4" />
							Add Issues
						</Button>

						<Dialog onOpenChange={setEditModalOpen} open={editModalOpen}>
							<DialogTrigger asChild>
								<Button
									className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
									variant="outline"
								>
									<Edit className="mr-2 h-4 w-4" />
									Edit
								</Button>
							</DialogTrigger>
							<EditCycleDialog
								cycle={cycle}
								isPending={updateCycle.isPending}
								onClose={() => setEditModalOpen(false)}
								onUpdate={updateCycle.mutate}
							/>
						</Dialog>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
									size="icon"
									variant="outline"
								>
									<MoreVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="border-[#2A2F35] bg-[#16181D]">
								<DropdownMenuItem
									className="text-[#F87171] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
									onClick={() => {
										if (
											confirm("Are you sure you want to delete this cycle?")
										) {
											deleteCycle.mutate({ id: cycleId });
										}
									}}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete Cycle
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Progress Bar */}
				<div className="mt-6">
					<div className="mb-2 flex items-center justify-between">
						<span className="text-[#8A8F98] text-sm">Progress</span>
						<span className="font-medium text-[#F7F8F8]">
							{progress}% ({completedIssues}/{cycle.issues.length} issues)
						</span>
					</div>
					<div className="h-2 w-full overflow-hidden rounded-full bg-[#2A2F35]">
						<div
							className="h-full rounded-full bg-[#5E6AD2] transition-all"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			</div>

			{/* View Switcher */}
			<div className="flex items-center gap-2 border-[#2A2F35] border-b px-6 py-2">
				<Button
					className={cn(
						"border-[#2A2F35]",
						view === "list"
							? "bg-[#2A2F35] text-[#F7F8F8]"
							: "bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]",
					)}
					onClick={() => setView("list")}
					size="sm"
					variant="outline"
				>
					<ListTodo className="mr-2 h-4 w-4" />
					List
				</Button>
				<Button
					className={cn(
						"border-[#2A2F35]",
						view === "board"
							? "bg-[#2A2F35] text-[#F7F8F8]"
							: "bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]",
					)}
					onClick={() => setView("board")}
					size="sm"
					variant="outline"
				>
					<LayoutGrid className="mr-2 h-4 w-4" />
					Board
				</Button>
			</div>

			{/* Issues List */}
			<div className="flex-1 overflow-auto p-6">
				{cycle.issues.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center">
						<div className="mb-4 rounded-full bg-[#2A2F35] p-4">
							<ListTodo className="h-8 w-8 text-[#8A8F98]" />
						</div>
						<h3 className="mb-2 font-medium text-[#F7F8F8]">
							No issues in this cycle
						</h3>
						<p className="mb-4 max-w-sm text-center text-[#8A8F98]">
							Add issues to this cycle to start tracking progress
						</p>
						<Button
							className="bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
							onClick={() => setAddIssueModalOpen(true)}
						>
							<Plus className="mr-2 h-4 w-4" />
							Add Issues
						</Button>
					</div>
				) : view === "list" ? (
					<div className="space-y-2">
						{cycle.issues.map((issue) => (
							<div
								className="flex items-center gap-4 rounded-lg border border-[#2A2F35] bg-[#16181D] p-4 transition-colors hover:border-[#5E6AD2]"
								key={issue.id}
							>
								<Link
									className="flex flex-1 items-center gap-4"
									href={`/app/issues/${issue.id}`}
								>
									<div className="flex items-center gap-2">
										<div
											className={cn(
												"h-2 w-2 rounded-full",
												statusColors[issue.status as IssueStatus],
											)}
										/>
										<span className="font-mono text-[#8A8F98] text-sm">
											{issue.identifier}
										</span>
									</div>

									<span className="flex-1 font-medium text-[#F7F8F8]">
										{issue.title}
									</span>

									<div className="flex items-center gap-2">
										{issue.labels.map((il) => (
											<Badge
												className="border"
												key={il.label.id}
												style={{
													backgroundColor: `${il.label.color}20`,
													color: il.label.color,
													borderColor: il.label.color,
												}}
												variant="outline"
											>
												{il.label.name}
											</Badge>
										))}

										<Badge
											className={cn(
												"border-none",
												statusColors[issue.status as IssueStatus],
												"bg-opacity-20 text-white",
											)}
										>
											{statusLabels[issue.status as IssueStatus]}
										</Badge>
									</div>
								</Link>

								<Button
									className="text-[#8A8F98] hover:text-[#F87171]"
									onClick={() => removeIssue.mutate({ issueId: issue.id })}
									size="sm"
									variant="ghost"
								>
									Remove
								</Button>
							</div>
						))}
					</div>
				) : (
					<CycleBoardView issues={cycle.issues} />
				)}
			</div>

			{/* Add Issues Modal */}
			<AddIssuesDialog
				cycleId={cycleId}
				onOpenChange={setAddIssueModalOpen}
				open={addIssueModalOpen}
				workspaceId={cycle.workspaceId}
			/>
		</div>
	);
}

function EditCycleDialog({
	cycle,
	onClose,
	onUpdate,
	isPending,
}: {
	cycle: {
		id: string;
		name: string;
		description: string | null;
		startDate: Date;
		endDate: Date;
		status: string;
	};
	onClose: () => void;
	onUpdate: (data: {
		id: string;
		name: string;
		description?: string;
		startDate: Date;
		endDate: Date;
		status: CycleStatus;
	}) => void;
	isPending: boolean;
}) {
	const [formData, setFormData] = useState({
		name: cycle.name,
		description: cycle.description || "",
		startDate: format(new Date(cycle.startDate), "yyyy-MM-dd"),
		endDate: format(new Date(cycle.endDate), "yyyy-MM-dd"),
		status: cycle.status as CycleStatus,
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onUpdate({
			id: cycle.id,
			name: formData.name,
			description: formData.description,
			startDate: new Date(formData.startDate),
			endDate: new Date(formData.endDate),
			status: formData.status,
		});
	};

	return (
		<DialogContent className="border-[#2A2F35] bg-[#16181D] sm:max-w-[500px]">
			<DialogHeader>
				<DialogTitle className="text-[#F7F8F8]">Edit Cycle</DialogTitle>
			</DialogHeader>
			<form className="space-y-4 pt-4" onSubmit={handleSubmit}>
				<div className="space-y-2">
					<Label className="text-[#F7F8F8]" htmlFor="edit-name">
						Name
					</Label>
					<Input
						className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]"
						id="edit-name"
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						required
						value={formData.name}
					/>
				</div>

				<div className="space-y-2">
					<Label className="text-[#F7F8F8]" htmlFor="edit-description">
						Description
					</Label>
					<Textarea
						className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]"
						id="edit-description"
						onChange={(e) =>
							setFormData({ ...formData, description: e.target.value })
						}
						value={formData.description}
					/>
				</div>

				<div className="space-y-2">
					<Label className="text-[#F7F8F8]">Status</Label>
					<Select
						onValueChange={(value) =>
							setFormData({ ...formData, status: value as CycleStatus })
						}
						value={formData.status}
					>
						<SelectTrigger className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="border-[#2A2F35] bg-[#16181D]">
							<SelectItem
								className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
								value="UPCOMING"
							>
								Upcoming
							</SelectItem>
							<SelectItem
								className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
								value="CURRENT"
							>
								Current
							</SelectItem>
							<SelectItem
								className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
								value="COMPLETED"
							>
								Completed
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label className="text-[#F7F8F8]" htmlFor="edit-startDate">
							Start Date
						</Label>
						<Input
							className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]"
							id="edit-startDate"
							onChange={(e) =>
								setFormData({ ...formData, startDate: e.target.value })
							}
							required
							type="date"
							value={formData.startDate}
						/>
					</div>

					<div className="space-y-2">
						<Label className="text-[#F7F8F8]" htmlFor="edit-endDate">
							End Date
						</Label>
						<Input
							className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]"
							id="edit-endDate"
							onChange={(e) =>
								setFormData({ ...formData, endDate: e.target.value })
							}
							required
							type="date"
							value={formData.endDate}
						/>
					</div>
				</div>

				<div className="flex gap-2">
					<Button
						className="flex-1 border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
						onClick={onClose}
						type="button"
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						className="flex-1 bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
						disabled={isPending}
						type="submit"
					>
						{isPending ? "Saving..." : "Save Changes"}
					</Button>
				</div>
			</form>
		</DialogContent>
	);
}

function AddIssuesDialog({
	cycleId,
	open,
	onOpenChange,
	workspaceId,
}: {
	cycleId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	workspaceId: string;
}) {
	const { data: issuesData } = api.issue.list.useQuery({
		workspaceId,
		limit: 100,
	});

	const utils = api.useUtils();

	const addIssue = api.cycle.addIssue.useMutation({
		onSuccess: () => {
			utils.cycle.getById.invalidate({ id: cycleId });
			utils.issue.list.invalidate({ workspaceId });
		},
	});

	// Filter out issues already in this cycle
	const availableIssues =
		issuesData?.issues.filter((issue) => issue.cycleId !== cycleId) ?? [];

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="border-[#2A2F35] bg-[#16181D] sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle className="text-[#F7F8F8]">
						Add Issues to Cycle
					</DialogTitle>
				</DialogHeader>
				<div className="max-h-[400px] overflow-auto pt-4">
					{availableIssues.length === 0 ? (
						<div className="py-8 text-center text-[#8A8F98]">
							No available issues to add
						</div>
					) : (
						<div className="space-y-2">
							{availableIssues.map((issue) => (
								<div
									className="flex items-center gap-4 rounded-lg border border-[#2A2F35] bg-[#0F1115] p-3"
									key={issue.id}
								>
									<div className="flex flex-1 items-center gap-2">
										<span className="font-mono text-[#8A8F98] text-sm">
											{issue.identifier}
										</span>
										<span className="flex-1 font-medium text-[#F7F8F8]">
											{issue.title}
										</span>
									</div>
									<Button
										className="bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
										disabled={addIssue.isPending}
										onClick={() =>
											addIssue.mutate({
												cycleId,
												issueId: issue.id,
											})
										}
										size="sm"
									>
										Add
									</Button>
								</div>
							))}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

function CycleBoardView({
	issues,
}: {
	issues: {
		id: string;
		identifier: string;
		title: string;
		status: string;
		labels: { label: { id: string; name: string; color: string } }[];
	}[];
}) {
	const columns: IssueStatus[] = [
		"BACKLOG",
		"TODO",
		"IN_PROGRESS",
		"DONE",
		"CANCELLED",
	];

	return (
		<div className="flex gap-4 overflow-x-auto pb-4">
			{columns.map((status) => {
				const columnIssues = issues.filter((i) => i.status === status);

				return (
					<div className="w-72 flex-shrink-0" key={status}>
						<div className="mb-3 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div
									className={cn("h-2 w-2 rounded-full", statusColors[status])}
								/>
								<span className="font-medium text-[#F7F8F8]">
									{statusLabels[status]}
								</span>
							</div>
							<span className="rounded-full bg-[#2A2F35] px-2 py-0.5 text-[#8A8F98] text-xs">
								{columnIssues.length}
							</span>
						</div>

						<div className="space-y-2">
							{columnIssues.map((issue) => (
								<Link
									className="block rounded-lg border border-[#2A2F35] bg-[#16181D] p-3 transition-colors hover:border-[#5E6AD2]"
									href={`/app/issues/${issue.id}`}
									key={issue.id}
								>
									<div className="mb-2 font-mono text-[#8A8F98] text-xs">
										{issue.identifier}
									</div>
									<div className="mb-2 font-medium text-[#F7F8F8] text-sm">
										{issue.title}
									</div>
									<div className="flex flex-wrap gap-1">
										{issue.labels.map((il) => (
											<span
												className="rounded px-1.5 py-0.5 text-xs"
												key={il.label.id}
												style={{
													backgroundColor: `${il.label.color}20`,
													color: il.label.color,
												}}
											>
												{il.label.name}
											</span>
										))}
									</div>
								</Link>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}
