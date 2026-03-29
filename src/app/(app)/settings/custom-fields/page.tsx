"use client";

import {
	Calendar,
	ChevronDown,
	ChevronUp,
	GripVertical,
	Hash,
	Link,
	List,
	MoreHorizontal,
	Plus,
	Text,
	Trash2,
	Type,
} from "lucide-react";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api } from "~/trpc/react";

const FIELD_TYPES = [
	{ value: "TEXT", label: "Text", icon: Type },
	{ value: "NUMBER", label: "Number", icon: Hash },
	{ value: "SELECT", label: "Single Select", icon: List },
	{ value: "MULTI_SELECT", label: "Multi Select", icon: List },
	{ value: "DATE", label: "Date", icon: Calendar },
	{ value: "URL", label: "URL", icon: Link },
] as const;

type FieldType = (typeof FIELD_TYPES)[number]["value"];

interface CreateCustomFieldModalProps {
	isOpen: boolean;
	onClose: () => void;
	workspaceId: string;
}

function CreateCustomFieldModal({
	isOpen,
	onClose,
	workspaceId,
}: CreateCustomFieldModalProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [type, setType] = useState<FieldType>("TEXT");
	const [options, setOptions] = useState<string[]>([]);
	const [newOption, setNewOption] = useState("");
	const utils = api.useUtils();

	const createMutation = api.customField.create.useMutation({
		onSuccess: () => {
			void utils.customField.list.invalidate({ workspaceId });
			setName("");
			setDescription("");
			setType("TEXT");
			setOptions([]);
			onClose();
		},
	});

	const handleAddOption = () => {
		if (newOption.trim() && !options.includes(newOption.trim())) {
			setOptions([...options, newOption.trim()]);
			setNewOption("");
		}
	};

	const handleRemoveOption = (index: number) => {
		setOptions(options.filter((_, i) => i !== index));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		createMutation.mutate({
			name: name.trim(),
			type,
			description: description.trim() || undefined,
			options:
				type === "SELECT" || type === "MULTI_SELECT" ? options : undefined,
			workspaceId,
		});
	};

	const showOptions = type === "SELECT" || type === "MULTI_SELECT";

	return (
		<Dialog onOpenChange={onClose} open={isOpen}>
			<DialogContent className="border-[#2A2F35] bg-[#0F1115] sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-[#F7F8F8]">
						Create Custom Field
					</DialogTitle>
					<DialogDescription className="text-[#8A8F98]">
						Create a custom field to track additional information on issues.
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
								placeholder="e.g., Severity, Customer, Epic"
								value={name}
							/>
						</div>

						<div className="space-y-2">
							<LabelComponent className="text-[#8A8F98]" htmlFor="description">
								Description (optional)
							</LabelComponent>
							<Input
								className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8] placeholder:text-[#8A8F98]"
								id="description"
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Brief description of this field"
								value={description}
							/>
						</div>

						<div className="space-y-2">
							<LabelComponent className="text-[#8A8F98]">
								Field Type
							</LabelComponent>
							<Select
								onValueChange={(v) => setType(v as FieldType)}
								value={type}
							>
								<SelectTrigger className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="border-[#2A2F35] bg-[#1A1D21]">
									{FIELD_TYPES.map((fieldType) => {
										const Icon = fieldType.icon;
										return (
											<SelectItem
												className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
												key={fieldType.value}
												value={fieldType.value}
											>
												<div className="flex items-center gap-2">
													<Icon className="h-4 w-4 text-[#8A8F98]" />
													<span>{fieldType.label}</span>
												</div>
											</SelectItem>
										);
									})}
								</SelectContent>
							</Select>
						</div>

						{showOptions && (
							<div className="space-y-2">
								<LabelComponent className="text-[#8A8F98]">
									Options
								</LabelComponent>
								<div className="space-y-2">
									{options.map((option, index) => (
										<div
											className="flex items-center gap-2 rounded-md border border-[#2A2F35] bg-[#1A1D21] px-3 py-2"
											key={`create-option-${option}`}
										>
											<span className="flex-1 text-[#F7F8F8] text-sm">
												{option}
											</span>
											<Button
												className="h-6 w-6 p-0 text-[#8A8F98] hover:text-red-400"
												onClick={() => handleRemoveOption(index)}
												size="sm"
												variant="ghost"
											>
												<Trash2 className="h-3 w-3" />
											</Button>
										</div>
									))}
									<div className="flex gap-2">
										<Input
											className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8] placeholder:text-[#8A8F98]"
											onChange={(e) => setNewOption(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													handleAddOption();
												}
											}}
											placeholder="Add new option"
											value={newOption}
										/>
										<Button
											className="border-[#2A2F35] text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
											onClick={handleAddOption}
											type="button"
											variant="outline"
										>
											Add
										</Button>
									</div>
								</div>
							</div>
						)}
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
							disabled={
								!name.trim() ||
								createMutation.isPending ||
								(showOptions && options.length === 0)
							}
							type="submit"
						>
							{createMutation.isPending ? "Creating..." : "Create Field"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

interface EditCustomFieldModalProps {
	isOpen: boolean;
	onClose: () => void;
	field: {
		id: string;
		name: string;
		description: string | null;
		type: FieldType;
		options: string[] | null;
	};
	workspaceId: string;
}

function EditCustomFieldModal({
	isOpen,
	onClose,
	field,
	workspaceId,
}: EditCustomFieldModalProps) {
	const [name, setName] = useState(field.name);
	const [description, setDescription] = useState(field.description ?? "");
	const [options, setOptions] = useState<string[]>(field.options ?? []);
	const [newOption, setNewOption] = useState("");
	const utils = api.useUtils();

	const updateMutation = api.customField.update.useMutation({
		onSuccess: () => {
			void utils.customField.list.invalidate({ workspaceId });
			onClose();
		},
	});

	const handleAddOption = () => {
		if (newOption.trim() && !options.includes(newOption.trim())) {
			setOptions([...options, newOption.trim()]);
			setNewOption("");
		}
	};

	const handleRemoveOption = (index: number) => {
		setOptions(options.filter((_, i) => i !== index));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		updateMutation.mutate({
			id: field.id,
			name: name.trim(),
			description: description.trim() || undefined,
			options:
				field.type === "SELECT" || field.type === "MULTI_SELECT"
					? options
					: undefined,
		});
	};

	const showOptions = field.type === "SELECT" || field.type === "MULTI_SELECT";
	const FieldIcon =
		FIELD_TYPES.find((t) => t.value === field.type)?.icon || Text;

	return (
		<Dialog onOpenChange={onClose} open={isOpen}>
			<DialogContent className="border-[#2A2F35] bg-[#0F1115] sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-[#F7F8F8]">
						Edit Custom Field
					</DialogTitle>
					<DialogDescription className="text-[#8A8F98]">
						Update the custom field details.
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
								placeholder="Field name"
								value={name}
							/>
						</div>

						<div className="space-y-2">
							<LabelComponent
								className="text-[#8A8F98]"
								htmlFor="edit-description"
							>
								Description
							</LabelComponent>
							<Input
								className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8] placeholder:text-[#8A8F98]"
								id="edit-description"
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Brief description"
								value={description}
							/>
						</div>

						<div className="space-y-2">
							<LabelComponent className="text-[#8A8F98]">
								Field Type
							</LabelComponent>
							<div className="flex items-center gap-2 rounded-md border border-[#2A2F35] bg-[#1A1D21] px-3 py-2 text-[#F7F8F8]">
								<FieldIcon className="h-4 w-4 text-[#8A8F98]" />
								<span>
									{FIELD_TYPES.find((t) => t.value === field.type)?.label}
								</span>
							</div>
						</div>

						{showOptions && (
							<div className="space-y-2">
								<LabelComponent className="text-[#8A8F98]">
									Options
								</LabelComponent>
								<div className="space-y-2">
									{options.map((option, index) => (
										<div
											className="flex items-center gap-2 rounded-md border border-[#2A2F35] bg-[#1A1D21] px-3 py-2"
											key={`create-option-${option}`}
										>
											<span className="flex-1 text-[#F7F8F8] text-sm">
												{option}
											</span>
											<Button
												className="h-6 w-6 p-0 text-[#8A8F98] hover:text-red-400"
												onClick={() => handleRemoveOption(index)}
												size="sm"
												variant="ghost"
											>
												<Trash2 className="h-3 w-3" />
											</Button>
										</div>
									))}
									<div className="flex gap-2">
										<Input
											className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8] placeholder:text-[#8A8F98]"
											onChange={(e) => setNewOption(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													handleAddOption();
												}
											}}
											placeholder="Add new option"
											value={newOption}
										/>
										<Button
											className="border-[#2A2F35] text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
											onClick={handleAddOption}
											type="button"
											variant="outline"
										>
											Add
										</Button>
									</div>
								</div>
							</div>
						)}
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
							disabled={
								!name.trim() ||
								updateMutation.isPending ||
								(showOptions && options.length === 0)
							}
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

interface DeleteCustomFieldDialogProps {
	isOpen: boolean;
	onClose: () => void;
	field: {
		id: string;
		name: string;
	};
	workspaceId: string;
}

function DeleteCustomFieldDialog({
	isOpen,
	onClose,
	field,
	workspaceId,
}: DeleteCustomFieldDialogProps) {
	const utils = api.useUtils();

	const deleteMutation = api.customField.delete.useMutation({
		onSuccess: () => {
			void utils.customField.list.invalidate({ workspaceId });
			onClose();
		},
	});

	const handleDelete = () => {
		deleteMutation.mutate({ id: field.id });
	};

	return (
		<Dialog onOpenChange={onClose} open={isOpen}>
			<DialogContent className="border-[#2A2F35] bg-[#0F1115] sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-[#F7F8F8]">
						Delete Custom Field
					</DialogTitle>
					<DialogDescription className="text-[#8A8F98]">
						Are you sure you want to delete the custom field &quot;{field.name}
						&quot;? This will remove all values from issues.
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
						{deleteMutation.isPending ? "Deleting..." : "Delete Field"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function CustomFieldsPage() {
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [editingField, setEditingField] = useState<{
		id: string;
		name: string;
		description: string | null;
		type: FieldType;
		options: string[] | null;
	} | null>(null);
	const [deletingField, setDeletingField] = useState<{
		id: string;
		name: string;
	} | null>(null);

	const workspaceId = "clz1234567890";
	const { data: fields, isLoading } = api.customField.list.useQuery({
		workspaceId,
	});

	const reorderMutation = api.customField.reorder.useMutation({
		onSuccess: () => {
			void utils.customField.list.invalidate({ workspaceId });
		},
	});

	const utils = api.useUtils();

	const handleMoveUp = (index: number) => {
		if (!fields || index === 0) return;
		const newOrder = [...fields];
		const temp = newOrder[index];
		if (!temp) return;
		newOrder[index] = newOrder[index - 1]!;
		newOrder[index - 1] = temp;
		reorderMutation.mutate({
			workspaceId,
			fieldIds: newOrder.map((f) => f.id),
		});
	};

	const handleMoveDown = (index: number) => {
		if (!fields || index === fields.length - 1) return;
		const newOrder = [...fields];
		const temp = newOrder[index];
		if (!temp) return;
		newOrder[index] = newOrder[index + 1]!;
		newOrder[index + 1] = temp;
		reorderMutation.mutate({
			workspaceId,
			fieldIds: newOrder.map((f) => f.id),
		});
	};

	const getFieldTypeIcon = (type: FieldType) => {
		const Icon = FIELD_TYPES.find((t) => t.value === type)?.icon || Text;
		return <Icon className="h-4 w-4 text-[#8A8F98]" />;
	};

	const getFieldTypeLabel = (type: FieldType) => {
		return FIELD_TYPES.find((t) => t.value === type)?.label || type;
	};

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-[#2A2F35] border-b bg-[#0F1115] px-6 py-4">
				<div>
					<h1 className="font-semibold text-[#F7F8F8] text-xl">
						Custom Fields
					</h1>
					<p className="text-[#8A8F98] text-sm">
						Manage custom fields to track additional information on issues
					</p>
				</div>
				<Button
					className="gap-2 bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
					onClick={() => setIsCreateModalOpen(true)}
				>
					<Plus className="h-4 w-4" />
					New Field
				</Button>
			</div>

			{/* Content */}
			<ScrollArea className="flex-1 p-6">
				<Card className="border-[#2A2F35] bg-[#0F1115]">
					<CardHeader>
						<CardTitle className="text-[#F7F8F8]">All Custom Fields</CardTitle>
						<CardDescription className="text-[#8A8F98]">
							{fields?.length ?? 0} custom field
							{fields?.length !== 1 ? "s" : ""} in your workspace
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
						) : fields?.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2A2F35]">
									<Text className="h-6 w-6 text-[#8A8F98]" />
								</div>
								<h3 className="mb-1 font-medium text-[#F7F8F8]">
									No custom fields yet
								</h3>
								<p className="max-w-sm text-[#8A8F98] text-sm">
									Create custom fields to track additional information on your
									issues. Fields can be text, numbers, dates, URLs, or select
									options.
								</p>
								<Button
									className="mt-4 bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
									onClick={() => setIsCreateModalOpen(true)}
								>
									<Plus className="mr-2 h-4 w-4" />
									Create your first custom field
								</Button>
							</div>
						) : (
							<div className="divide-y divide-[#2A2F35]">
								{fields?.map((field, index) => (
									<div
										className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
										key={field.id}
									>
										<div className="flex items-center gap-3">
											<div className="flex flex-col gap-1">
												<div className="flex items-center gap-2">
													{getFieldTypeIcon(field.type as FieldType)}
													<span className="font-medium text-[#F7F8F8] text-sm">
														{field.name}
													</span>
													<span className="text-[#8A8F98] text-xs">
														({getFieldTypeLabel(field.type as FieldType)})
													</span>
												</div>
												{field.description && (
													<p className="text-[#8A8F98] text-xs">
														{field.description}
													</p>
												)}
											</div>
										</div>

										<div className="flex items-center gap-2">
											<span className="text-[#8A8F98] text-sm">
												{field._count.values} issue
												{field._count.values !== 1 ? "s" : ""}
											</span>

											<div className="flex items-center">
												<Button
													className="h-8 w-8 text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8] disabled:opacity-30"
													disabled={index === 0}
													onClick={() => handleMoveUp(index)}
													size="icon"
													variant="ghost"
												>
													<ChevronUp className="h-4 w-4" />
												</Button>
												<Button
													className="h-8 w-8 text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8] disabled:opacity-30"
													disabled={index === (fields?.length ?? 0) - 1}
													onClick={() => handleMoveDown(index)}
													size="icon"
													variant="ghost"
												>
													<ChevronDown className="h-4 w-4" />
												</Button>
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
													className="border-[#2A2F35] bg-[#1A1D21]"
												>
													<DropdownMenuItem
														className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
														onClick={() =>
															setEditingField({
																id: field.id,
																name: field.name,
																description: field.description,
																type: field.type as FieldType,
																options: field.options
																	? JSON.parse(field.options)
																	: null,
															})
														}
													>
														Edit
													</DropdownMenuItem>
													<DropdownMenuItem
														className="text-red-400 hover:bg-[#2A2F35] hover:text-red-300 focus:bg-[#2A2F35] focus:text-red-300"
														onClick={() =>
															setDeletingField({
																id: field.id,
																name: field.name,
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
			<CreateCustomFieldModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				workspaceId={workspaceId}
			/>

			{editingField && (
				<EditCustomFieldModal
					field={editingField}
					isOpen={!!editingField}
					onClose={() => setEditingField(null)}
					workspaceId={workspaceId}
				/>
			)}

			{deletingField && (
				<DeleteCustomFieldDialog
					field={deletingField}
					isOpen={!!deletingField}
					onClose={() => setDeletingField(null)}
					workspaceId={workspaceId}
				/>
			)}
		</div>
	);
}
