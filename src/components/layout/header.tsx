"use client";

import { Command, LogOut, Search, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { NotificationDropdown } from "@/components/notifications";
import { ConnectionStatusIndicator } from "@/components/realtime/connection-status";
import { useRealtimeContext } from "@/components/realtime/realtime-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeaderProps {
	user: {
		name?: string | null;
		email?: string | null;
		image?: string | null;
	};
	workspaceId: string;
	onSearchClick?: () => void;
	onSignOut?: () => void;
}

export function Header({
	user,
	workspaceId,
	onSearchClick,
	onSignOut,
}: HeaderProps) {
	const router = useRouter();

	return (
		<TooltipProvider delayDuration={0}>
			<header className="flex h-14 items-center justify-between border-[#2A2F35] border-b bg-[#0F1115] px-4">
				{/* Left side - Search */}
				<div className="flex items-center gap-4">
					<Button
						className="h-9 w-64 justify-start gap-2 border-[#2A2F35] bg-[#16181D] text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
						onClick={onSearchClick}
						variant="outline"
					>
						<Search className="h-4 w-4" />
						<span className="text-sm">Search...</span>
						<kbd className="ml-auto hidden rounded border border-[#2A2F35] bg-[#0F1115] px-1.5 font-mono text-[#8A8F98] text-xs sm:inline-block">
							<span className="text-xs">⌘</span>K
						</kbd>
					</Button>
				</div>

				{/* Right side - Actions and User */}
				<div className="flex items-center gap-2">
					{/* Keyboard Shortcuts Help */}
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="h-9 w-9 text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
								onClick={() => router.push("/app/shortcuts")}
								size="icon"
								variant="ghost"
							>
								<Command className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Keyboard shortcuts (?)</p>
						</TooltipContent>
					</Tooltip>

					{/* Notifications */}
					<NotificationDropdown workspaceId={workspaceId} />

					{/* Connection Status */}
					<ConnectionStatusIndicator
						className="mr-2"
						status={useRealtimeContext().status}
					/>

					{/* User Menu */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className="relative h-9 w-9 rounded-full" variant="ghost">
								<Avatar className="h-8 w-8">
									<AvatarImage
										alt={user.name || "User"}
										src={user.image || undefined}
									/>
									<AvatarFallback className="bg-[#5E6AD2] text-white">
										{user.name?.charAt(0).toUpperCase() || "U"}
									</AvatarFallback>
								</Avatar>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-56 border-[#2A2F35] bg-[#16181D] text-[#F7F8F8]"
							forceMount
						>
							<DropdownMenuLabel className="font-normal">
								<div className="flex flex-col space-y-1">
									<p className="font-medium text-sm">{user.name}</p>
									<p className="text-[#8A8F98] text-xs">{user.email}</p>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator className="bg-[#2A2F35]" />
							<DropdownMenuItem
								className="cursor-pointer text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
								onClick={() => router.push("/app/settings/profile")}
							>
								<User className="mr-2 h-4 w-4" />
								Profile
							</DropdownMenuItem>
							<DropdownMenuItem
								className="cursor-pointer text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
								onClick={() => router.push("/app/settings")}
							>
								<Settings className="mr-2 h-4 w-4" />
								Settings
							</DropdownMenuItem>
							<DropdownMenuSeparator className="bg-[#2A2F35]" />
							<DropdownMenuItem
								className="cursor-pointer text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
								onClick={onSignOut}
							>
								<LogOut className="mr-2 h-4 w-4" />
								Log out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</header>
		</TooltipProvider>
	);
}
