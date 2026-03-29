"use client";

import {
	AlertTriangle,
	CheckCircle2,
	MoreHorizontal,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { cn } from "@/lib/utils";
import { api } from "~/trpc/react";

interface CreateTeamForm {
	name: string;
	key: string;
	color: string;
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

export default function TeamsPage() {
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
	const [formData, setFormData] = useState<CreateTeamForm>({
		name: "",
		key: "",
		color: "#5E6AD2",
	});

	const { workspaceId } = useCurrentWorkspace();

	const { data: teams, isLoading } = api.team.list.useQuery(
		{
			workspaceId: workspaceId ?? "",
		},
		{
			enabled: !!workspaceId,
		},
	);

	const utils = api.useUtils();

	const createTeam = api.team.create.useMutation({
		onSuccess: () => {
			if (workspaceId) {
				utils.team.list.invalidate({ workspaceId });
			}
			setCreateModalOpen(false);
			setFormData({
				name: "",
				key: "",
				color: "#5E6AD2",
			});
		},
	});

	const deleteTeam = api.team.delete.useMutation({
		onSuccess: () => {
			if (workspaceId) {
				utils.team.list.invalidate({ workspaceId });
			}
			setDeleteDialogOpen(false);
			setTeamToDelete(null);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name || !formData.key || !workspaceId) return;

		createTeam.mutate({
			name: formData.name,
			key: formData.key.toUpperCase(),
			color: formData.color,
			workspaceId,
		});
	};

	const handleDelete = () => {
		if (teamToDelete) {
			deleteTeam.mutate({ id: teamToDelete });
		}
	};

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-[#2A2F35] border-b px-6 py-4">
				<div>
					<h1 className="font-semibold text-[#F7F8F8] text-xl">Teams</h1>
					<p className="text-[#8A8F98] text-sm">{teams?.length ?? 0} teams</p>
				</div>
				<Dialog onOpenChange={setCreateModalOpen} open={createModalOpen}>
					<DialogTrigger asChild>
						<Button className="bg-[#5E6AD2] text-white hover:bg-[#4F57B3]">
							<Plus className="mr-2 h-4 w-4" />
							New Team
						</Button>
					</DialogTrigger>
					<DialogContent className="border-[#2A2F35] bg-[#16181D] sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle className="text-[#F7F8F8]">
								Create New Team
							</DialogTitle>
							<DialogDescription className="text-[#8A8F98]">
								Create a team to organize issues and projects.
							</DialogDescription>
						</DialogHeader>
						<form className="space-y-4 pt-4" onSubmit={handleSubmit}>
							<div className="space-y-2">
								<Label className="text-[#F7F8F8]" htmlFor="name">
									Team Name
								</Label>
								<Input
									className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] placeholder:text-[#8A8F98]"
									id="name"
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder="e.g., Engineering"
									required
									value={formData.name}
								/>
							</div>

							<div className="space-y-2">
								<Label className="text-[#F7F8F8]" htmlFor="key">
									Team Key
								</Label>
								<Input
									className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] placeholder:text-[#8A8F98]"
									id="key"
									maxLength={10}
									onChange={(e) =>
										setFormData({
											...formData,
											key: e.target.value.toUpperCase(),
										})
									}
									placeholder="e.g., ENG"
									required
									value={formData.key}
								/>
								<p className="text-[#8A8F98] text-xs">
									Used in issue identifiers (e.g., ENG-123)
								</p>
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

							<Button
								className="w-full bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
								disabled={
									createTeam.isPending ||
									!formData.name ||
									!formData.key ||
									!workspaceId
								}
								type="submit"
							>
								{createTeam.isPending ? "Creating..." : "Create Team"}
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
								className="h-24 animate-pulse rounded-lg bg-[#2A2F35]"
								key={key}
							/>
						))}
					</div>
				) : (
					<div className="space-y-4">
						{teams?.map((team) => (
							<TeamCard
								key={team.id}
								onDelete={() => {
									setTeamToDelete(team.id);
									setDeleteDialogOpen(true);
								}}
								team={team}
							/>
						))}

						{teams?.length === 0 && (
							<div className="py-12 text-center">
								<Users className="mx-auto mb-4 h-12 w-12 text-[#8A8F98]" />
								<h3 className="mb-2 font-medium text-[#F7F8F8]">
									No teams yet
								</h3>
								<p className="text-[#8A8F98]">
									Create your first team to organize issues
								</p>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
				<AlertDialogContent className="border-[#2A2F35] bg-[#16181D]">
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2 text-[#F7F8F8]">
							<AlertTriangle className="h-5 w-5 text-[#F87171]" />
							Delete Team
						</AlertDialogTitle>
						<AlertDialogDescription className="text-[#8A8F98]">
							Are you sure you want to delete this team? This action cannot be
							undone. All issues must be moved or deleted first.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] hover:bg-[#2A2F35]">
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							className="bg-[#F87171] text-white hover:bg-[#DC2626]"
							onClick={handleDelete}
						>
							{deleteTeam.isPending ? "Deleting..." : "Delete Team"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function TeamCard({
	team,
	onDelete,
}: {
	team: {
		id: string;
		name: string;
		key: string;
		color: string;
		workspace: { name: string };
		_count: {
			issues: number;
			projects: number;
		};
	};
	onDelete: () => void;
}) {
	return (
		<div className="flex items-center gap-4 rounded-lg border border-[#2A2F35] bg-[#16181D] p-4 transition-colors hover:border-[#5E6AD2]">
			<Link
				className="flex flex-1 items-center gap-4"
				href={`/app/teams/${team.id}`}
			>
				<div
					className="flex h-12 w-12 items-center justify-center rounded-lg"
					style={{ backgroundColor: `${team.color}20` }}
				>
					<Users className="h-6 w-6" style={{ color: team.color }} />
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-3">
						<h3 className="truncate font-medium text-[#F7F8F8]">{team.name}</h3>
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

					<p className="mt-1 text-[#8A8F98] text-sm">
						{team._count.issues} issues · {team._count.projects} projects
					</p>
				</div>
			</Link>

			{/* Actions */}
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
							href={`/app/teams/${team.id}/settings`}
						>
							Settings
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem
						className="text-[#F87171] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
						onClick={onDelete}
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Delete Team
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
