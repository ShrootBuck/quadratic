"use client";

import {
	ChevronLeft,
	ChevronRight,
	FolderKanban,
	LayoutGrid,
	ListTodo,
	Plus,
	RotateCcw,
	Settings,
	Tag,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarProps {
	className?: string;
}

const mainNavItems = [
	{
		name: "Issues",
		href: "/app/issues",
		icon: ListTodo,
		shortcut: "G I",
	},
	{
		name: "Projects",
		href: "/app/projects",
		icon: FolderKanban,
		shortcut: "G P",
	},
	{
		name: "Cycles",
		href: "/app/cycles",
		icon: RotateCcw,
		shortcut: "G C",
	},
];

const secondaryNavItems = [
	{
		name: "Teams",
		href: "/app/teams",
		icon: Users,
	},
	{
		name: "Labels",
		href: "/app/labels",
		icon: Tag,
	},
	{
		name: "Settings",
		href: "/app/settings",
		icon: Settings,
	},
];

// Mock data - will be replaced with real data from API
const mockTeams = [
	{ id: "1", name: "Engineering", key: "ENG", color: "#5E6AD2" },
	{ id: "2", name: "Design", key: "DES", color: "#F87171" },
];

export function Sidebar({ className }: SidebarProps) {
	const pathname = usePathname();
	const [collapsed, setCollapsed] = useState(false);

	return (
		<TooltipProvider delayDuration={0}>
			<div
				className={cn(
					"flex flex-col border-[#2A2F35] border-r bg-[#0F1115] transition-all duration-300",
					collapsed ? "w-16" : "w-64",
					className,
				)}
			>
				{/* Header */}
				<div className="flex h-14 items-center justify-between border-[#2A2F35] border-b px-4">
					{!collapsed ? (
						<Link
							className="flex items-center gap-2 text-[#F7F8F8]"
							href="/app"
						>
							<div className="flex h-6 w-6 items-center justify-center rounded bg-[#5E6AD2]">
								<LayoutGrid className="h-4 w-4 text-white" />
							</div>
							<span className="font-semibold">Quadratic</span>
						</Link>
					) : (
						<Tooltip>
							<TooltipTrigger asChild>
								<Link
									className="flex h-6 w-6 items-center justify-center rounded bg-[#5E6AD2]"
									href="/app"
								>
									<LayoutGrid className="h-4 w-4 text-white" />
								</Link>
							</TooltipTrigger>
							<TooltipContent side="right">
								<p>Quadratic</p>
							</TooltipContent>
						</Tooltip>
					)}
					<Button
						className="h-8 w-8 text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
						onClick={() => setCollapsed(!collapsed)}
						size="icon"
						variant="ghost"
					>
						{collapsed ? (
							<ChevronRight className="h-4 w-4" />
						) : (
							<ChevronLeft className="h-4 w-4" />
						)}
					</Button>
				</div>

				{/* Navigation */}
				<ScrollArea className="flex-1 px-3 py-4">
					<div className="space-y-1">
						{mainNavItems.map((item) => {
							const Icon = item.icon;
							const isActive =
								pathname === item.href || pathname.startsWith(`${item.href}/`);

							return collapsed ? (
								<Tooltip key={item.name}>
									<TooltipTrigger asChild>
										<Link
											className={cn(
												"flex h-9 w-9 items-center justify-center rounded-md transition-colors",
												isActive
													? "bg-[#5E6AD2] text-white"
													: "text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]",
											)}
											href={item.href}
										>
											<Icon className="h-4 w-4" />
										</Link>
									</TooltipTrigger>
									<TooltipContent side="right">
										<p>
											{item.name} {item.shortcut && `(${item.shortcut})`}
										</p>
									</TooltipContent>
								</Tooltip>
							) : (
								<Link
									className={cn(
										"flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
										isActive
											? "bg-[#5E6AD2] text-white"
											: "text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]",
									)}
									href={item.href}
									key={item.name}
								>
									<Icon className="h-4 w-4" />
									<span className="flex-1">{item.name}</span>
									{item.shortcut && (
										<span className="text-[#8A8F98] text-xs">
											{item.shortcut}
										</span>
									)}
								</Link>
							);
						})}
					</div>

					{!collapsed && <Separator className="my-4 bg-[#2A2F35]" />}
					{collapsed && <div className="my-4 h-px bg-[#2A2F35]" />}

					{/* Teams Section */}
					{!collapsed && (
						<div className="mb-2">
							<div className="mb-2 flex items-center justify-between px-3">
								<span className="font-medium text-[#8A8F98] text-xs">
									Teams
								</span>
								<Button
									className="h-5 w-5 text-[#8A8F98] hover:text-[#F7F8F8]"
									size="icon"
									variant="ghost"
								>
									<Plus className="h-3 w-3" />
								</Button>
							</div>
							<div className="space-y-1">
								{mockTeams.map((team) => (
									<Link
										className={cn(
											"flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
											pathname === `/app/teams/${team.id}`
												? "bg-[#2A2F35] text-[#F7F8F8]"
												: "text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]",
										)}
										href={`/app/teams/${team.id}`}
										key={team.id}
									>
										<div
											className="h-2 w-2 rounded-full"
											style={{ backgroundColor: team.color }}
										/>
										<span className="flex-1">{team.name}</span>
										<span className="text-[#8A8F98] text-xs">{team.key}</span>
									</Link>
								))}
							</div>
						</div>
					)}

					{!collapsed && <Separator className="my-4 bg-[#2A2F35]" />}
					{collapsed && <div className="my-4 h-px bg-[#2A2F35]" />}

					{/* Secondary Navigation */}
					<div className="space-y-1">
						{secondaryNavItems.map((item) => {
							const Icon = item.icon;
							const isActive =
								pathname === item.href || pathname.startsWith(`${item.href}/`);

							return collapsed ? (
								<Tooltip key={item.name}>
									<TooltipTrigger asChild>
										<Link
											className={cn(
												"flex h-9 w-9 items-center justify-center rounded-md transition-colors",
												isActive
													? "bg-[#2A2F35] text-[#F7F8F8]"
													: "text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]",
											)}
											href={item.href}
										>
											<Icon className="h-4 w-4" />
										</Link>
									</TooltipTrigger>
									<TooltipContent side="right">
										<p>{item.name}</p>
									</TooltipContent>
								</Tooltip>
							) : (
								<Link
									className={cn(
										"flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
										isActive
											? "bg-[#2A2F35] text-[#F7F8F8]"
											: "text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]",
									)}
									href={item.href}
									key={item.name}
								>
									<Icon className="h-4 w-4" />
									<span>{item.name}</span>
								</Link>
							);
						})}
					</div>
				</ScrollArea>
			</div>
		</TooltipProvider>
	);
}
