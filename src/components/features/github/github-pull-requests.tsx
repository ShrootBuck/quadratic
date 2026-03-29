"use client";

import {
	Check,
	Copy,
	ExternalLink,
	GitBranch,
	GitMerge,
	GitPullRequest,
	X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "~/trpc/react";

type PullRequestStatus = "OPEN" | "MERGED" | "CLOSED" | "DRAFT";

interface GitHubPullRequestsProps {
	issueId: string;
}

const statusConfig: Record<
	PullRequestStatus,
	{
		label: string;
		color: string;
		icon: React.ComponentType<{ className?: string }>;
	}
> = {
	OPEN: {
		label: "Open",
		color: "#4EC9B0",
		icon: GitPullRequest,
	},
	MERGED: {
		label: "Merged",
		color: "#5E6AD2",
		icon: GitMerge,
	},
	CLOSED: {
		label: "Closed",
		color: "#F87171",
		icon: GitPullRequest,
	},
	DRAFT: {
		label: "Draft",
		color: "#8A8F98",
		icon: GitPullRequest,
	},
};

function PRStatusBadge({ status }: { status: PullRequestStatus }) {
	const config = statusConfig[status] ?? statusConfig.OPEN;
	const Icon = config.icon;

	return (
		<span
			className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-xs"
			style={{
				backgroundColor: `${config.color}20`,
				color: config.color,
			}}
		>
			<Icon className="h-3 w-3" />
			{config.label}
		</span>
	);
}

export function GitHubPullRequests({ issueId }: GitHubPullRequestsProps) {
	const [newPrUrl, setNewPrUrl] = useState("");
	const [showLinkInput, setShowLinkInput] = useState(false);
	const [copiedBranch, setCopiedBranch] = useState(false);

	const { data: pullRequests, refetch } = api.github.listByIssue.useQuery({
		issueId,
	});

	const { data: branchData } = api.github.generateBranch.useQuery({
		issueId,
	});

	const linkMutation = api.github.linkPullRequest.useMutation({
		onSuccess: () => {
			setNewPrUrl("");
			setShowLinkInput(false);
			void refetch();
		},
	});

	const unlinkMutation = api.github.unlinkPullRequest.useMutation({
		onSuccess: () => {
			void refetch();
		},
	});

	const refreshMutation = api.github.refreshStatus.useMutation({
		onSuccess: () => {
			void refetch();
		},
	});

	const handleLinkPr = () => {
		if (!newPrUrl.trim()) return;
		linkMutation.mutate({ issueId, url: newPrUrl.trim() });
	};

	const handleUnlinkPr = (prId: string) => {
		unlinkMutation.mutate({ issueId, prId });
	};

	const handleCopyBranch = () => {
		if (branchData?.branchName) {
			navigator.clipboard.writeText(branchData.branchName);
			setCopiedBranch(true);
			setTimeout(() => setCopiedBranch(false), 2000);
		}
	};

	return (
		<TooltipProvider>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<span className="font-medium text-[#8A8F98] text-xs uppercase tracking-wider">
						GitHub
					</span>
					<div className="flex items-center gap-1">
						<Button
							className="h-7 px-2 text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
							disabled={refreshMutation.isPending}
							onClick={() => refreshMutation.mutate({ issueId })}
							size="sm"
							variant="ghost"
						>
							Refresh
						</Button>
						<Button
							className="h-7 px-2 text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
							onClick={() => setShowLinkInput(!showLinkInput)}
							size="sm"
							variant="ghost"
						>
							{showLinkInput ? "Cancel" : "Link PR"}
						</Button>
					</div>
				</div>

				{/* Branch name */}
				{branchData?.branchName && (
					<div className="flex items-center gap-2 rounded border border-[#2A2F35] bg-[#0F1115] p-2">
						<GitBranch className="h-4 w-4 shrink-0 text-[#8A8F98]" />
						<code className="flex-1 truncate text-[#F7F8F8] text-xs">
							{branchData.branchName}
						</code>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									className="h-6 w-6 shrink-0 p-0 text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
									onClick={handleCopyBranch}
									size="sm"
									variant="ghost"
								>
									{copiedBranch ? (
										<Check className="h-3.5 w-3.5" />
									) : (
										<Copy className="h-3.5 w-3.5" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Copy branch name</p>
							</TooltipContent>
						</Tooltip>
					</div>
				)}

				{/* Link PR input */}
				{showLinkInput && (
					<div className="space-y-2">
						<Input
							className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] placeholder:text-[#8A8F98]"
							onChange={(e) => setNewPrUrl(e.target.value)}
							placeholder="https://github.com/owner/repo/pull/123"
							value={newPrUrl}
						/>
						<Button
							className="w-full bg-[#5E6AD2] text-white hover:bg-[#4A57B8]"
							disabled={!newPrUrl.trim() || linkMutation.isPending}
							onClick={handleLinkPr}
							size="sm"
						>
							{linkMutation.isPending ? "Linking..." : "Link Pull Request"}
						</Button>
					</div>
				)}

				{/* Linked PRs list */}
				{pullRequests && pullRequests.length > 0 ? (
					<div className="space-y-2">
						{pullRequests.map((pr) => (
							<div
								className="group flex items-start gap-2 rounded border border-[#2A2F35] bg-[#0F1115] p-3"
								key={pr.id}
							>
								<div className="flex flex-1 flex-col gap-1">
									<div className="flex items-center gap-2">
										<PRStatusBadge status={pr.status as PullRequestStatus} />
										<span className="text-[#8A8F98] text-xs">#{pr.number}</span>
									</div>
									<a
										className="truncate text-[#F7F8F8] text-sm hover:text-[#5E6AD2] hover:underline"
										href={pr.url}
										rel="noopener noreferrer"
										target="_blank"
									>
										{pr.title}
									</a>
									<div className="flex items-center gap-2 text-[#8A8F98] text-xs">
										<span>{pr.repository}</span>
										<span>•</span>
										<span>{pr.author}</span>
										{pr.branch && (
											<>
												<span>•</span>
												<code className="rounded bg-[#2A2F35] px-1">
													{pr.branch}
												</code>
											</>
										)}
									</div>
								</div>
								<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
									<Button
										className="h-7 w-7 p-0 text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
										onClick={() => window.open(pr.url, "_blank")}
										size="sm"
										variant="ghost"
									>
										<ExternalLink className="h-4 w-4" />
									</Button>
									<Button
										className="h-7 w-7 p-0 text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F87171]"
										onClick={() => handleUnlinkPr(pr.id)}
										size="sm"
										variant="ghost"
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							</div>
						))}
					</div>
				) : (
					!showLinkInput && (
						<div className="rounded border border-[#2A2F35] border-dashed p-4 text-center">
							<GitPullRequest className="mx-auto mb-2 h-8 w-8 text-[#8A8F98]" />
							<p className="text-[#8A8F98] text-sm">No linked pull requests</p>
							<p className="text-[#8A8F98] text-xs">
								Click "Link PR" to connect a GitHub PR
							</p>
						</div>
					)
				)}
			</div>
		</TooltipProvider>
	);
}
