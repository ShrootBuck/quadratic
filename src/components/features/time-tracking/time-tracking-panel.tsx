"use client";

import { Clock, Pause, Play, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { TIME_ENTRIES_LIMIT } from "~/constants";
import { formatDuration, formatTimeAgo } from "~/lib/time";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface TimeTrackingPanelProps {
	issueId: string;
	workspaceId: string;
}

export function TimeTrackingPanel({
	issueId,
	workspaceId,
}: TimeTrackingPanelProps) {
	const [isTimerRunning, setIsTimerRunning] = useState(false);
	const [elapsedTime, setElapsedTime] = useState(0);
	const [runningEntryId, setRunningEntryId] = useState<string | null>(null);
	const [manualDuration, setManualDuration] = useState("");
	const [manualDescription, setManualDescription] = useState("");
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

	// Get issue time summary
	const { data: timeSummary, refetch: refetchSummary } =
		api.timeTracking.getIssueTimeSummary.useQuery({
			issueId,
		});

	// Get time entries
	const { data: timeEntriesData, refetch: refetchEntries } =
		api.timeTracking.list.useQuery({
			issueId,
			workspaceId,
			limit: TIME_ENTRIES_LIMIT,
		});

	// Get running timer
	const { data: runningTimer } = api.timeTracking.getRunningTimer.useQuery();

	// Mutations
	const startTimer = api.timeTracking.startTimer.useMutation({
		onSuccess: (data) => {
			setIsTimerRunning(true);
			setRunningEntryId(data.id);
			setElapsedTime(0);
			refetchEntries();
		},
	});

	const stopTimer = api.timeTracking.stopTimer.useMutation({
		onSuccess: () => {
			setIsTimerRunning(false);
			setRunningEntryId(null);
			setElapsedTime(0);
			refetchEntries();
			refetchSummary();
		},
	});

	const createEntry = api.timeTracking.create.useMutation({
		onSuccess: () => {
			setManualDuration("");
			setManualDescription("");
			setIsAddDialogOpen(false);
			refetchEntries();
			refetchSummary();
		},
	});

	const deleteEntry = api.timeTracking.delete.useMutation({
		onSuccess: () => {
			refetchEntries();
			refetchSummary();
		},
	});

	// Check if there's a running timer for this issue
	useEffect(() => {
		if (runningTimer) {
			if (runningTimer.issueId === issueId) {
				setIsTimerRunning(true);
				setRunningEntryId(runningTimer.id);
				const startedAt = new Date(runningTimer.startedAt).getTime();
				const now = Date.now();
				setElapsedTime(Math.floor((now - startedAt) / 1000));
			}
		} else {
			setIsTimerRunning(false);
			setRunningEntryId(null);
			setElapsedTime(0);
		}
	}, [runningTimer, issueId]);

	// Timer effect
	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (isTimerRunning) {
			interval = setInterval(() => {
				setElapsedTime((prev) => prev + 1);
			}, 1000);
		}
		return () => clearInterval(interval);
	}, [isTimerRunning]);

	const handleStartTimer = () => {
		startTimer.mutate({ issueId });
	};

	const handleStopTimer = () => {
		if (runningEntryId) {
			stopTimer.mutate({ timeEntryId: runningEntryId });
		}
	};

	const handleAddManualEntry = () => {
		const duration = parseFloat(manualDuration);
		if (Number.isNaN(duration) || duration <= 0) return;

		createEntry.mutate({
			issueId,
			duration,
			description: manualDescription || undefined,
		});
	};

	const handleDeleteEntry = (entryId: string) => {
		deleteEntry.mutate({ id: entryId });
	};

	const formatTimerDisplay = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className="space-y-6">
			{/* Timer Section */}
			<div className="rounded-lg border bg-card p-4">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="font-semibold">Timer</h3>
						<p className="text-muted-foreground text-sm">
							Track time spent on this issue
						</p>
					</div>
					<div className="flex items-center gap-3">
						{isTimerRunning && (
							<div className="font-mono font-semibold text-2xl text-primary">
								{formatTimerDisplay(elapsedTime)}
							</div>
						)}
						<Button
							disabled={startTimer.isPending || stopTimer.isPending}
							onClick={isTimerRunning ? handleStopTimer : handleStartTimer}
							size="sm"
							variant={isTimerRunning ? "destructive" : "default"}
						>
							{isTimerRunning ? (
								<>
									<Pause className="mr-2 h-4 w-4" />
									Stop
								</>
							) : (
								<>
									<Play className="mr-2 h-4 w-4" />
									Start
								</>
							)}
						</Button>
					</div>
				</div>
			</div>

			{/* Summary Section */}
			<div className="grid grid-cols-2 gap-4">
				<div className="rounded-lg border bg-card p-4">
					<div className="text-muted-foreground text-sm">Total Time</div>
					<div className="font-semibold text-2xl">
						{timeSummary ? formatDuration(timeSummary.totalTime) : "--"}
					</div>
				</div>
				<div className="rounded-lg border bg-card p-4">
					<div className="text-muted-foreground text-sm">Estimated</div>
					<div className="font-semibold text-2xl">
						{timeSummary?.estimatedTime
							? `${timeSummary.estimatedTime}h`
							: "--"}
					</div>
				</div>
			</div>

			{/* Time Entries List */}
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold">Time Entries</h3>
					<Dialog onOpenChange={setIsAddDialogOpen} open={isAddDialogOpen}>
						<DialogTrigger asChild>
							<Button size="sm" variant="outline">
								<Plus className="mr-2 h-4 w-4" />
								Add Entry
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Add Time Entry</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 pt-4">
								<div className="space-y-2">
									<Label htmlFor="duration">Duration (hours)</Label>
									<Input
										id="duration"
										min="0.01"
										onChange={(e) => setManualDuration(e.target.value)}
										placeholder="e.g., 2.5"
										step="0.25"
										type="number"
										value={manualDuration}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="description">Description (optional)</Label>
									<Textarea
										id="description"
										onChange={(e) => setManualDescription(e.target.value)}
										placeholder="What did you work on?"
										value={manualDescription}
									/>
								</div>
								<Button
									className="w-full"
									disabled={createEntry.isPending || !manualDuration}
									onClick={handleAddManualEntry}
								>
									<Plus className="mr-2 h-4 w-4" />
									Add Entry
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>

				{timeEntriesData?.timeEntries.length === 0 ? (
					<div className="rounded-lg border border-dashed p-8 text-center">
						<Clock className="mx-auto h-8 w-8 text-muted-foreground/50" />
						<p className="mt-2 text-muted-foreground text-sm">
							No time entries yet
						</p>
						<p className="text-muted-foreground text-xs">
							Start the timer or add entries manually
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{timeEntriesData?.timeEntries.map((entry) => (
							<div
								className={cn(
									"flex items-center justify-between rounded-lg border p-3",
									entry.isRunning && "border-primary bg-primary/5",
								)}
								key={entry.id}
							>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="font-medium">
											{formatDuration(entry.duration)}
										</span>
										{entry.isRunning && (
											<Badge className="text-xs" variant="default">
												Running
											</Badge>
										)}
									</div>
									{entry.description && (
										<p className="truncate text-muted-foreground text-sm">
											{entry.description}
										</p>
									)}
									<p className="text-muted-foreground text-xs">
										{formatTimeAgo(entry.startedAt)}
									</p>
								</div>
								<Button
									className="h-8 w-8 text-muted-foreground hover:text-destructive"
									disabled={entry.isRunning || deleteEntry.isPending}
									onClick={() => handleDeleteEntry(entry.id)}
									size="icon"
									variant="ghost"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
