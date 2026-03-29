"use client";

import { format } from "date-fns";
import {
	FolderKanban,
	LayoutGrid,
	ListTodo,
	MoreHorizontal,
	RotateCcw,
	Settings,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "~/trpc/react";

export default function TeamDetailPage() {
	const params = useParams();
	const teamId = params.id as string;
	const [activeTab, setActiveTab] = useState("overview");

	const { data: team, isLoading } = api.team.getById.useQuery({ id: teamId });

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5E6AD2] border-t-transparent" />
			</div>
		);
	}

	if (!team) {
		return (
			<div className="flex h-full flex-col items-center justify-center">
				<Users className="mb-4 h-12 w-12 text-[#8A8F98]" />
				<h3 className="mb-2 font-medium text-[#F7F8F8]">Team not found</h3>
				<p className="text-[#8A8F98]">
					The team you're looking for doesn't exist or you don't have access.
				</p>
			</div>
		);
	}

	const activeIssues = team.issues.filter(
		(i) => i.status !== "DONE" && i.status !== "CANCELLED",
	);
	const completedIssues = team.issues.filter((i) => i.status === "DONE");

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-[#2A2F35] border-b px-6 py-4">
				<div className="flex items-center gap-4">
					<div
						className="flex h-12 w-12 items-center justify-center rounded-lg"
						style={{ backgroundColor: `${team.color}20` }}
					>
						<Users className="h-6 w-6" style={{ color: team.color }} />
					</div>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="font-semibold text-[#F7F8F8] text-xl">
								{team.name}
							</h1>
							<span
								className="rounded px-2 py-0.5 font-medium text-xs"
								style={{
									backgroundColor: `${team.color}20`,
									color: team.color,
								}}
							>
								{team.key}
							</span>
						</div>
						<p className="text-[#8A8F98] text-sm">
							{activeIssues.length} active issues · {completedIssues.length}{" "}
							completed · {team.projects.length} projects · {team.cycles.length}{" "}
							cycles
						</p>
					</div>
				</div>

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
						<DropdownMenuItem asChild>
							<Link
								className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
								href={`/app/teams/${teamId}/settings`}
							>
								<Settings className="mr-2 h-4 w-4" />
								Settings
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Tabs */}
			<Tabs
				className="flex flex-1 flex-col"
				onValueChange={setActiveTab}
				value={activeTab}
			>
				<div className="border-[#2A2F35] border-b px-6">
					<TabsList className="h-12 bg-transparent">
						<TabsTrigger
							className="border-transparent border-b-2 text-[#8A8F98] data-[state=active]:border-[#5E6AD2] data-[state=active]:bg-transparent data-[state=active]:text-[#F7F8F8] data-[state=active]:shadow-none"
							value="overview"
						>
							Overview
						</TabsTrigger>
						<TabsTrigger
							className="border-transparent border-b-2 text-[#8A8F98] data-[state=active]:border-[#5E6AD2] data-[state=active]:bg-transparent data-[state=active]:text-[#F7F8F8] data-[state=active]:shadow-none"
							value="issues"
						>
							Issues
						</TabsTrigger>
						<TabsTrigger
							className="border-transparent border-b-2 text-[#8A8F98] data-[state=active]:border-[#5E6AD2] data-[state=active]:bg-transparent data-[state=active]:text-[#F7F8F8] data-[state=active]:shadow-none"
							value="cycles"
						>
							Cycles
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent className="flex-1 overflow-auto p-6" value="overview">
					<div className="grid gap-6 md:grid-cols-2">
						{/* Active Issues */}
						<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-4">
							<div className="mb-4 flex items-center justify-between">
								<h3 className="font-medium text-[#F7F8F8]">Active Issues</h3>
								<Link
									className="text-[#5E6AD2] text-sm hover:underline"
									href={`/app/teams/${teamId}?tab=issues`}
									onClick={() => setActiveTab("issues")}
								>
									View all
								</Link>
							</div>
							{activeIssues.length > 0 ? (
								<div className="space-y-2">
									{activeIssues.slice(0, 5).map((issue) => (
										<Link
											className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-[#2A2F35]"
											href={`/app/issues/${issue.id}`}
											key={issue.id}
										>
											<div className="flex h-6 w-6 items-center justify-center rounded bg-[#0F1115] font-medium text-[#8A8F98] text-[10px]">
												{issue.identifier}
											</div>
											<span className="flex-1 truncate text-[#F7F8F8] text-sm">
												{issue.title}
											</span>
											<Badge
												className="text-xs"
												variant={
													issue.status === "IN_PROGRESS"
														? "default"
														: "secondary"
												}
											>
												{issue.status.replace("_", " ")}
											</Badge>
										</Link>
									))}
								</div>
							) : (
								<p className="py-4 text-center text-[#8A8F98] text-sm">
									No active issues
								</p>
							)}
						</div>

						{/* Projects */}
						<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-4">
							<div className="mb-4 flex items-center justify-between">
								<h3 className="font-medium text-[#F7F8F8]">Projects</h3>
								<Link
									className="text-[#5E6AD2] text-sm hover:underline"
									href="/app/projects"
								>
									View all
								</Link>
							</div>
							{team.projects.length > 0 ? (
								<div className="space-y-2">
									{team.projects.map((project) => (
										<Link
											className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-[#2A2F35]"
											href={`/app/projects/${project.id}`}
											key={project.id}
										>
											<FolderKanban
												className="h-4 w-4"
												style={{ color: project.color }}
											/>
											<span className="flex-1 truncate text-[#F7F8F8] text-sm">
												{project.name}
											</span>
										</Link>
									))}
								</div>
							) : (
								<p className="py-4 text-center text-[#8A8F98] text-sm">
									No projects
								</p>
							)}
						</div>

						{/* Cycles */}
						<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-4">
							<div className="mb-4 flex items-center justify-between">
								<h3 className="font-medium text-[#F7F8F8]">Recent Cycles</h3>
								<Link
									className="text-[#5E6AD2] text-sm hover:underline"
									href="/app/cycles"
								>
									View all
								</Link>
							</div>
							{team.cycles.length > 0 ? (
								<div className="space-y-2">
									{team.cycles.map((cycle) => (
										<Link
											className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-[#2A2F35]"
											href={`/app/cycles/${cycle.id}`}
											key={cycle.id}
										>
											<RotateCcw className="h-4 w-4 text-[#5E6AD2]" />
											<span className="flex-1 truncate text-[#F7F8F8] text-sm">
												{cycle.name}
											</span>
											<span className="text-[#8A8F98] text-xs">
												{format(new Date(cycle.startDate), "MMM d")} -{" "}
												{format(new Date(cycle.endDate), "MMM d")}
											</span>
										</Link>
									))}
								</div>
							) : (
								<p className="py-4 text-center text-[#8A8F98] text-sm">
									No cycles
								</p>
							)}
						</div>
					</div>
				</TabsContent>

				<TabsContent className="flex-1 overflow-auto p-6" value="issues">
					{team.issues.length > 0 ? (
						<div className="space-y-2">
							{team.issues.map((issue) => (
								<Link
									className="flex items-center gap-3 rounded-lg border border-[#2A2F35] bg-[#16181D] p-4 transition-colors hover:border-[#5E6AD2]"
									href={`/app/issues/${issue.id}`}
									key={issue.id}
								>
									<div className="flex h-6 w-6 items-center justify-center rounded bg-[#0F1115] font-medium text-[#8A8F98] text-[10px]">
										{issue.identifier}
									</div>
									<span className="flex-1 truncate text-[#F7F8F8]">
										{issue.title}
									</span>
									<Badge
										variant={issue.status === "DONE" ? "default" : "secondary"}
									>
										{issue.status.replace("_", " ")}
									</Badge>
								</Link>
							))}
						</div>
					) : (
						<div className="flex h-64 flex-col items-center justify-center">
							<ListTodo className="mb-4 h-12 w-12 text-[#8A8F98]" />
							<h3 className="mb-2 font-medium text-[#F7F8F8]">No issues yet</h3>
							<p className="text-[#8A8F98]">
								Create issues to track work for this team
							</p>
						</div>
					)}
				</TabsContent>

				<TabsContent className="flex-1 overflow-auto p-6" value="cycles">
					{team.cycles.length > 0 ? (
						<div className="space-y-2">
							{team.cycles.map((cycle) => (
								<Link
									className="flex items-center gap-3 rounded-lg border border-[#2A2F35] bg-[#16181D] p-4 transition-colors hover:border-[#5E6AD2]"
									href={`/app/cycles/${cycle.id}`}
									key={cycle.id}
								>
									<RotateCcw className="h-5 w-5 text-[#5E6AD2]" />
									<div className="flex-1">
										<h3 className="font-medium text-[#F7F8F8]">{cycle.name}</h3>
										<p className="text-[#8A8F98] text-sm">
											{format(new Date(cycle.startDate), "MMM d, yyyy")} -{" "}
											{format(new Date(cycle.endDate), "MMM d, yyyy")}
										</p>
									</div>
									<Badge variant="outline">{cycle.status}</Badge>
								</Link>
							))}
						</div>
					) : (
						<div className="flex h-64 flex-col items-center justify-center">
							<RotateCcw className="mb-4 h-12 w-12 text-[#8A8F98]" />
							<h3 className="mb-2 font-medium text-[#F7F8F8]">No cycles yet</h3>
							<p className="text-[#8A8F98]">
								Create cycles to organize work into sprints
							</p>
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
