"use client";

import { MoreHorizontal, Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label as LabelComponent } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { cn } from "@/lib/utils";
import { DEFAULT_LABEL_COLOR_INDEX, LABEL_COLOR_OPTIONS } from "~/constants";
import { api } from "~/trpc/react";

// Extract hex colors from LABEL_COLOR_OPTIONS
const COLOR_OPTIONS = LABEL_COLOR_OPTIONS.map((option) => option.hex);

interface CreateLabelModalProps {
	isOpen: boolean;
	onClose: () => void;
	workspaceId: string;
}

function CreateLabelModal({
	isOpen,
	onClose,
	workspaceId,
}: CreateLabelModalProps) {
	const [name, setName] = useState("");
	const [selectedColor, setSelectedColor] = useState<string>(
		COLOR_OPTIONS[DEFAULT_LABEL_COLOR_INDEX] ??
			LABEL_COLOR_OPTIONS[DEFAULT_LABEL_COLOR_INDEX]?.hex ??
			"#6366F1",
	); // Default to Indigo
	const utils = api.useUtils();

	const createMutation = api.label.create.useMutation({
		onSuccess: () => {
			void utils.label.list.invalidate({ workspaceId });
			setName("");
			onClose();
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		createMutation.mutate({
			name: name.trim(),
			color: selectedColor,
			workspaceId,
		});
	};

	return (
		<Dialog onOpenChange={onClose} open={isOpen}>
			<DialogContent className="border-[#2A2F35] bg-[#0F1115] sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-[#F7F8F8]">Create Label</DialogTitle>
					<DialogDescription className="text-[#8A8F98]">
						Create a new label to organize your issues.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<LabelComponent className="text-[#8A8F98]" htmlFor="name">
								Name
							</LabelComponent>
							<Input
								autoFocus
								className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8] placeholder:text-[#8A8F98]"
								id="name"
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g., Bug, Feature, Documentation"
								value={name}
							/>
						</div>

						<div className="space-y-2">
							<LabelComponent className="text-[#8A8F98]">Color</LabelComponent>
							<div className="grid grid-cols-9 gap-2">
								{COLOR_OPTIONS.map((color) => (
									<button
										className={cn(
											"h-6 w-6 rounded-md transition-all hover:scale-110",
											selectedColor === color &&
												"ring-2 ring-[#F7F8F8] ring-offset-2 ring-offset-[#0F1115]",
										)}
										key={color}
										onClick={() => setSelectedColor(color)}
										style={{ backgroundColor: color }}
										type="button"
									/>
								))}
							</div>
						</div>

						<div className="space-y-2">
							<LabelComponent className="text-[#8A8F98]">
								Preview
							</LabelComponent>
							<div className="flex items-center gap-2 rounded-md border border-[#2A2F35] bg-[#1A1D21] p-3">
								<div
									className="flex items-center gap-2 rounded-full px-2.5 py-1 font-medium text-xs"
									style={{
										backgroundColor: `${selectedColor}20`,
										color: selectedColor,
										border: `1px solid ${selectedColor}40`,
									}}
								>
									<Tag className="h-3 w-3" />
									<span>{name.trim() || "Label Preview"}</span>
								</div>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
							onClick={onClose}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							className="bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
							disabled={!name.trim() || createMutation.isPending}
							type="submit"
						>
							{createMutation.isPending ? "Creating..." : "Create Label"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

interface EditLabelModalProps {
	isOpen: boolean;
	onClose: () => void;
	label: {
		id: string;
		name: string;
		color: string;
	};
	workspaceId: string;
}

function EditLabelModal({
	isOpen,
	onClose,
	label,
	workspaceId,
}: EditLabelModalProps) {
	const [name, setName] = useState(label.name);
	const [selectedColor, setSelectedColor] = useState(label.color);
	const utils = api.useUtils();

	const updateMutation = api.label.update.useMutation({
		onSuccess: () => {
			void utils.label.list.invalidate({ workspaceId });
			onClose();
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		updateMutation.mutate({
			id: label.id,
			name: name.trim(),
			color: selectedColor,
		});
	};

	return (
		<Dialog onOpenChange={onClose} open={isOpen}>
			<DialogContent className="border-[#2A2F35] bg-[#0F1115] sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-[#F7F8F8]">Edit Label</DialogTitle>
					<DialogDescription className="text-[#8A8F98]">
						Update the label name and color.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<LabelComponent className="text-[#8A8F98]" htmlFor="edit-name">
								Name
							</LabelComponent>
							<Input
								className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8] placeholder:text-[#8A8F98]"
								id="edit-name"
								onChange={(e) => setName(e.target.value)}
								placeholder="Label name"
								value={name}
							/>
						</div>

						<div className="space-y-2">
							<LabelComponent className="text-[#8A8F98]">Color</LabelComponent>
							<div className="grid grid-cols-9 gap-2">
								{COLOR_OPTIONS.map((color) => (
									<button
										className={cn(
											"h-6 w-6 rounded-md transition-all hover:scale-110",
											selectedColor === color &&
												"ring-2 ring-[#F7F8F8] ring-offset-2 ring-offset-[#0F1115]",
										)}
										key={color}
										onClick={() => setSelectedColor(color)}
										style={{ backgroundColor: color }}
										type="button"
									/>
								))}
							</div>
						</div>

						<div className="space-y-2">
							<LabelComponent className="text-[#8A8F98]">
								Preview
							</LabelComponent>
							<div className="flex items-center gap-2 rounded-md border border-[#2A2F35] bg-[#1A1D21] p-3">
								<div
									className="flex items-center gap-2 rounded-full px-2.5 py-1 font-medium text-xs"
									style={{
										backgroundColor: `${selectedColor}20`,
										color: selectedColor,
										border: `1px solid ${selectedColor}40`,
									}}
								>
									<Tag className="h-3 w-3" />
									<span>{name.trim() || "Label"}</span>
								</div>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
							onClick={onClose}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							className="bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
							disabled={!name.trim() || updateMutation.isPending}
							type="submit"
						>
							{updateMutation.isPending ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

interface DeleteLabelDialogProps {
	isOpen: boolean;
	onClose: () => void;
	label: {
		id: string;
		name: string;
	};
	workspaceId: string;
}

function DeleteLabelDialog({
	isOpen,
	onClose,
	label,
	workspaceId,
}: DeleteLabelDialogProps) {
	const utils = api.useUtils();

	const deleteMutation = api.label.delete.useMutation({
		onSuccess: () => {
			void utils.label.list.invalidate({ workspaceId });
			onClose();
		},
	});

	const handleDelete = () => {
		deleteMutation.mutate({ id: label.id });
	};

	return (
		<Dialog onOpenChange={onClose} open={isOpen}>
			<DialogContent className="border-[#2A2F35] bg-[#0F1115] sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-[#F7F8F8]">Delete Label</DialogTitle>
					<DialogDescription className="text-[#8A8F98]">
						Are you sure you want to delete the label &quot;{label.name}&quot;?
						This will remove it from all issues.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="mt-4">
					<Button
						className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
						onClick={onClose}
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						className="bg-red-600 text-white hover:bg-red-700"
						disabled={deleteMutation.isPending}
						onClick={handleDelete}
					>
						{deleteMutation.isPending ? "Deleting..." : "Delete Label"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function LabelsPage() {
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [editingLabel, setEditingLabel] = useState<{
		id: string;
		name: string;
		color: string;
	} | null>(null);
	const [deletingLabel, setDeletingLabel] = useState<{
		id: string;
		name: string;
	} | null>(null);

	const { workspaceId } = useCurrentWorkspace();
	const { data: labels, isLoading } = api.label.list.useQuery({
		workspaceId,
	});

	return (
		<TooltipProvider>
			<div className="flex h-full flex-col">
				{/* Header */}
				<div className="flex items-center justify-between border-[#2A2F35] border-b bg-[#0F1115] px-6 py-4">
					<div>
						<h1 className="font-semibold text-[#F7F8F8] text-xl">Labels</h1>
						<p className="text-[#8A8F98] text-sm">
							Manage labels to categorize and organize issues
						</p>
					</div>
					<Button
						className="gap-2 bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
						onClick={() => setIsCreateModalOpen(true)}
					>
						<Plus className="h-4 w-4" />
						New Label
					</Button>
				</div>

				{/* Content */}
				<ScrollArea className="flex-1 p-6">
					<Card className="border-[#2A2F35] bg-[#0F1115]">
						<CardHeader>
							<CardTitle className="text-[#F7F8F8]">All Labels</CardTitle>
							<CardDescription className="text-[#8A8F98]">
								{labels?.length ?? 0} label
								{labels?.length !== 1 ? "s" : ""} in your workspace
							</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<div className="space-y-2">
									{Array.from({ length: 5 }).map((_, index) => (
										<div
											className="h-12 animate-pulse rounded-md bg-[#1A1D21]"
											// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton items
											key={`skeleton-${index}`}
										/>
									))}
								</div>
							) : labels?.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2A2F35]">
										<Tag className="h-6 w-6 text-[#8A8F98]" />
									</div>
									<h3 className="mb-1 font-medium text-[#F7F8F8]">
										No labels yet
									</h3>
									<p className="max-w-sm text-[#8A8F98] text-sm">
										Create labels to categorize and organize your issues. Labels
										help you filter and find issues quickly.
									</p>
									<Button
										className="mt-4 bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
										onClick={() => setIsCreateModalOpen(true)}
									>
										<Plus className="mr-2 h-4 w-4" />
										Create your first label
									</Button>
								</div>
							) : (
								<div className="divide-y divide-[#2A2F35]">
									{labels?.map((label) => (
										<div
											className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
											key={label.id}
										>
											<div className="flex items-center gap-3">
												<div
													className="flex items-center gap-2 rounded-full px-2.5 py-1 font-medium text-xs"
													style={{
														backgroundColor: `${label.color}20`,
														color: label.color,
														border: `1px solid ${label.color}40`,
													}}
												>
													<Tag className="h-3 w-3" />
													<span>{label.name}</span>
												</div>
												{label.teamId && "team" in label && label.team ? (
													<span className="text-[#8A8F98] text-xs">
														Team: {(label.team as { name: string }).name}
													</span>
												) : (
													<Tooltip>
														<TooltipTrigger asChild>
															<span className="text-[#8A8F98] text-xs">
																Workspace
															</span>
														</TooltipTrigger>
														<TooltipContent>
															<p>Available to all teams</p>
														</TooltipContent>
													</Tooltip>
												)}
											</div>

											<div className="flex items-center gap-4">
												<span className="text-[#8A8F98] text-sm">
													{label.issueCount} issue
													{label.issueCount !== 1 ? "s" : ""}
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
														className="border-[#2A2F35] bg-[#1A1D21]"
													>
														<DropdownMenuItem
															className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
															onClick={() =>
																setEditingLabel({
																	id: label.id,
																	name: label.name,
																	color: label.color,
																})
															}
														>
															Edit
														</DropdownMenuItem>
														<DropdownMenuItem
															className="text-red-400 hover:bg-[#2A2F35] hover:text-red-300 focus:bg-[#2A2F35] focus:text-red-300"
															onClick={() =>
																setDeletingLabel({
																	id: label.id,
																	name: label.name,
																})
															}
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</ScrollArea>

				{/* Modals */}
				<CreateLabelModal
					isOpen={isCreateModalOpen}
					onClose={() => setIsCreateModalOpen(false)}
					workspaceId={workspaceId}
				/>

				{editingLabel && (
					<EditLabelModal
						isOpen={!!editingLabel}
						label={editingLabel}
						onClose={() => setEditingLabel(null)}
						workspaceId={workspaceId}
					/>
				)}

				{deletingLabel && (
					<DeleteLabelDialog
						isOpen={!!deletingLabel}
						label={deletingLabel}
						onClose={() => setDeletingLabel(null)}
						workspaceId={workspaceId}
					/>
				)}
			</div>
		</TooltipProvider>
	);
}
