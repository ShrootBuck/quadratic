"use client";

import {
	AlertCircle,
	Check,
	Database,
	Download,
	FileJson,
	FileSpreadsheet,
	Filter,
	GitBranch,
	Loader2,
	Upload,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "~/trpc/react";

// Status badge component
function StatusBadge({ status }: { status: string }) {
	const colors: Record<string, string> = {
		BACKLOG: "bg-[#8A8F98]/10 text-[#8A8F98]",
		TODO: "bg-[#8A8F98]/10 text-[#8A8F98]",
		IN_PROGRESS: "bg-[#5E6AD2]/10 text-[#5E6AD2]",
		DONE: "bg-[#4EC9B0]/10 text-[#4EC9B0]",
		CANCELLED: "bg-[#F87171]/10 text-[#F87171]",
	};

	return (
		<Badge className={`${colors[status] ?? colors.BACKLOG} border-0`}>
			{status.replace(/_/g, " ")}
		</Badge>
	);
}

// Priority badge component
function PriorityBadge({ priority }: { priority: string }) {
	const colors: Record<string, string> = {
		NO_PRIORITY: "bg-[#8A8F98]/10 text-[#8A8F98]",
		LOW: "bg-[#8A8F98]/10 text-[#8A8F98]",
		MEDIUM: "bg-[#5E6AD2]/10 text-[#5E6AD2]",
		HIGH: "bg-[#F87171]/10 text-[#F87171]",
		URGENT: "bg-[#F87171]/10 text-[#F87171] font-semibold",
	};

	return (
		<Badge className={`${colors[priority] ?? colors.NO_PRIORITY} border-0`}>
			{priority.replace(/_/g, " ")}
		</Badge>
	);
}

// Export Filters Component
function ExportFilters({
	workspaceId,
	onExport,
}: {
	workspaceId: string;
	onExport: (format: "csv" | "json") => void;
}) {
	const [teamId, setTeamId] = useState<string | undefined>(undefined);
	const [projectId, setProjectId] = useState<string | undefined>(undefined);
	const [status, setStatus] = useState<
		"BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED" | undefined
	>(undefined);
	const [priority, setPriority] = useState<
		"NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined
	>(undefined);

	const { data: teams } = api.team.list.useQuery({ workspaceId });
	const { data: projects } = api.project.list.useQuery({ workspaceId });

	const handleExport = (format: "csv" | "json") => {
		onExport(format);
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label className="text-[#8A8F98]">Team</Label>
					<Select onValueChange={setTeamId} value={teamId}>
						<SelectTrigger className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8]">
							<SelectValue placeholder="All teams" />
						</SelectTrigger>
						<SelectContent className="border-[#2A2F35] bg-[#1A1D21]">
							<SelectItem className="text-[#F7F8F8]" value="">
								All teams
							</SelectItem>
							{teams?.map((team) => (
								<SelectItem
									className="text-[#F7F8F8]"
									key={team.id}
									value={team.id}
								>
									{team.key} - {team.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label className="text-[#8A8F98]">Project</Label>
					<Select onValueChange={setProjectId} value={projectId}>
						<SelectTrigger className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8]">
							<SelectValue placeholder="All projects" />
						</SelectTrigger>
						<SelectContent className="border-[#2A2F35] bg-[#1A1D21]">
							<SelectItem className="text-[#F7F8F8]" value="">
								All projects
							</SelectItem>
							{projects?.projects?.map(
								(project: { id: string; name: string }) => (
									<SelectItem
										className="text-[#F7F8F8]"
										key={project.id}
										value={project.id}
									>
										{project.name}
									</SelectItem>
								),
							)}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label className="text-[#8A8F98]">Status</Label>
					<Select
						onValueChange={(v) => setStatus(v as typeof status)}
						value={status}
					>
						<SelectTrigger className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8]">
							<SelectValue placeholder="All statuses" />
						</SelectTrigger>
						<SelectContent className="border-[#2A2F35] bg-[#1A1D21]">
							<SelectItem className="text-[#F7F8F8]" value="">
								All statuses
							</SelectItem>
							<SelectItem className="text-[#F7F8F8]" value="BACKLOG">
								Backlog
							</SelectItem>
							<SelectItem className="text-[#F7F8F8]" value="TODO">
								Todo
							</SelectItem>
							<SelectItem className="text-[#F7F8F8]" value="IN_PROGRESS">
								In Progress
							</SelectItem>
							<SelectItem className="text-[#F7F8F8]" value="DONE">
								Done
							</SelectItem>
							<SelectItem className="text-[#F7F8F8]" value="CANCELLED">
								Cancelled
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label className="text-[#8A8F98]">Priority</Label>
					<Select
						onValueChange={(v) => setPriority(v as typeof priority)}
						value={priority}
					>
						<SelectTrigger className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8]">
							<SelectValue placeholder="All priorities" />
						</SelectTrigger>
						<SelectContent className="border-[#2A2F35] bg-[#1A1D21]">
							<SelectItem className="text-[#F7F8F8]" value="">
								All priorities
							</SelectItem>
							<SelectItem className="text-[#F7F8F8]" value="NO_PRIORITY">
								No Priority
							</SelectItem>
							<SelectItem className="text-[#F7F8F8]" value="LOW">
								Low
							</SelectItem>
							<SelectItem className="text-[#F7F8F8]" value="MEDIUM">
								Medium
							</SelectItem>
							<SelectItem className="text-[#F7F8F8]" value="HIGH">
								High
							</SelectItem>
							<SelectItem className="text-[#F7F8F8]" value="URGENT">
								Urgent
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<Separator className="bg-[#2A2F35]" />

			<div className="flex items-center justify-between">
				<div className="text-[#8A8F98] text-sm">
					<Filter className="mr-1 inline h-4 w-4" />
					Apply filters to limit which issues are exported
				</div>
				<div className="flex gap-2">
					<Button
						className="gap-2 border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
						onClick={() => handleExport("json")}
						variant="outline"
					>
						<FileJson className="h-4 w-4" />
						Export JSON
					</Button>
					<Button
						className="gap-2 bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
						onClick={() => handleExport("csv")}
					>
						<FileSpreadsheet className="h-4 w-4" />
						Export CSV
					</Button>
				</div>
			</div>
		</div>
	);
}

// Import Preview Dialog
function ImportPreviewDialog({
	isOpen,
	onClose,
	preview,
	importType: _importType,
	onConfirm,
	isImporting,
}: {
	isOpen: boolean;
	onClose: () => void;
	preview: {
		preview: Array<{
			row: number;
			data: Record<string, unknown>;
			errors: string[];
			isValid: boolean;
		}>;
		totalRows: number;
		validRows: number;
		invalidRows: number;
	} | null;
	importType: "csv" | "linear" | "github";
	onConfirm: (items: Array<Record<string, unknown>>) => void;
	isImporting: boolean;
}) {
	const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

	if (!preview) return null;

	const toggleItem = (row: number) => {
		const newSelected = new Set(selectedItems);
		if (newSelected.has(row)) {
			newSelected.delete(row);
		} else {
			newSelected.add(row);
		}
		setSelectedItems(newSelected);
	};

	const toggleAll = () => {
		const validRows = preview.preview
			.filter((p) => p.isValid)
			.map((p) => p.row);
		if (selectedItems.size === validRows.length) {
			setSelectedItems(new Set());
		} else {
			setSelectedItems(new Set(validRows));
		}
	};

	const handleConfirm = () => {
		const itemsToImport = preview.preview
			.filter((p) => selectedItems.has(p.row))
			.map((p) => p.data);
		onConfirm(itemsToImport);
	};

	return (
		<Dialog onOpenChange={onClose} open={isOpen}>
			<DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden border-[#2A2F35] bg-[#0F1115]">
				<DialogHeader>
					<DialogTitle className="text-[#F7F8F8]">Import Preview</DialogTitle>
					<DialogDescription className="text-[#8A8F98]">
						Review the data before importing. {preview.validRows} of{" "}
						{preview.totalRows} rows are valid.
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-center justify-between py-4">
					<div className="flex items-center gap-4">
						<Label className="flex items-center gap-2 text-[#F7F8F8]">
							<input
								checked={
									selectedItems.size ===
										preview.preview.filter((p) => p.isValid).length &&
									preview.preview.filter((p) => p.isValid).length > 0
								}
								className="h-4 w-4 rounded border-[#2A2F35]"
								onChange={toggleAll}
								type="checkbox"
							/>
							Select all valid
						</Label>
						<Badge className="bg-[#5E6AD2]/10 text-[#5E6AD2]">
							{selectedItems.size} selected
						</Badge>
					</div>
					{preview.invalidRows > 0 && (
						<Badge className="bg-red-500/10 text-red-400">
							{preview.invalidRows} rows have errors
						</Badge>
					)}
				</div>

				<div className="flex-1 overflow-auto rounded-md border border-[#2A2F35]">
					<table className="w-full text-sm">
						<thead className="sticky top-0 bg-[#1A1D21]">
							<tr>
								<th className="w-10 px-4 py-3 text-left font-medium text-[#8A8F98]"></th>
								<th className="px-4 py-3 text-left font-medium text-[#8A8F98]">
									Row
								</th>
								<th className="px-4 py-3 text-left font-medium text-[#8A8F98]">
									Title
								</th>
								<th className="px-4 py-3 text-left font-medium text-[#8A8F98]">
									Status
								</th>
								<th className="px-4 py-3 text-left font-medium text-[#8A8F98]">
									Priority
								</th>
								<th className="px-4 py-3 text-left font-medium text-[#8A8F98]">
									Team
								</th>
								<th className="px-4 py-3 text-left font-medium text-[#8A8F98]">
									Errors
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#2A2F35]">
							{preview.preview.map((item) => (
								<tr
									className={
										item.isValid ? "hover:bg-[#1A1D21]" : "bg-red-500/5"
									}
									key={item.row}
								>
									<td className="px-4 py-3">
										{item.isValid && (
											<input
												checked={selectedItems.has(item.row)}
												className="h-4 w-4 rounded border-[#2A2F35]"
												onChange={() => toggleItem(item.row)}
												type="checkbox"
											/>
										)}
									</td>
									<td className="px-4 py-3 text-[#8A8F98]">{item.row}</td>
									<td className="max-w-xs truncate px-4 py-3 text-[#F7F8F8]">
										{(item.data.title as string) ?? "-"}
									</td>
									<td className="px-4 py-3">
										<StatusBadge status={String(item.data.status)} />
									</td>
									<td className="px-4 py-3">
										<PriorityBadge priority={String(item.data.priority)} />
									</td>
									<td className="px-4 py-3 text-[#8A8F98]">
										{(item.data.teamKey as string) ?? "-"}
									</td>
									<td className="px-4 py-3">
										{item.errors.length > 0 ? (
											<div className="flex items-center gap-1 text-red-400">
												<AlertCircle className="h-4 w-4" />
												<span className="text-xs">
													{item.errors.join(", ")}
												</span>
											</div>
										) : (
											<Check className="h-4 w-4 text-green-400" />
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<DialogFooter className="mt-4">
					<Button
						className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
						onClick={onClose}
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						className="gap-2 bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
						disabled={selectedItems.size === 0 || isImporting}
						onClick={handleConfirm}
					>
						{isImporting ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Importing...
							</>
						) : (
							<>
								<Download className="h-4 w-4" />
								Import {selectedItems.size} items
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Main Page Component
export default function ImportExportPage() {
	const [activeTab, setActiveTab] = useState("export");
	const [showPreview, setShowPreview] = useState(false);
	const [importPreview, setImportPreview] = useState<{
		preview: Array<{
			row: number;
			data: Record<string, unknown>;
			errors: string[];
			isValid: boolean;
		}>;
		totalRows: number;
		validRows: number;
		invalidRows: number;
	} | null>(null);
	const [importType, setImportType] = useState<"csv" | "linear" | "github">(
		"csv",
	);
	const [importData, setImportData] = useState("");
	const [defaultTeamKey, setDefaultTeamKey] = useState("");
	const [showSuccess, setShowSuccess] = useState(false);

	const workspaceId = "clz1234567890";

	const exportCSVMutation = api.importExport.exportToCSV.useMutation({
		onSuccess: (data) => {
			const blob = new Blob([data.csv], { type: "text/csv" });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = data.filename;
			a.click();
			window.URL.revokeObjectURL(url);
		},
	});

	const exportJSONMutation = api.importExport.exportToJSON.useMutation({
		onSuccess: (data) => {
			const blob = new Blob([data.json], { type: "application/json" });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = data.filename;
			a.click();
			window.URL.revokeObjectURL(url);
		},
	});

	const previewCSVMutation = api.importExport.previewCSVImport.useMutation({
		onSuccess: (data) => {
			setImportPreview(
				data as {
					preview: Array<{
						row: number;
						data: Record<string, unknown>;
						errors: string[];
						isValid: boolean;
					}>;
					totalRows: number;
					validRows: number;
					invalidRows: number;
				} | null,
			);
			setShowPreview(true);
		},
	});

	const previewLinearMutation =
		api.importExport.previewLinearImport.useMutation({
			onSuccess: (data) => {
				setImportPreview(
					data as {
						preview: Array<{
							row: number;
							data: Record<string, unknown>;
							errors: string[];
							isValid: boolean;
						}>;
						totalRows: number;
						validRows: number;
						invalidRows: number;
					} | null,
				);
				setShowPreview(true);
			},
		});

	const previewGitHubMutation =
		api.importExport.previewGitHubImport.useMutation({
			onSuccess: (data) => {
				setImportPreview(
					data as {
						preview: Array<{
							row: number;
							data: Record<string, unknown>;
							errors: string[];
							isValid: boolean;
						}>;
						totalRows: number;
						validRows: number;
						invalidRows: number;
					} | null,
				);
				setShowPreview(true);
			},
		});

	const importCSVMutation = api.importExport.importFromCSV.useMutation({
		onSuccess: () => {
			setShowPreview(false);
			setShowSuccess(true);
			setImportData("");
			setTimeout(() => setShowSuccess(false), 3000);
		},
	});

	const importLinearMutation = api.importExport.importFromLinear.useMutation({
		onSuccess: () => {
			setShowPreview(false);
			setShowSuccess(true);
			setImportData("");
			setTimeout(() => setShowSuccess(false), 3000);
		},
	});

	const importGitHubMutation = api.importExport.importFromGitHub.useMutation({
		onSuccess: () => {
			setShowPreview(false);
			setShowSuccess(true);
			setImportData("");
			setTimeout(() => setShowSuccess(false), 3000);
		},
	});

	const handleExport = (format: "csv" | "json") => {
		const filters = {
			workspaceId,
		};
		if (format === "csv") {
			exportCSVMutation.mutate(filters);
		} else {
			exportJSONMutation.mutate(filters);
		}
	};

	const handlePreview = () => {
		if (!importData.trim()) return;

		if (importType === "csv") {
			previewCSVMutation.mutate({
				workspaceId,
				csvData: importData,
				fieldMapping: {
					title: "title",
					description: "description",
					status: "status",
					priority: "priority",
					teamKey: "team",
				},
			});
		} else if (importType === "linear") {
			previewLinearMutation.mutate({
				workspaceId,
				jsonData: importData,
			});
		} else if (importType === "github") {
			if (!defaultTeamKey) return;
			previewGitHubMutation.mutate({
				workspaceId,
				jsonData: importData,
				defaultTeamKey,
			});
		}
	};

	const handleImport = (items: Array<Record<string, unknown>>) => {
		if (importType === "csv") {
			importCSVMutation.mutate({
				workspaceId,
				items: items as Array<{
					title: string;
					description?: string;
					status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
					priority: "NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
					teamId: string;
					assigneeId?: string;
					projectId?: string;
					labels: string[];
				}>,
			});
		} else if (importType === "linear") {
			importLinearMutation.mutate({
				workspaceId,
				items: items as Array<{
					title: string;
					description?: string;
					status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
					priority: "NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
					teamId: string;
					assigneeId?: string;
					projectId?: string;
					labels: string[];
					comments?: Array<{
						content: string;
						authorEmail: string;
						createdAt: string;
					}>;
				}>,
			});
		} else if (importType === "github") {
			importGitHubMutation.mutate({
				workspaceId,
				items: items as Array<{
					title: string;
					description?: string;
					status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
					priority: "NO_PRIORITY" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
					teamId: string;
					assigneeId?: string;
					labels: string[];
				}>,
			});
		}
	};

	return (
		<div className="mx-auto max-w-4xl p-8">
			<div className="mb-8">
				<h1 className="mb-2 font-semibold text-2xl text-[#F7F8F8]">
					Import / Export
				</h1>
				<p className="text-[#8A8F98]">
					Import issues from other tools or export your data for backup
				</p>
			</div>

			{showSuccess && (
				<div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-400">
					<div className="flex items-center gap-2">
						<Check className="h-5 w-5" />
						<span className="font-medium">Import completed successfully!</span>
					</div>
				</div>
			)}

			<Tabs
				className="space-y-6"
				onValueChange={setActiveTab}
				value={activeTab}
			>
				<TabsList className="border-[#2A2F35] bg-[#16181D]">
					<TabsTrigger
						className="data-[state=active]:bg-[#5E6AD2] data-[state=active]:text-white"
						value="export"
					>
						<Download className="mr-2 h-4 w-4" />
						Export
					</TabsTrigger>
					<TabsTrigger
						className="data-[state=active]:bg-[#5E6AD2] data-[state=active]:text-white"
						value="import"
					>
						<Upload className="mr-2 h-4 w-4" />
						Import
					</TabsTrigger>
				</TabsList>

				{/* Export Tab */}
				<TabsContent className="space-y-6" value="export">
					<Card className="border-[#2A2F35] bg-[#0F1115]">
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5E6AD2]/10">
									<Download className="h-5 w-5 text-[#5E6AD2]" />
								</div>
								<div>
									<CardTitle className="text-[#F7F8F8]">
										Export Issues
									</CardTitle>
									<CardDescription className="text-[#8A8F98]">
										Download your issues in CSV or JSON format
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<ExportFilters
								onExport={handleExport}
								workspaceId={workspaceId}
							/>
						</CardContent>
					</Card>

					<Card className="border-[#2A2F35] bg-[#0F1115]">
						<CardHeader>
							<CardTitle className="text-[#F7F8F8]">Export Formats</CardTitle>
							<CardDescription className="text-[#8A8F98]">
								Learn about the available export formats
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="rounded-lg border border-[#2A2F35] bg-[#1A1D21] p-4">
								<div className="mb-2 flex items-center gap-2">
									<FileSpreadsheet className="h-5 w-5 text-green-400" />
									<span className="font-medium text-[#F7F8F8]">CSV Format</span>
								</div>
								<p className="mb-3 text-[#8A8F98] text-sm">
									Best for importing into spreadsheet applications like Excel or
									Google Sheets. Includes all issue metadata, comments, and
									history.
								</p>
								<div className="rounded bg-[#0F1115] p-2 font-mono text-[#8A8F98] text-xs">
									identifier, title, description, status, priority, team,
									project, ...
								</div>
							</div>

							<div className="rounded-lg border border-[#2A2F35] bg-[#1A1D21] p-4">
								<div className="mb-2 flex items-center gap-2">
									<FileJson className="h-5 w-5 text-blue-400" />
									<span className="font-medium text-[#F7F8F8]">
										JSON Format
									</span>
								</div>
								<p className="mb-3 text-[#8A8F98] text-sm">
									Best for programmatic access and data migration. Preserves all
									relationships and metadata in a structured format.
								</p>
								<div className="rounded bg-[#0F1115] p-2 font-mono text-[#8A8F98] text-xs">
									{
										'{ "issues": [{ "id": "...", "title": "...", "comments": [...] }] }'
									}
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Import Tab */}
				<TabsContent className="space-y-6" value="import">
					<Card className="border-[#2A2F35] bg-[#0F1115]">
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5E6AD2]/10">
									<Upload className="h-5 w-5 text-[#5E6AD2]" />
								</div>
								<div>
									<CardTitle className="text-[#F7F8F8]">
										Import Issues
									</CardTitle>
									<CardDescription className="text-[#8A8F98]">
										Import issues from CSV, Linear, or GitHub
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<Label className="text-[#8A8F98]">Import Source</Label>
								<div className="grid grid-cols-3 gap-3">
									<button
										className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
											importType === "csv"
												? "border-[#5E6AD2] bg-[#5E6AD2]/10"
												: "border-[#2A2F35] bg-[#1A1D21] hover:bg-[#2A2F35]"
										}`}
										onClick={() => setImportType("csv")}
										type="button"
									>
										<FileSpreadsheet
											className={`h-8 w-8 ${
												importType === "csv"
													? "text-[#5E6AD2]"
													: "text-[#8A8F98]"
											}`}
										/>
										<span
											className={
												importType === "csv"
													? "text-[#F7F8F8]"
													: "text-[#8A8F98]"
											}
										>
											CSV
										</span>
									</button>
									<button
										className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
											importType === "linear"
												? "border-[#5E6AD2] bg-[#5E6AD2]/10"
												: "border-[#2A2F35] bg-[#1A1D21] hover:bg-[#2A2F35]"
										}`}
										onClick={() => setImportType("linear")}
										type="button"
									>
										<Database
											className={`h-8 w-8 ${
												importType === "linear"
													? "text-[#5E6AD2]"
													: "text-[#8A8F98]"
											}`}
										/>
										<span
											className={
												importType === "linear"
													? "text-[#F7F8F8]"
													: "text-[#8A8F98]"
											}
										>
											Linear
										</span>
									</button>
									<button
										className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
											importType === "github"
												? "border-[#5E6AD2] bg-[#5E6AD2]/10"
												: "border-[#2A2F35] bg-[#1A1D21] hover:bg-[#2A2F35]"
										}`}
										onClick={() => setImportType("github")}
										type="button"
									>
										<GitBranch
											className={`h-8 w-8 ${
												importType === "github"
													? "text-[#5E6AD2]"
													: "text-[#8A8F98]"
											}`}
										/>
										<span
											className={
												importType === "github"
													? "text-[#F7F8F8]"
													: "text-[#8A8F98]"
											}
										>
											GitHub
										</span>
									</button>
								</div>
							</div>

							{importType === "github" && (
								<div className="space-y-2">
									<Label className="text-[#8A8F98]">Default Team</Label>
									<Input
										className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8]"
										onChange={(e) => setDefaultTeamKey(e.target.value)}
										placeholder="e.g., ENG"
										value={defaultTeamKey}
									/>
									<p className="text-[#8A8F98] text-sm">
										GitHub issues don&apos;t have teams. All imported issues
										will be assigned to this team.
									</p>
								</div>
							)}

							<div className="space-y-2">
								<Label className="text-[#8A8F98]">
									{importType === "csv" ? "CSV Data" : "JSON Data"}
								</Label>
								<Textarea
									className="min-h-[200px] border-[#2A2F35] bg-[#1A1D21] font-mono text-[#F7F8F8] text-sm"
									onChange={(e) => setImportData(e.target.value)}
									placeholder={
										importType === "csv"
											? "Paste CSV data here...\ntitle,description,status,team\nMy Issue,Description,TODO,ENG"
											: importType === "linear"
												? "Paste Linear JSON export here..."
												: "Paste GitHub Issues JSON here..."
									}
									value={importData}
								/>
							</div>

							<div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
								<div className="flex items-start gap-3">
									<AlertCircle className="mt-0.5 h-5 w-5 text-amber-400" />
									<div>
										<p className="font-medium text-amber-200 text-sm">
											Preview Before Import
										</p>
										<p className="text-amber-200/70 text-sm">
											All imports are validated before processing. You&apos;ll
											have a chance to review and select which items to import.
										</p>
									</div>
								</div>
							</div>

							<div className="flex justify-end">
								<Button
									className="gap-2 bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
									disabled={
										!importData.trim() ||
										(importType === "github" && !defaultTeamKey) ||
										previewCSVMutation.isPending ||
										previewLinearMutation.isPending ||
										previewGitHubMutation.isPending
									}
									onClick={handlePreview}
								>
									{previewCSVMutation.isPending ||
									previewLinearMutation.isPending ||
									previewGitHubMutation.isPending ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											Validating...
										</>
									) : (
										<>
											<Upload className="h-4 w-4" />
											Preview Import
										</>
									)}
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card className="border-[#2A2F35] bg-[#0F1115]">
						<CardHeader>
							<CardTitle className="text-[#F7F8F8]">Import Formats</CardTitle>
							<CardDescription className="text-[#8A8F98]">
								Supported import formats and expected structure
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="rounded-lg border border-[#2A2F35] bg-[#1A1D21] p-4">
								<h4 className="mb-2 font-medium text-[#F7F8F8]">CSV Format</h4>
								<p className="mb-3 text-[#8A8F98] text-sm">
									Required columns: title, team. Optional columns: description,
									status, priority, assignee, project, labels.
								</p>
								<div className="rounded bg-[#0F1115] p-2 font-mono text-[#8A8F98] text-xs">
									title,description,status,priority,team\n Implement auth,Add
									login flow,TODO,HIGH,ENG
								</div>
							</div>

							<div className="rounded-lg border border-[#2A2F35] bg-[#1A1D21] p-4">
								<h4 className="mb-2 font-medium text-[#F7F8F8]">Linear JSON</h4>
								<p className="mb-3 text-[#8A8F98] text-sm">
									Export from Linear and paste the JSON directly. Comments and
									labels will be preserved.
								</p>
							</div>

							<div className="rounded-lg border border-[#2A2F35] bg-[#1A1D21] p-4">
								<h4 className="mb-2 font-medium text-[#F7F8F8]">
									GitHub Issues JSON
								</h4>
								<p className="mb-3 text-[#8A8F98] text-sm">
									Export from GitHub API and paste the JSON. You&apos;ll need to
									specify a default team for all imported issues.
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<ImportPreviewDialog
				importType={importType}
				isImporting={
					importCSVMutation.isPending ||
					importLinearMutation.isPending ||
					importGitHubMutation.isPending
				}
				isOpen={showPreview}
				onClose={() => setShowPreview(false)}
				onConfirm={handleImport}
				preview={importPreview}
			/>
		</div>
	);
}
