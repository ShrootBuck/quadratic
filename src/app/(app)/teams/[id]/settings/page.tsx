"use client";

import {
	AlertTriangle,
	CheckCircle2,
	Mail,
	MoreHorizontal,
	Plus,
	Trash2,
	UserCog,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { api } from "~/trpc/react";

interface UpdateTeamForm {
	name: string;
	key: string;
	color: string;
}

interface InviteMemberForm {
	email: string;
	role: "ADMIN" | "MEMBER";
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

export default function TeamSettingsPage() {
	const params = useParams();
	const teamId = params.id as string;
	const [activeTab, setActiveTab] = useState("general");
	const [inviteModalOpen, setInviteModalOpen] = useState(false);
	const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
	const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

	const { data: team, isLoading: teamLoading } = api.team.getById.useQuery({
		id: teamId,
	});
	const { data: members, isLoading: membersLoading } =
		api.team.getMembers.useQuery({
			id: teamId,
		});

	if (teamLoading) {
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

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center gap-4 border-[#2A2F35] border-b px-6 py-4">
				<Link
					className="text-[#8A8F98] hover:text-[#F7F8F8]"
					href={`/app/teams/${teamId}`}
				>
					← Back to Team
				</Link>
				<span className="text-[#2A2F35]">|</span>
				<div className="flex items-center gap-2">
					<div
						className="h-3 w-3 rounded-full"
						style={{ backgroundColor: team.color }}
					/>
					<span className="font-medium text-[#F7F8F8]">{team.name}</span>
				</div>
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
							value="general"
						>
							General
						</TabsTrigger>
						<TabsTrigger
							className="border-transparent border-b-2 text-[#8A8F98] data-[state=active]:border-[#5E6AD2] data-[state=active]:bg-transparent data-[state=active]:text-[#F7F8F8] data-[state=active]:shadow-none"
							value="members"
						>
							Members
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent className="flex-1 overflow-auto p-6" value="general">
					<GeneralSettings team={team} />
				</TabsContent>

				<TabsContent className="flex-1 overflow-auto p-6" value="members">
					<MembersSettings
						inviteModalOpen={inviteModalOpen}
						members={members}
						membersLoading={membersLoading}
						onMemberRemove={(userId) => {
							setMemberToRemove(userId);
							setRemoveDialogOpen(true);
						}}
						setInviteModalOpen={setInviteModalOpen}
						teamId={teamId}
					/>
				</TabsContent>
			</Tabs>

			{/* Remove Member Dialog */}
			<RemoveMemberDialog
				memberToRemove={memberToRemove}
				onClose={() => {
					setRemoveDialogOpen(false);
					setMemberToRemove(null);
				}}
				open={removeDialogOpen}
				teamId={teamId}
			/>
		</div>
	);
}

function GeneralSettings({
	team,
}: {
	team: {
		id: string;
		name: string;
		key: string;
		color: string;
	};
}) {
	const [formData, setFormData] = useState<UpdateTeamForm>({
		name: team.name,
		key: team.key,
		color: team.color,
	});

	const utils = api.useUtils();

	const updateTeam = api.team.update.useMutation({
		onSuccess: () => {
			utils.team.getById.invalidate({ id: team.id });
			utils.team.list.invalidate();
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateTeam.mutate({
			id: team.id,
			name: formData.name,
			key: formData.key,
			color: formData.color,
		});
	};

	return (
		<div className="mx-auto max-w-2xl">
			<form className="space-y-6" onSubmit={handleSubmit}>
				<div className="space-y-2">
					<Label className="text-[#F7F8F8]" htmlFor="name">
						Team Name
					</Label>
					<Input
						className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]"
						id="name"
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						value={formData.name}
					/>
				</div>

				<div className="space-y-2">
					<Label className="text-[#F7F8F8]" htmlFor="key">
						Team Key
					</Label>
					<Input
						className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]"
						id="key"
						maxLength={10}
						onChange={(e) =>
							setFormData({
								...formData,
								key: e.target.value.toUpperCase(),
							})
						}
						value={formData.key}
					/>
					<p className="text-[#8A8F98] text-sm">
						Used in issue identifiers (e.g., {formData.key}-123)
					</p>
				</div>

				<div className="space-y-2">
					<Label className="text-[#F7F8F8]">Team Color</Label>
					<div className="flex flex-wrap gap-2">
						{colorOptions.map((color) => (
							<button
								className={cn(
									"flex h-8 w-8 items-center justify-center rounded-full transition-all",
									formData.color === color.value
										? "ring-2 ring-white ring-offset-2 ring-offset-[#0F1115]"
										: "hover:scale-110",
								)}
								key={color.value}
								onClick={() => setFormData({ ...formData, color: color.value })}
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
					className="bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
					disabled={
						updateTeam.isPending ||
						(formData.name === team.name &&
							formData.key === team.key &&
							formData.color === team.color)
					}
					type="submit"
				>
					{updateTeam.isPending ? "Saving..." : "Save Changes"}
				</Button>
			</form>
		</div>
	);
}

function MembersSettings({
	members,
	membersLoading,
	inviteModalOpen,
	setInviteModalOpen,
	onMemberRemove,
	teamId,
}: {
	members:
		| {
				user: {
					id: string;
					name: string;
					email: string;
					image: string | null;
				};
				role: "ADMIN" | "MEMBER";
				joinedAt: Date;
		  }[]
		| undefined;
	membersLoading: boolean;
	inviteModalOpen: boolean;
	setInviteModalOpen: (open: boolean) => void;
	onMemberRemove: (userId: string) => void;
	teamId: string;
}) {
	const [inviteForm, setInviteForm] = useState<InviteMemberForm>({
		email: "",
		role: "MEMBER",
	});

	const utils = api.useUtils();

	const inviteMember = api.team.inviteMember.useMutation({
		onSuccess: () => {
			utils.team.getMembers.invalidate({ id: teamId });
			setInviteModalOpen(false);
			setInviteForm({ email: "", role: "MEMBER" });
		},
	});

	const handleInvite = (e: React.FormEvent) => {
		e.preventDefault();
		inviteMember.mutate({
			teamId,
			email: inviteForm.email,
			role: inviteForm.role,
		});
	};

	return (
		<div className="mx-auto max-w-3xl">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h2 className="font-medium text-[#F7F8F8] text-lg">Team Members</h2>
					<p className="text-[#8A8F98] text-sm">
						Manage who has access to this workspace
					</p>
				</div>
				<Dialog onOpenChange={setInviteModalOpen} open={inviteModalOpen}>
					<DialogTrigger asChild>
						<Button className="bg-[#5E6AD2] text-white hover:bg-[#4F57B3]">
							<Plus className="mr-2 h-4 w-4" />
							Invite Member
						</Button>
					</DialogTrigger>
					<DialogContent className="border-[#2A2F35] bg-[#16181D]">
						<DialogHeader>
							<DialogTitle className="text-[#F7F8F8]">
								Invite Team Member
							</DialogTitle>
							<DialogDescription className="text-[#8A8F98]">
								Invite a user by email to join this workspace.
							</DialogDescription>
						</DialogHeader>
						<form className="space-y-4 pt-4" onSubmit={handleInvite}>
							<div className="space-y-2">
								<Label className="text-[#F7F8F8]" htmlFor="email">
									Email Address
								</Label>
								<Input
									className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]"
									id="email"
									onChange={(e) =>
										setInviteForm({
											...inviteForm,
											email: e.target.value,
										})
									}
									placeholder="colleague@example.com"
									required
									type="email"
									value={inviteForm.email}
								/>
							</div>

							<div className="space-y-2">
								<Label className="text-[#F7F8F8]">Role</Label>
								<Select
									onValueChange={(value: "ADMIN" | "MEMBER") =>
										setInviteForm({ ...inviteForm, role: value })
									}
									value={inviteForm.role}
								>
									<SelectTrigger className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]">
										<SelectValue placeholder="Select a role" />
									</SelectTrigger>
									<SelectContent className="border-[#2A2F35] bg-[#16181D]">
										<SelectItem className="text-[#F7F8F8]" value="MEMBER">
											<div className="flex flex-col">
												<span>Member</span>
												<span className="text-[#8A8F98] text-xs">
													Can create and edit issues
												</span>
											</div>
										</SelectItem>
										<SelectItem className="text-[#F7F8F8]" value="ADMIN">
											<div className="flex flex-col">
												<span>Admin</span>
												<span className="text-[#8A8F98] text-xs">
													Full access to workspace settings
												</span>
											</div>
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<Button
								className="w-full bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
								disabled={inviteMember.isPending}
								type="submit"
							>
								{inviteMember.isPending ? "Inviting..." : "Send Invitation"}
							</Button>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{membersLoading ? (
				<div className="space-y-2">
					{["skeleton-1", "skeleton-2", "skeleton-3"].map((key) => (
						<div
							className="h-16 animate-pulse rounded-lg bg-[#2A2F35]"
							key={key}
						/>
					))}
				</div>
			) : (
				<div className="space-y-2">
					{members?.map((member) => (
						<div
							className="flex items-center gap-4 rounded-lg border border-[#2A2F35] bg-[#16181D] p-4"
							key={member.user.id}
						>
							<Avatar className="h-10 w-10">
								<AvatarImage
									alt={member.user.name}
									src={member.user.image ?? undefined}
								/>
								<AvatarFallback className="bg-[#5E6AD2] text-white">
									{member.user.name
										.split(" ")
										.map((n) => n[0])
										.join("")}
								</AvatarFallback>
							</Avatar>

							<div className="flex-1">
								<p className="font-medium text-[#F7F8F8]">{member.user.name}</p>
								<p className="text-[#8A8F98] text-sm">{member.user.email}</p>
							</div>

							<div className="flex items-center gap-4">
								<span
									className={cn(
										"rounded-full px-2 py-1 font-medium text-xs",
										member.role === "ADMIN"
											? "bg-[#5E6AD2]/20 text-[#5E6AD2]"
											: "bg-[#8A8F98]/20 text-[#8A8F98]",
									)}
								>
									{member.role}
								</span>

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
										<DropdownMenuItem
											className="text-[#F87171] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
											onClick={() => onMemberRemove(member.user.id)}
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Remove from workspace
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function RemoveMemberDialog({
	open,
	onClose,
	memberToRemove,
	teamId,
}: {
	open: boolean;
	onClose: () => void;
	memberToRemove: string | null;
	teamId: string;
}) {
	const utils = api.useUtils();

	const removeMember = api.team.removeMember.useMutation({
		onSuccess: () => {
			utils.team.getMembers.invalidate({ id: teamId });
			onClose();
		},
	});

	const handleRemove = () => {
		if (memberToRemove) {
			removeMember.mutate({
				teamId,
				userId: memberToRemove,
			});
		}
	};

	return (
		<AlertDialog onOpenChange={onClose} open={open}>
			<AlertDialogContent className="border-[#2A2F35] bg-[#16181D]">
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-2 text-[#F7F8F8]">
						<AlertTriangle className="h-5 w-5 text-[#F87171]" />
						Remove Member
					</AlertDialogTitle>
					<AlertDialogDescription className="text-[#8A8F98]">
						Are you sure you want to remove this member from the workspace? This
						action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel
						className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] hover:bg-[#2A2F35]"
						onClick={onClose}
					>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						className="bg-[#F87171] text-white hover:bg-[#DC2626]"
						onClick={handleRemove}
					>
						{removeMember.isPending ? "Removing..." : "Remove Member"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
