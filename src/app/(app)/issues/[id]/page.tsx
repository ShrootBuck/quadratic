"use client";

import { formatDistanceToNow } from "date-fns";
import {
	ArrowLeft,
	Check,
	CheckCircle2,
	Circle,
	CircleDashed,
	CircleDot,
	Link2,
	MoreHorizontal,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IssueActivity } from "@/components/features/issues/issue-activity";
import { IssueComments } from "@/components/features/issues/issue-comments";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "~/trpc/react";

type IssueStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
type Priority = "NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

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

const priorityLabels: Record<Priority, string> = {
	NO_PRIORITY: "No Priority",
	LOW: "Low",
	MEDIUM: "Medium",
	HIGH: "High",
	URGENT: "Urgent",
};

const priorityColors: Record<Priority, string> = {
	NO_PRIORITY: "#8A8F98",
	LOW: "#8A8F98",
	MEDIUM: "#F59E0B",
	HIGH: "#F97316",
	URGENT: "#EF4444",
};

function getStatusIcon(status: IssueStatus) {
	switch (status) {
		case "BACKLOG":
			return CircleDashed;
		case "TODO":
			return Circle;
		case "IN_PROGRESS":
			return CircleDot;
		case "DONE":
			return CheckCircle2;
		case "CANCELLED":
			return XCircle;
	}
}

interface IssueDetailPageProps {
	params: Promise<{ id: string }>;
}

export default function IssueDetailPage({ params }: IssueDetailPageProps) {
	const router = useRouter();
	const [issueId, setIssueId] = useState<string>("");

	useEffect(() => {
		params.then((p) => setIssueId(p.id));
	}, [params]);

	const { data: issue, isLoading } = api.issue.byId.useQuery(
		{ id: issueId },
		{ enabled: !!issueId },
	);
	const utils = api.useUtils();

	const updateMutation = api.issue.update.useMutation({
		onSuccess: () => {
			utils.issue.byId.invalidate({ id: issueId });
			utils.issue.list.invalidate();
		},
	});

	const [title, setTitle] = useState(issue?.title ?? "");
	const [description, setDescription] = useState(issue?.description ?? "");

	useEffect(() => {
		if (issue) {
			setTitle(issue.title);
			setDescription(issue.description ?? "");
		}
	}, [issue]);

	useEffect(() => {
		if (!issue || title === issue.title) return;

		const timeout = setTimeout(() => {
			updateMutation.mutate({ id: issue.id, title });
		}, 1000);

		return () => clearTimeout(timeout);
	}, [title, issue, updateMutation]);

	useEffect(() => {
		if (!issue || description === (issue.description ?? "")) return;

		const timeout = setTimeout(() => {
			updateMutation.mutate({ id: issue.id, description });
		}, 1000);

		return () => clearTimeout(timeout);
	}, [description, issue, updateMutation]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			if (e.key === "c" && !e.metaKey && !e.ctrlKey) {
				e.preventDefault();
				router.push("/issues");
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [router]);

	const handleCopyLink = () => {
		const url = `${window.location.origin}/issues/${issueId}`;
		navigator.clipboard.writeText(url);
	};

	const handleStatusChange = (status: IssueStatus) => {
		if (issue) {
			updateMutation.mutate({ id: issue.id, status });
		}
	};

	const handlePriorityChange = (priority: Priority) => {
		if (issue) {
			updateMutation.mutate({ id: issue.id, priority });
		}
	};

	const handleAssigneeChange = (assigneeId: string | null) => {
		if (issue) {
			updateMutation.mutate({ id: issue.id, assigneeId });
		}
	};

	const handleProjectChange = (projectId: string | null) => {
		if (issue) {
			updateMutation.mutate({ id: issue.id, projectId });
		}
	};

	const handleLabelToggle = (labelId: string) => {
		if (!issue) return;

		const currentLabelIds = issue.labels.map((l) => l.label.id);
		const newLabelIds = currentLabelIds.includes(labelId)
			? currentLabelIds.filter((id) => id !== labelId)
			: [...currentLabelIds, labelId];

		updateMutation.mutate({ id: issue.id, labelIds: newLabelIds });
	};

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-[#8A8F98]">Loading issue...</div>
			</div>
		);
	}

	if (!issue) {
		return (
			<div className="flex h-full flex-col items-center justify-center">
				<div className="text-[#8A8F98]">Issue not found</div>
				<Button
					className="mt-4"
					onClick={() => router.push("/issues")}
					variant="outline"
				>
					Go back to issues
				</Button>
			</div>
		);
	}

	const StatusIcon = getStatusIcon(issue.status);

	return (
		<TooltipProvider>
			<div className="flex h-full flex-col">
				<div className="flex items-center justify-between border-[#2A2F35] border-b px-6 py-3">
					<div className="flex items-center gap-3">
						<Button
							className="text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
							onClick={() => router.push("/issues")}
							size="sm"
							variant="ghost"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back
						</Button>
						<span className="text-[#8A8F98]">/</span>
						<span className="font-medium text-[#8A8F98] text-sm">
							{issue.identifier}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									className="text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
									onClick={handleCopyLink}
									size="sm"
									variant="ghost"
								>
									<Link2 className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Copy issue link</p>
							</TooltipContent>
						</Tooltip>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									className="text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
									size="sm"
									variant="ghost"
								>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="border-[#2A2F35] bg-[#16181D]">
								<DropdownMenuItem
									className="text-[#F87171] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
									onClick={() => {
										router.push("/issues");
									}}
								>
									Delete Issue
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				<div className="flex flex-1 overflow-hidden">
					<div className="flex-1 overflow-auto p-6">
						<div className="mb-6">
							<Input
								className="border-transparent bg-transparent px-0 font-semibold text-2xl text-[#F7F8F8] placeholder:text-[#8A8F98] hover:bg-[#1a1c21] focus:border-[#5E6AD2] focus:bg-[#16181D]"
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Issue title"
								value={title}
							/>
						</div>

						<div className="mb-8">
							<Textarea
								className="min-h-[200px] border-[#2A2F35] bg-[#16181D] text-[#F7F8F8] placeholder:text-[#8A8F98] focus:border-[#5E6AD2]"
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Add a description..."
								value={description}
							/>
						</div>

						<Separator className="my-6 bg-[#2A2F35]" />

						<IssueComments issueId={issue.id} />

						<Separator className="my-6 bg-[#2A2F35]" />

						<IssueActivity history={issue.history} />
					</div>

					<div className="w-72 border-[#2A2F35] border-l bg-[#16181D] p-4">
						<div className="space-y-4">
							<div>
								<span className="mb-2 block font-medium text-[#8A8F98] text-xs uppercase tracking-wider">
									Status
								</span>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											className="w-full justify-start border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] hover:bg-[#2A2F35]"
											variant="outline"
										>
											<StatusIcon
												className="mr-2 h-4 w-4"
												style={{ color: statusColors[issue.status] }}
											/>
											{statusLabels[issue.status]}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="border-[#2A2F35] bg-[#16181D]">
										{[
											{ status: "BACKLOG" as const, Icon: CircleDashed },
											{ status: "TODO" as const, Icon: Circle },
											{ status: "IN_PROGRESS" as const, Icon: CircleDot },
											{ status: "DONE" as const, Icon: CheckCircle2 },
											{ status: "CANCELLED" as const, Icon: XCircle },
										].map(({ status, Icon }) => (
											<DropdownMenuItem
												className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
												key={status}
												onClick={() => handleStatusChange(status)}
											>
												{issue.status === status && (
													<Check className="mr-2 h-4 w-4" />
												)}
												<Icon
													className="mr-2 h-4 w-4"
													style={{ color: statusColors[status] }}
												/>
												{statusLabels[status]}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							<div>
								<span className="mb-2 block font-medium text-[#8A8F98] text-xs uppercase tracking-wider">
									Priority
								</span>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											className="w-full justify-start border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] hover:bg-[#2A2F35]"
											variant="outline"
										>
											<span
												className="mr-2"
												style={{ color: priorityColors[issue.priority] }}
											>
												{issue.priority === "NO_PRIORITY" && "-"}
												{issue.priority === "LOW" && "↓"}
												{issue.priority === "MEDIUM" && "↑"}
												{issue.priority === "HIGH" && "↑↑"}
												{issue.priority === "URGENT" && "!"}
											</span>
											{priorityLabels[issue.priority]}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="border-[#2A2F35] bg-[#16181D]">
										{[
											{ priority: "NO_PRIORITY" as const, icon: "-" },
											{ priority: "LOW" as const, icon: "↓" },
											{ priority: "MEDIUM" as const, icon: "↑" },
											{ priority: "HIGH" as const, icon: "↑↑" },
											{ priority: "URGENT" as const, icon: "!" },
										].map(({ priority, icon }) => (
											<DropdownMenuItem
												className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
												key={priority}
												onClick={() => handlePriorityChange(priority)}
											>
												{issue.priority === priority && (
													<Check className="mr-2 h-4 w-4" />
												)}
												<span
													className="mr-2"
													style={{ color: priorityColors[priority] }}
												>
													{icon}
												</span>
												{priorityLabels[priority]}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							<div>
								<span className="mb-2 block font-medium text-[#8A8F98] text-xs uppercase tracking-wider">
									Assignee
								</span>
								<Button
									className="w-full justify-start border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] hover:bg-[#2A2F35]"
									onClick={() =>
										handleAssigneeChange(
											issue.assigneeId ? null : issue.creatorId,
										)
									}
									variant="outline"
								>
									{issue.assignee ? (
										<>
											<Avatar className="mr-2 h-5 w-5">
												<AvatarImage src={issue.assignee.image ?? undefined} />
												<AvatarFallback className="bg-[#5E6AD2] text-white text-xs">
													{issue.assignee.name?.charAt(0).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											{issue.assignee.name}
										</>
									) : (
										<span className="text-[#8A8F98]">Unassigned</span>
									)}
								</Button>
							</div>

							<div>
								<span className="mb-2 block font-medium text-[#8A8F98] text-xs uppercase tracking-wider">
									Project
								</span>
								<Button
									className="w-full justify-start border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] hover:bg-[#2A2F35]"
									onClick={() =>
										handleProjectChange(issue.projectId ? null : "placeholder")
									}
									variant="outline"
								>
									{issue.project ? (
										issue.project.name
									) : (
										<span className="text-[#8A8F98]">No Project</span>
									)}
								</Button>
							</div>

							<div>
								<span className="mb-2 block font-medium text-[#8A8F98] text-xs uppercase tracking-wider">
									Labels
								</span>
								<div className="flex flex-wrap gap-1">
									{issue.labels.length > 0 ? (
										issue.labels.map(({ label }) => (
											<Badge
												className="h-6 cursor-pointer border px-2 text-xs"
												key={label.id}
												onClick={() => handleLabelToggle(label.id)}
												style={{
													backgroundColor: `${label.color}20`,
													color: label.color,
													borderColor: label.color,
												}}
												variant="outline"
											>
												{label.name}
											</Badge>
										))
									) : (
										<span className="text-[#8A8F98] text-sm">No labels</span>
									)}
								</div>
							</div>

							<div>
								<span className="mb-2 block font-medium text-[#8A8F98] text-xs uppercase tracking-wider">
									Due Date
								</span>
								<span className="text-[#F7F8F8] text-sm">
									{issue.dueDate
										? new Date(issue.dueDate).toLocaleDateString()
										: "No due date"}
								</span>
							</div>

							<div>
								<span className="mb-2 block font-medium text-[#8A8F98] text-xs uppercase tracking-wider">
									Created
								</span>
								<span className="text-[#F7F8F8] text-sm">
									{formatDistanceToNow(new Date(issue.createdAt), {
										addSuffix: true,
									})}
								</span>
							</div>

							<div>
								<span className="mb-2 block font-medium text-[#8A8F98] text-xs uppercase tracking-wider">
									Created by
								</span>
								<div className="flex items-center gap-2">
									<Avatar className="h-6 w-6">
										<AvatarImage src={issue.creator.image ?? undefined} />
										<AvatarFallback className="bg-[#5E6AD2] text-white text-xs">
											{issue.creator.name?.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<span className="text-[#F7F8F8] text-sm">
										{issue.creator.name}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</TooltipProvider>
	);
}
