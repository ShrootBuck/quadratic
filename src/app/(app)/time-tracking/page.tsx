"use client";

import { Calendar, Clock, Download, FolderKanban, Users } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { formatDuration } from "~/lib/time";
import { api } from "~/trpc/react";

export default function TimeTrackingReportPage() {
	const [startDate, setStartDate] = useState(() => {
		const date = new Date();
		date.setDate(date.getDate() - 30);
		return date.toISOString().split("T")[0];
	});
	const [endDate, setEndDate] = useState(() => {
		return new Date().toISOString().split("T")[0];
	});
	const [workspaceId, _setWorkspaceId] = useState("");

	// Get user's workspaces
	const { data: workspaces } = api.workspace.list.useQuery();

	// Use first workspace as default
	const activeWorkspaceId = workspaceId || workspaces?.[0]?.id;

	const { data: report, isLoading } = api.timeTracking.getReport.useQuery(
		{
			workspaceId: activeWorkspaceId || "",
			startDate: startDate ? new Date(startDate) : new Date(),
			endDate: endDate ? new Date(endDate) : new Date(),
		},
		{ enabled: !!activeWorkspaceId && !!startDate && !!endDate },
	);

	const { data: csvData } = api.timeTracking.exportToCSV.useQuery(
		{
			workspaceId: activeWorkspaceId || "",
			startDate: startDate ? new Date(startDate) : new Date(),
			endDate: endDate ? new Date(endDate) : new Date(),
		},
		{ enabled: !!activeWorkspaceId && !!startDate && !!endDate },
	);

	const handleExportCSV = () => {
		if (!csvData) return;
		const blob = new Blob([csvData], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `time-report-${startDate}-to-${endDate}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	};

	return (
		<div className="container mx-auto max-w-6xl space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Time Tracking Report
					</h1>
					<p className="text-muted-foreground">
						View and export time tracking data
					</p>
				</div>
				<Button disabled={!csvData} onClick={handleExportCSV}>
					<Download className="mr-2 h-4 w-4" />
					Export CSV
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Filter</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="start-date">Start Date</Label>
							<Input
								id="start-date"
								onChange={(e) => setStartDate(e.target.value)}
								type="date"
								value={startDate}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="end-date">End Date</Label>
							<Input
								id="end-date"
								onChange={(e) => setEndDate(e.target.value)}
								type="date"
								value={endDate}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{isLoading ? (
				<div className="flex h-64 items-center justify-center">
					<div className="text-muted-foreground">Loading report...</div>
				</div>
			) : report ? (
				<>
					{/* Summary Cards */}
					<div className="grid grid-cols-4 gap-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									Total Time
								</CardTitle>
								<Clock className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{formatDuration(report.totalDuration)}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">Entries</CardTitle>
								<Calendar className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">{report.entryCount}</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									Contributors
								</CardTitle>
								<Users className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">{report.byUser.length}</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">Issues</CardTitle>
								<FolderKanban className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{report.byIssue.length}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* By User */}
					<Card>
						<CardHeader>
							<CardTitle>Time by User</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{report.byUser.map((user) => (
									<div
										className="flex items-center justify-between"
										key={user.user.id}
									>
										<div className="flex items-center gap-3">
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-medium text-sm">
												{user.user.name?.charAt(0).toUpperCase()}
											</div>
											<span>{user.user.name}</span>
										</div>
										<div className="flex items-center gap-4">
											<span className="text-muted-foreground text-sm">
												{user.entryCount} entries
											</span>
											<span className="font-medium">
												{formatDuration(user.totalDuration)}
											</span>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* By Issue */}
					<Card>
						<CardHeader>
							<CardTitle>Time by Issue</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{report.byIssue.map((issue) => (
									<div
										className="flex items-center justify-between"
										key={issue.issue.id}
									>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<span className="text-muted-foreground text-sm">
													{issue.issue.identifier}
												</span>
												<span className="truncate">{issue.issue.title}</span>
											</div>
										</div>
										<div className="flex items-center gap-4">
											<span className="text-muted-foreground text-sm">
												{issue.entryCount} entries
											</span>
											<span className="font-medium">
												{formatDuration(issue.totalDuration)}
											</span>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</>
			) : (
				<div className="flex h-64 items-center justify-center">
					<div className="text-muted-foreground">
						Select a workspace to view reports
					</div>
				</div>
			)}
		</div>
	);
}
