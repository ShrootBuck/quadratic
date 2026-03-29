"use client";

import { format } from "date-fns";
import { ArrowLeft, Clock, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { api } from "~/trpc/react";

const _STATUS_COLORS: Record<string, string> = {
	Done: "#4EC9B0",
	"In Progress": "#5E6AD2",
	Todo: "#8A8F98",
	Cancelled: "#F87171",
};

const PRIORITY_COLORS: Record<string, string> = {
	urgent: "#EF4444",
	high: "#F97316",
	medium: "#EAB308",
	low: "#22C55E",
	none: "#6B7280",
};

export default function CycleAnalyticsPage() {
	const params = useParams();
	const cycleId = params.id as string;

	const { data: cycleData, isLoading: cycleLoading } =
		api.analytics.getCycleAnalytics.useQuery({ cycleId });

	const { data: velocityData } = api.analytics.getVelocityAnalytics.useQuery({
		workspaceId: "clz1234567890",
		limit: 10,
	});

	api.analytics.getIssueDistribution.useQuery({ cycleId });

	if (cycleLoading) {
		return (
			<div className="flex h-full flex-col">
				<div className="flex items-center gap-4 border-[#2A2F35] border-b p-4">
					<Link
						className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2A2F35] bg-[#16181D] text-[#8A8F98] hover:text-[#F7F8F8]"
						href={`/app/cycles/${cycleId}`}
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
					<h1 className="font-semibold text-[#F7F8F8] text-xl">Analytics</h1>
				</div>
				<div className="flex-1 space-y-4 p-6">
					<div className="h-20 animate-pulse rounded-lg bg-[#2A2F35]" />
					<div className="grid grid-cols-4 gap-4">
						{[1, 2, 3, 4].map((i) => (
							<div
								className="h-24 animate-pulse rounded-lg bg-[#2A2F35]"
								key={i}
							/>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (!cycleData) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-[#8A8F98]">Cycle not found</p>
			</div>
		);
	}

	const { cycle, summary, issuesByStatus } = cycleData;
	interface StatusData {
		name: string;
		value: number;
		color: string;
	}
	const pieData = issuesByStatus.filter((d: StatusData) => d.value > 0);
	const velocityChartData = velocityData?.cycles.slice(0, 6) ?? [];
	const avgCycleTime = cycleData.avgCycleTime;

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center gap-4 border-[#2A2F35] border-b p-4">
				<Link
					className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2A2F35] bg-[#16181D] text-[#8A8F98] hover:text-[#F7F8F8]"
					href={`/app/cycles/${cycleId}`}
				>
					<ArrowLeft className="h-4 w-4" />
				</Link>
				<div className="flex-1">
					<h1 className="font-semibold text-[#F7F8F8] text-xl">
						{cycle.name} - Analytics
					</h1>
					<p className="text-[#8A8F98] text-sm">
						{format(new Date(cycle.startDate), "MMM d")} -{" "}
						{format(new Date(cycle.endDate), "MMM d, yyyy")}
					</p>
				</div>
				<div
					className="rounded-full px-3 py-1 text-sm"
					style={{
						backgroundColor: `${cycle.team.color}20`,
						color: cycle.team.color,
					}}
				>
					{cycle.team.name}
				</div>
			</div>

			<div className="flex-1 overflow-auto p-6">
				<div className="grid grid-cols-2 gap-4 border-[#2A2F35] border-b p-6 md:grid-cols-4">
					<div>
						<p className="text-[#8A8F98] text-sm">Total Issues</p>
						<p className="mt-1 font-semibold text-2xl text-[#F7F8F8]">
							{summary.totalIssues}
						</p>
					</div>
					<div>
						<p className="text-[#8A8F98] text-sm">Completed</p>
						<p className="mt-1 font-semibold text-2xl text-[#4EC9B0]">
							{summary.completedIssues}
						</p>
					</div>
					<div>
						<p className="text-[#8A8F98] text-sm">In Progress</p>
						<p className="mt-1 font-semibold text-2xl text-[#5E6AD2]">
							{summary.inProgressIssues}
						</p>
					</div>
					<div>
						<p className="text-[#8A8F98] text-sm">Assignees</p>
						<p className="mt-1 font-semibold text-2xl text-[#F7F8F8]">
							{summary.uniqueAssignees}
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
					<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-4">
						<h3 className="mb-4 font-medium text-[#F7F8F8]">
							Issues Completed Over Time
						</h3>
						<div className="h-64">
							<ResponsiveContainer height="100%" width="100%">
								<AreaChart data={cycleData.completedByDay}>
									<defs>
										<linearGradient id="colorCount" x1="0" x2="0" y1="0" y2="1">
											<stop offset="5%" stopColor="#5E6AD2" stopOpacity={0.3} />
											<stop offset="95%" stopColor="#5E6AD2" stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid stroke="#2A2F35" strokeDasharray="3 3" />
									<XAxis
										dataKey="date"
										fontSize={10}
										stroke="#8A8F98"
										tickFormatter={(value) => format(new Date(value), "MMM d")}
									/>
									<YAxis fontSize={12} stroke="#8A8F98" />
									<Tooltip
										contentStyle={{
											backgroundColor: "#16181D",
											border: "1px solid #2A2F35",
											borderRadius: "8px",
										}}
										itemStyle={{ color: "#8A8F98" }}
										labelStyle={{ color: "#F7F8F8" }}
									/>
									<Area
										dataKey="count"
										fill="url(#colorCount)"
										fillOpacity={1}
										stroke="#5E6AD2"
										type="monotone"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</div>

					<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-4">
						<h3 className="mb-4 font-medium text-[#F7F8F8]">
							Issues by Status
						</h3>
						<div className="h-64">
							<ResponsiveContainer height="100%" width="100%">
								<PieChart>
									<Pie
										cx="50%"
										cy="50%"
										data={pieData}
										dataKey="value"
										innerRadius={60}
										label={({ name, percent }) =>
											`${name} ${((percent ?? 0) * 100).toFixed(0)}%`
										}
										labelLine={false}
										nameKey="name"
										outerRadius={80}
										paddingAngle={5}
									>
										{pieData.map((entry: StatusData) => (
											<Cell
												fill={entry.color}
												key={entry.name ?? Math.random()}
											/>
										))}
									</Pie>
									<Tooltip
										contentStyle={{
											backgroundColor: "#16181D",
											border: "1px solid #2A2F35",
											borderRadius: "8px",
										}}
										itemStyle={{ color: "#8A8F98" }}
										labelStyle={{ color: "#F7F8F8" }}
									/>
								</PieChart>
							</ResponsiveContainer>
						</div>
					</div>

					<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-4">
						<h3 className="mb-4 font-medium text-[#F7F8F8]">
							Velocity Comparison
						</h3>
						<div className="h-64">
							<ResponsiveContainer height="100%" width="100%">
								<BarChart data={velocityChartData}>
									<CartesianGrid stroke="#2A2F35" strokeDasharray="3 3" />
									<XAxis
										dataKey="name"
										fontSize={10}
										stroke="#8A8F98"
										tickFormatter={(value) =>
											String(value).split(" ")[1] ?? String(value)
										}
									/>
									<YAxis fontSize={12} stroke="#8A8F98" />
									<Tooltip
										contentStyle={{
											backgroundColor: "#16181D",
											border: "1px solid #2A2F35",
											borderRadius: "8px",
										}}
										itemStyle={{ color: "#8A8F98" }}
										labelStyle={{ color: "#F7F8F8" }}
									/>
									<Bar
										dataKey="completedIssues"
										fill="#5E6AD2"
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>

					<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-4">
						<h3 className="mb-4 font-medium text-[#F7F8F8]">Completion Rate</h3>
						<div className="flex items-center justify-center">
							<div className="relative h-32 w-32">
								<svg
									aria-label="Completion rate circle chart"
									className="h-full w-full"
									role="img"
									viewBox="0 0 100 100"
								>
									<circle
										cx="50"
										cy="50"
										fill="none"
										r="45"
										stroke="#2A2F35"
										strokeWidth="10"
									/>
									<circle
										cx="50"
										cy="50"
										fill="none"
										r="45"
										stroke="#4EC9B0"
										strokeDasharray={`${summary.completionRate * 2.83} 283`}
										strokeLinecap="round"
										strokeWidth="10"
										transform="rotate(-90 50 50)"
									/>
								</svg>
								<div className="absolute inset-0 flex items-center justify-center">
									<span className="font-bold text-2xl text-[#F7F8F8]">
										{summary.completionRate}%
									</span>
								</div>
							</div>
						</div>
					</div>

					<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-4">
						<h3 className="mb-4 font-medium text-[#F7F8F8]">
							Priority Distribution
						</h3>
						<div className="space-y-3">
							{Object.entries(cycleData.priorityDistribution).map(
								([priority, count]) => {
									const color =
										PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS];
									return (
										<div key={priority}>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<div
														className="h-3 w-3 rounded-full"
														style={{ backgroundColor: color }}
													/>
													<span className="text-[#F7F8F8] text-sm">
														{priority === "none"
															? "No Priority"
															: priority.charAt(0).toUpperCase() +
																priority.slice(1)}
													</span>
												</div>
												<span className="text-[#8A8F98] text-sm">
													{count as number}
												</span>
											</div>
											<div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#2A2F35]">
												<div
													className="h-full rounded-full"
													style={{
														width: `${((count as number) / summary.totalIssues) * 100}%`,
														backgroundColor: color,
													}}
												/>
											</div>
										</div>
									);
								},
							)}
						</div>
					</div>

					<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-4">
						<h3 className="mb-4 font-medium text-[#F7F8F8]">
							Average Cycle Time
						</h3>
						<div className="flex items-center justify-center">
							<div className="text-center">
								<div className="flex items-center justify-center gap-2">
									<Clock className="h-8 w-8 text-[#5E6AD2]" />
									<span className="font-bold text-4xl text-[#F7F8F8]">
										{avgCycleTime}
									</span>
								</div>
								<p className="mt-2 text-[#8A8F98] text-sm">days average</p>
							</div>
						</div>
					</div>
				</div>

				{velocityData?.summary && (
					<div className="grid grid-cols-3 gap-4 border-[#2A2F35] border-t p-6">
						<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-4">
							<div className="flex items-center gap-2 text-[#8A8F98]">
								<TrendingUp className="h-4 w-4" />
								<span className="text-sm">Current Velocity</span>
							</div>
							<p className="mt-2 font-semibold text-2xl text-[#F7F8F8]">
								{velocityData.summary.currentVelocity}
							</p>
							{velocityData.summary.velocityChange !== 0 && (
								<p
									className={`text-sm ${
										velocityData.summary.velocityChange > 0
											? "text-[#4EC9B0]"
											: "text-[#F87171]"
									}`}
								>
									{velocityData.summary.velocityChange > 0 ? "+" : ""}
									{velocityData.summary.velocityChange}% vs last cycle
								</p>
							)}
						</div>
						<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-4">
							<div className="flex items-center gap-2 text-[#8A8F98]">
								<TrendingUp className="h-4 w-4" />
								<span className="text-sm">Average Velocity</span>
							</div>
							<p className="mt-2 font-semibold text-2xl text-[#F7F8F8]">
								{velocityData.summary.avgVelocity}
							</p>
							<p className="text-[#8A8F98] text-sm">issues per cycle</p>
						</div>
						<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-4">
							<div className="flex items-center gap-2 text-[#8A8F98]">
								<Users className="h-4 w-4" />
								<span className="text-sm">Total Cycles</span>
							</div>
							<p className="mt-2 font-semibold text-2xl text-[#F7F8F8]">
								{velocityData.summary.totalCycles}
							</p>
							<p className="text-[#8A8F98] text-sm">completed</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
