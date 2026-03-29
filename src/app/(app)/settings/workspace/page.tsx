"use client";

import { AlertTriangle, Building2, CheckCircle2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "~/trpc/react";

export default function WorkspaceSettingsPage() {
	const router = useRouter();
	const { data: workspace, isLoading } = api.workspace.getCurrent.useQuery();
	const utils = api.useUtils();

	const [formData, setFormData] = useState({
		name: "",
		slug: "",
	});

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteConfirmText, setDeleteConfirmText] = useState("");

	// Initialize form when data loads
	if (workspace && formData.name === "" && !isLoading) {
		setFormData({
			name: workspace.name,
			slug: workspace.slug,
		});
	}

	const updateWorkspace = api.workspace.update.useMutation({
		onSuccess: () => {
			utils.workspace.getCurrent.invalidate();
		},
	});

	const deleteWorkspace = api.workspace.delete.useMutation({
		onSuccess: () => {
			router.push("/app");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!workspace) return;

		updateWorkspace.mutate({
			id: workspace.id,
			name: formData.name,
			slug: formData.slug,
		});
	};

	const handleDelete = () => {
		if (!workspace || deleteConfirmText !== workspace.name) return;

		deleteWorkspace.mutate({
			id: workspace.id,
		});
	};

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5E6AD2] border-t-transparent" />
			</div>
		);
	}

	if (!workspace) {
		return (
			<div className="flex h-full flex-col items-center justify-center">
				<Building2 className="mb-4 h-12 w-12 text-[#8A8F98]" />
				<h3 className="mb-2 font-medium text-[#F7F8F8]">Workspace not found</h3>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl p-8">
			<div className="mb-8">
				<h1 className="mb-2 font-semibold text-2xl text-[#F7F8F8]">
					Workspace Settings
				</h1>
				<p className="text-[#8A8F98]">Manage your workspace configuration</p>
			</div>

			<form className="space-y-8" onSubmit={handleSubmit}>
				{/* Name Section */}
				<div className="space-y-2">
					<Label className="text-[#F7F8F8]" htmlFor="name">
						Workspace Name
					</Label>
					<Input
						className="border-[#2A2F35] bg-[#16181D] text-[#F7F8F8]"
						id="name"
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						value={formData.name}
					/>
				</div>

				{/* Slug Section */}
				<div className="space-y-2">
					<Label className="text-[#F7F8F8]" htmlFor="slug">
						Workspace URL
					</Label>
					<div className="flex items-center gap-2">
						<span className="text-[#8A8F98]">quadratic.app/</span>
						<Input
							className="flex-1 border-[#2A2F35] bg-[#16181D] text-[#F7F8F8]"
							id="slug"
							onChange={(e) =>
								setFormData({
									...formData,
									slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
								})
							}
							value={formData.slug}
						/>
					</div>
					<p className="text-[#8A8F98] text-sm">
						This will be used in your workspace URL
					</p>
				</div>

				<div className="flex items-center gap-4 pt-4">
					<Button
						className="bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
						disabled={
							updateWorkspace.isPending ||
							(formData.name === workspace.name &&
								formData.slug === workspace.slug)
						}
						type="submit"
					>
						{updateWorkspace.isPending ? "Saving..." : "Save Changes"}
					</Button>
				</div>
			</form>

			{/* Danger Zone */}
			<div className="mt-12 border-[#F87171]/20 border-t pt-8">
				<h2 className="mb-4 flex items-center gap-2 font-semibold text-[#F87171] text-lg">
					<AlertTriangle className="h-5 w-5" />
					Danger Zone
				</h2>

				<div className="rounded-lg border border-[#F87171]/20 bg-[#F87171]/5 p-6">
					<div className="flex items-start justify-between">
						<div>
							<h3 className="font-medium text-[#F7F8F8]">Delete Workspace</h3>
							<p className="mt-1 max-w-md text-[#8A8F98] text-sm">
								Permanently delete this workspace and all of its data including
								issues, projects, and cycles. This action cannot be undone.
							</p>
						</div>
						<Button
							className="bg-[#F87171] text-white hover:bg-[#DC2626]"
							onClick={() => setDeleteDialogOpen(true)}
							variant="destructive"
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Delete Workspace
						</Button>
					</div>
				</div>
			</div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
				<AlertDialogContent className="border-[#F87171]/20 bg-[#16181D]">
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2 text-[#F87171]">
							<AlertTriangle className="h-5 w-5" />
							Delete Workspace
						</AlertDialogTitle>
						<AlertDialogDescription className="text-[#8A8F98]">
							This action cannot be undone. This will permanently delete the
							workspace{" "}
							<strong className="text-[#F7F8F8]">{workspace.name}</strong>
							and all associated data.
						</AlertDialogDescription>
					</AlertDialogHeader>

					<div className="my-4 space-y-2">
						<Label className="text-[#F7F8F8]">
							Type <strong>{workspace.name}</strong> to confirm
						</Label>
						<Input
							className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]"
							onChange={(e) => setDeleteConfirmText(e.target.value)}
							placeholder={workspace.name}
							value={deleteConfirmText}
						/>
					</div>

					<AlertDialogFooter>
						<AlertDialogCancel
							className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] hover:bg-[#2A2F35]"
							onClick={() => {
								setDeleteDialogOpen(false);
								setDeleteConfirmText("");
							}}
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							className="bg-[#F87171] text-white hover:bg-[#DC2626]"
							disabled={
								deleteWorkspace.isPending ||
								deleteConfirmText !== workspace.name
							}
							onClick={handleDelete}
						>
							{deleteWorkspace.isPending ? "Deleting..." : "Delete Workspace"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
