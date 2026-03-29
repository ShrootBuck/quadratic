"use client";

import { Check, Plus, Tag, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label as LabelComponent } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { api } from "~/trpc/react";

interface Label {
	id: string;
	name: string;
	color: string;
}

interface LabelSelectorProps {
	workspaceId: string;
	selectedLabels: Label[];
	onLabelsChange: (labels: Label[]) => void;
	className?: string;
}

// Predefined color palette (same as labels page)
const COLOR_OPTIONS = [
	"#EF4444", // Red
	"#F97316", // Orange
	"#F59E0B", // Amber
	"#84CC16", // Lime
	"#22C55E", // Green
	"#10B981", // Emerald
	"#14B8A6", // Teal
	"#06B6D4", // Cyan
	"#0EA5E9", // Sky
	"#3B82F6", // Blue
	"#6366F1", // Indigo
	"#8B5CF6", // Violet
	"#A855F7", // Purple
	"#D946EF", // Fuchsia
	"#EC4899", // Pink
	"#F43F5E", // Rose
	"#6B7280", // Gray
	"#1F2937", // Dark Gray
];

function CreateLabelModal({
	isOpen,
	onClose,
	workspaceId,
	onLabelCreated,
}: {
	isOpen: boolean;
	onClose: () => void;
	workspaceId: string;
	onLabelCreated: (label: Label) => void;
}) {
	const [name, setName] = useState("");
	const [selectedColor, setSelectedColor] = useState<string>(
		COLOR_OPTIONS[10] ?? "#6366F1",
	);

	const createMutation = api.label.create.useMutation({
		onSuccess: (data) => {
			onLabelCreated(data);
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
							<input
								autoFocus
								className="w-full rounded-md border border-[#2A2F35] bg-[#1A1D21] px-3 py-2 text-[#F7F8F8] text-sm placeholder:text-[#8A8F98] focus:border-[#5E6AD2] focus:outline-none"
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

export function LabelSelector({
	workspaceId,
	selectedLabels,
	onLabelsChange,
	className,
}: LabelSelectorProps) {
	const [open, setOpen] = useState(false);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	const { data: labels, isLoading } = api.label.list.useQuery({
		workspaceId,
	});

	const utils = api.useUtils();

	const toggleLabel = (label: Label) => {
		const isSelected = selectedLabels.some((l) => l.id === label.id);
		if (isSelected) {
			onLabelsChange(selectedLabels.filter((l) => l.id !== label.id));
		} else {
			onLabelsChange([...selectedLabels, label]);
		}
	};

	const removeLabel = (labelId: string) => {
		onLabelsChange(selectedLabels.filter((l) => l.id !== labelId));
	};

	const handleLabelCreated = (label: Label) => {
		onLabelsChange([...selectedLabels, label]);
		void utils.label.list.invalidate({ workspaceId });
	};

	return (
		<div className={className}>
			<Popover onOpenChange={setOpen} open={open}>
				<PopoverTrigger asChild>
					<Button
						className="h-8 justify-start border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8] hover:bg-[#2A2F35]"
						size="sm"
						variant="outline"
					>
						<Tag className="mr-2 h-4 w-4 text-[#8A8F98]" />
						{selectedLabels.length === 0 ? (
							<span className="text-[#8A8F98]">Add labels...</span>
						) : (
							<div className="flex items-center gap-1">
								{selectedLabels.slice(0, 3).map((label) => (
									<span
										className="rounded px-1.5 py-0.5 font-medium text-xs"
										key={label.id}
										style={{
											backgroundColor: `${label.color}20`,
											color: label.color,
										}}
									>
										{label.name}
									</span>
								))}
								{selectedLabels.length > 3 && (
									<span className="text-[#8A8F98] text-xs">
										+{selectedLabels.length - 3}
									</span>
								)}
							</div>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="w-64 border-[#2A2F35] bg-[#1A1D21] p-0"
				>
					<Command className="bg-transparent">
						<CommandInput
							className="border-none bg-transparent text-[#F7F8F8] placeholder:text-[#8A8F98]"
							placeholder="Search labels..."
						/>
						<CommandList className="max-h-64">
							<CommandEmpty className="py-2 text-center text-[#8A8F98] text-sm">
								No labels found.
							</CommandEmpty>
							<CommandGroup>
								{isLoading ? (
									<div className="space-y-1 p-2">
										{Array.from({ length: 5 }).map((_, index) => (
											<div
												className="h-8 animate-pulse rounded bg-[#2A2F35]"
												// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton items
												key={`skeleton-${index}`}
											/>
										))}
									</div>
								) : (
									labels?.map((label) => {
										const isSelected = selectedLabels.some(
											(l) => l.id === label.id,
										);
										return (
											<CommandItem
												className="flex cursor-pointer items-center justify-between text-[#F7F8F8] hover:bg-[#2A2F35] aria-selected:bg-[#2A2F35]"
												key={label.id}
												onSelect={() => toggleLabel(label)}
											>
												<div className="flex items-center gap-2">
													<div
														className="h-3 w-3 rounded-full"
														style={{ backgroundColor: label.color }}
													/>
													<span>{label.name}</span>
												</div>
												{isSelected && (
													<Check className="h-4 w-4 text-[#5E6AD2]" />
												)}
											</CommandItem>
										);
									})
								)}
							</CommandGroup>
							<CommandGroup className="border-[#2A2F35] border-t">
								<CommandItem
									className="cursor-pointer text-[#5E6AD2] hover:bg-[#2A2F35] aria-selected:bg-[#2A2F35]"
									onSelect={() => {
										setOpen(false);
										setIsCreateModalOpen(true);
									}}
								>
									<Plus className="mr-2 h-4 w-4" />
									Create new label
								</CommandItem>
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{/* Selected labels display */}
			{selectedLabels.length > 0 && (
				<div className="mt-2 flex flex-wrap gap-2">
					{selectedLabels.map((label) => (
						<button
							className="group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-xs transition-all hover:opacity-80"
							key={label.id}
							onClick={() => removeLabel(label.id)}
							style={{
								backgroundColor: `${label.color}20`,
								color: label.color,
								border: `1px solid ${label.color}40`,
							}}
							type="button"
						>
							<Tag className="h-3 w-3" />
							<span>{label.name}</span>
							<X className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100" />
						</button>
					))}
				</div>
			)}

			<CreateLabelModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				onLabelCreated={handleLabelCreated}
				workspaceId={workspaceId}
			/>
		</div>
	);
}

export function LabelBadge({
	label,
	onRemove,
	className,
}: {
	label: Label;
	onRemove?: () => void;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium text-xs",
				className,
			)}
			style={{
				backgroundColor: `${label.color}20`,
				color: label.color,
				border: `1px solid ${label.color}40`,
			}}
		>
			<Tag className="h-3 w-3" />
			<span>{label.name}</span>
			{onRemove && (
				<button
					className="ml-0.5 opacity-60 transition-opacity hover:opacity-100"
					onClick={onRemove}
					type="button"
				>
					<X className="h-3 w-3" />
				</button>
			)}
		</span>
	);
}
