"use client";

import { format } from "date-fns";
import { Calendar, CheckCircle2, Circle, Plus, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { cn } from "@/lib/utils";
import { api } from "~/trpc/react";

type CycleStatus = "UPCOMING" | "CURRENT" | "COMPLETED";

interface CreateCycleForm {
	name: string;
	description: string;
	startDate: string;
	endDate: string;
	teamId: string;
}

export default function CyclesPage() {
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [formData, setFormData] = useState<CreateCycleForm>({
		name: "",
		description: "",
		startDate: "",
		endDate: "",
		teamId: "",
	});

	const { workspaceId } = useCurrentWorkspace();

	const { data: cyclesData, isLoading } = api.cycle.list.useQuery({
		workspaceId,
		limit: 50,
	});

	const { data: teamsData } = api.workspace.getTeams.useQuery({
		workspaceId,
	});

	const utils = api.useUtils();

	const createCycle = api.cycle.create.useMutation({
		onSuccess: () => {
			utils.cycle.list.invalidate({ workspaceId });
			setCreateModalOpen(false);
			setFormData({
				name: "",
				description: "",
				startDate: "",
				endDate: "",
				teamId: "",
			});
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.teamId) return;

		createCycle.mutate({
			name: formData.name,
			description: formData.description || undefined,
			startDate: new Date(formData.startDate),
			endDate: new Date(formData.endDate),
			teamId: formData.teamId,
			workspaceId,
		});
	};

	const calculateProgress = (cycle: { issues: { status: string }[] }) => {
		if (cycle.issues.length === 0) return 0;
		const completed = cycle.issues.filter((i) => i.status === "DONE").length;
		return Math.round((completed / cycle.issues.length) * 100);
	};

	const upcomingCycles =
		cyclesData?.cycles.filter((c) => c.status === "UPCOMING") ?? [];
	const currentCycles =
		cyclesData?.cycles.filter((c) => c.status === "CURRENT") ?? [];
	const completedCycles =
		cyclesData?.cycles.filter((c) => c.status === "COMPLETED") ?? [];

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-[#2A2F35] border-b px-6 py-4">
				<div>
					<h1 className="font-semibold text-[#F7F8F8] text-xl">Cycles</h1>
					<p className="text-[#8A8F98] text-sm">
						{cyclesData?.total ?? 0} cycles
					</p>
				</div>
				<Dialog onOpenChange={setCreateModalOpen} open={createModalOpen}>
					<DialogTrigger asChild>
						<Button className="bg-[#5E6AD2] text-white hover:bg-[#4F57B3]">
							<Plus className="mr-2 h-4 w-4" />
							New Cycle
						</Button>
					</DialogTrigger>
					<DialogContent className="border-[#2A2F35] bg-[#16181D] sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle className="text-[#F7F8F8]">
								Create New Cycle
							</DialogTitle>
						</DialogHeader>
						<form className="space-y-4 pt-4" onSubmit={handleSubmit}>
							<div className="space-y-2">
								<Label className="text-[#F7F8F8]" htmlFor="name">
									Name
								</Label>
								<Input
									className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] placeholder:text-[#8A8F98]"
									id="name"
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder="e.g., Sprint 1"
									required
									value={formData.name}
								/>
							</div>

							<div className="space-y-2">
								<Label className="text-[#F7F8F8]" htmlFor="description">
									Description
								</Label>
								<Textarea
									className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] placeholder:text-[#8A8F98]"
									id="description"
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									placeholder="Cycle description..."
									value={formData.description}
								/>
							</div>

							<div className="space-y-2">
								<Label className="text-[#F7F8F8]">Team</Label>
								<Select
									onValueChange={(value) =>
										setFormData({ ...formData, teamId: value })
									}
									value={formData.teamId}
								>
									<SelectTrigger className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]">
										<SelectValue placeholder="Select a team" />
									</SelectTrigger>
									<SelectContent className="border-[#2A2F35] bg-[#16181D]">
										{teamsData?.map((team) => (
											<SelectItem
												className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
												key={team.id}
												value={team.id}
											>
												<div className="flex items-center gap-2">
													<div
														className="h-2 w-2 rounded-full"
														style={{ backgroundColor: team.color }}
													/>
													{team.name}
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label className="text-[#F7F8F8]" htmlFor="startDate">
										Start Date
									</Label>
									<Input
										className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]"
										id="startDate"
										onChange={(e) =>
											setFormData({ ...formData, startDate: e.target.value })
										}
										required
										type="date"
										value={formData.startDate}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-[#F7F8F8]" htmlFor="endDate">
										End Date
									</Label>
									<Input
										className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8]"
										id="endDate"
										onChange={(e) =>
											setFormData({ ...formData, endDate: e.target.value })
										}
										required
										type="date"
										value={formData.endDate}
									/>
								</div>
							</div>

							<Button
								className="w-full bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
								disabled={createCycle.isPending || !formData.teamId}
								type="submit"
							>
								{createCycle.isPending ? "Creating..." : "Create Cycle"}
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
								className="h-20 animate-pulse rounded-lg bg-[#2A2F35]"
								key={key}
							/>
						))}
					</div>
				) : (
					<div className="space-y-8">
						{/* Current Cycles */}
						{currentCycles.length > 0 && (
							<section>
								<h2 className="mb-4 font-medium text-[#8A8F98] text-sm">
									Current
								</h2>
								<div className="space-y-2">
									{currentCycles.map((cycle) => (
										<CycleCard
											cycle={cycle}
											key={cycle.id}
											progress={calculateProgress(cycle)}
										/>
									))}
								</div>
							</section>
						)}

						{/* Upcoming Cycles */}
						{upcomingCycles.length > 0 && (
							<section>
								<h2 className="mb-4 font-medium text-[#8A8F98] text-sm">
									Upcoming
								</h2>
								<div className="space-y-2">
									{upcomingCycles.map((cycle) => (
										<CycleCard
											cycle={cycle}
											key={cycle.id}
											progress={calculateProgress(cycle)}
										/>
									))}
								</div>
							</section>
						)}

						{/* Completed Cycles */}
						{completedCycles.length > 0 && (
							<section>
								<h2 className="mb-4 font-medium text-[#8A8F98] text-sm">
									Completed
								</h2>
								<div className="space-y-2">
									{completedCycles.map((cycle) => (
										<CycleCard
											cycle={cycle}
											key={cycle.id}
											progress={calculateProgress(cycle)}
										/>
									))}
								</div>
							</section>
						)}

						{cyclesData?.cycles.length === 0 && (
							<div className="py-12 text-center">
								<RotateCcw className="mx-auto mb-4 h-12 w-12 text-[#8A8F98]" />
								<h3 className="mb-2 font-medium text-[#F7F8F8]">
									No cycles yet
								</h3>
								<p className="text-[#8A8F98]">
									Create your first cycle to start tracking sprints
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

function CycleCard({
	cycle,
	progress,
}: {
	cycle: {
		id: string;
		name: string;
		description: string | null;
		status: CycleStatus;
		startDate: Date;
		endDate: Date;
		team: { name: string; color: string };
		issues: { id: string; status: string }[];
	};
	progress: number;
}) {
	const getStatusIcon = (status: CycleStatus) => {
		switch (status) {
			case "CURRENT":
				return <RotateCcw className="h-5 w-5 text-[#5E6AD2]" />;
			case "COMPLETED":
				return <CheckCircle2 className="h-5 w-5 text-[#4EC9B0]" />;
			default:
				return <Circle className="h-5 w-5 text-[#8A8F98]" />;
		}
	};

	const getStatusLabel = (status: CycleStatus) => {
		switch (status) {
			case "CURRENT":
				return "Current";
			case "COMPLETED":
				return "Completed";
			default:
				return "Upcoming";
		}
	};

	return (
		<Link
			className="flex items-center gap-4 rounded-lg border border-[#2A2F35] bg-[#16181D] p-4 transition-colors hover:border-[#5E6AD2]"
			href={`/app/cycles/${cycle.id}`}
		>
			<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0F1115]">
				{getStatusIcon(cycle.status)}
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-3">
					<h3 className="truncate font-medium text-[#F7F8F8]">{cycle.name}</h3>
					<span
						className={cn(
							"rounded-full px-2 py-0.5 text-xs",
							cycle.status === "CURRENT" && "bg-[#5E6AD2]/20 text-[#5E6AD2]",
							cycle.status === "COMPLETED" && "bg-[#4EC9B0]/20 text-[#4EC9B0]",
							cycle.status === "UPCOMING" && "bg-[#8A8F98]/20 text-[#8A8F98]",
						)}
					>
						{getStatusLabel(cycle.status)}
					</span>
				</div>

				{cycle.description && (
					<p className="mt-1 truncate text-[#8A8F98] text-sm">
						{cycle.description}
					</p>
				)}

				<div className="mt-2 flex items-center gap-4 text-[#8A8F98] text-xs">
					<div className="flex items-center gap-1">
						<Calendar className="h-3 w-3" />
						<span>
							{format(new Date(cycle.startDate), "MMM d")} -{" "}
							{format(new Date(cycle.endDate), "MMM d, yyyy")}
						</span>
					</div>
					<div className="flex items-center gap-1">
						<div
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: cycle.team.color }}
						/>
						<span>{cycle.team.name}</span>
					</div>
					<span>{cycle.issues.length} issues</span>
				</div>
			</div>

			{/* Progress Bar */}
			<div className="w-32">
				<div className="mb-1 flex items-center justify-between text-xs">
					<span className="text-[#8A8F98]">{progress}%</span>
					<span className="text-[#8A8F98]">
						{cycle.issues.filter((i) => i.status === "DONE").length}/
						{cycle.issues.length}
					</span>
				</div>
				<div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2A2F35]">
					<div
						className="h-full rounded-full bg-[#5E6AD2] transition-all"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>
		</Link>
	);
}
