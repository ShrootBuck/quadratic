"use client";

import {
	AlertCircle,
	Bell,
	CheckCheck,
	Inbox,
	MessageSquare,
	Tag,
	User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { NOTIFICATIONS_LIMIT, SESSION_CLEANUP_INTERVAL_MS } from "~/constants";
import { api } from "~/trpc/react";
import type { NotificationType } from "../../../generated/prisma";

interface NotificationDropdownProps {
	workspaceId: string;
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
	ASSIGNED: <User className="h-4 w-4" />,
	MENTIONED: <Tag className="h-4 w-4" />,
	STATUS_CHANGED: <AlertCircle className="h-4 w-4" />,
	COMMENTED: <MessageSquare className="h-4 w-4" />,
	ISSUE_CREATED: <Inbox className="h-4 w-4" />,
	CYCLE_STARTED: <AlertCircle className="h-4 w-4" />,
	CYCLE_ENDED: <AlertCircle className="h-4 w-4" />,
};

const notificationColors: Record<NotificationType, string> = {
	ASSIGNED: "bg-[#5E6AD2]",
	MENTIONED: "bg-[#F59E0B]",
	STATUS_CHANGED: "bg-[#8A8F98]",
	COMMENTED: "bg-[#4EC9B0]",
	ISSUE_CREATED: "bg-[#5E6AD2]",
	CYCLE_STARTED: "bg-[#5E6AD2]",
	CYCLE_ENDED: "bg-[#8A8F98]",
};

export function NotificationDropdown({
	workspaceId,
}: NotificationDropdownProps) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);

	// Get unread count for badge
	const { data: unreadCount = 0, refetch: refetchUnreadCount } =
		api.notification.getUnreadCount.useQuery(
			{ workspaceId },
			{ refetchInterval: SESSION_CLEANUP_INTERVAL_MS }, // Poll every 30 seconds
		);

	// Get notifications list
	const { data: notificationsData, refetch: refetchNotifications } =
		api.notification.list.useQuery(
			{ workspaceId, limit: NOTIFICATIONS_LIMIT, unreadOnly: false },
			{ enabled: isOpen },
		);

	// Mutations
	const markAsRead = api.notification.markAsRead.useMutation({
		onSuccess: () => {
			refetchUnreadCount();
			refetchNotifications();
		},
	});

	const markAllAsRead = api.notification.markAllAsRead.useMutation({
		onSuccess: () => {
			refetchUnreadCount();
			refetchNotifications();
		},
	});

	// Handle notification click
	const handleNotificationClick = async (notification: {
		id: string;
		read: boolean;
		issueId: string | null;
	}) => {
		if (!notification.read) {
			await markAsRead.mutateAsync({ id: notification.id });
		}

		if (notification.issueId) {
			router.push(`/issues/${notification.issueId}`);
		}

		setIsOpen(false);
	};

	// Format relative time
	const formatTimeAgo = (date: Date) => {
		const now = new Date();
		const diff = now.getTime() - new Date(date).getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return "Just now";
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return new Date(date).toLocaleDateString();
	};

	const notifications = notificationsData?.notifications ?? [];

	return (
		<DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
					className="relative h-9 w-9 text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
					size="icon"
					variant="ghost"
				>
					<Bell aria-hidden="true" className="h-4 w-4" />
					{unreadCount > 0 && (
						<span
							aria-hidden="true"
							className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#5E6AD2] font-medium text-[10px] text-white"
						>
							{unreadCount > 99 ? "99+" : unreadCount}
						</span>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-96 border-[#2A2F35] bg-[#16181D] p-0"
				forceMount
			>
				<div className="flex items-center justify-between border-[#2A2F35] border-b p-3">
					<DropdownMenuLabel className="p-0 font-medium text-[#F7F8F8]">
						Notifications
					</DropdownMenuLabel>
					{unreadCount > 0 && (
						<Button
							className="h-7 gap-1 text-[#8A8F98] text-xs hover:text-[#F7F8F8]"
							onClick={() => markAllAsRead.mutate({ workspaceId })}
							size="sm"
							variant="ghost"
						>
							<CheckCheck className="h-3.5 w-3.5" />
							Mark all read
						</Button>
					)}
				</div>

				<ScrollArea className="h-[400px]">
					{notifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-[#8A8F98]">
							<Inbox className="mb-3 h-10 w-10 opacity-50" />
							<p className="text-sm">No notifications</p>
							<p className="text-xs opacity-70">You're all caught up!</p>
						</div>
					) : (
						<div className="py-1">
							{notifications.map((notification) => (
								<DropdownMenuItem
									className={cn(
										"flex cursor-pointer items-start gap-3 border-[#2A2F35] border-b px-3 py-3 last:border-b-0",
										!notification.read && "bg-[#5E6AD2]/5",
									)}
									key={notification.id}
									onClick={() => handleNotificationClick(notification)}
								>
									{/* Icon/Avatar */}
									<div className="flex-shrink-0">
										{notification.actor ? (
											<Avatar className="h-8 w-8">
												<AvatarImage
													alt={notification.actor.name || ""}
													src={notification.actor.image || undefined}
												/>
												<AvatarFallback className="bg-[#5E6AD2] text-white text-xs">
													{notification.actor.name?.charAt(0).toUpperCase() ||
														"U"}
												</AvatarFallback>
											</Avatar>
										) : (
											<div
												className={cn(
													"flex h-8 w-8 items-center justify-center rounded-full",
													notificationColors[notification.type],
												)}
											>
												<span className="text-white">
													{notificationIcons[notification.type]}
												</span>
											</div>
										)}
									</div>

									{/* Content */}
									<div className="min-w-0 flex-1">
										<p className="text-[#F7F8F8] text-sm">
											<span className="font-medium">
												{notification.actor?.name || "System"}
											</span>{" "}
											{notification.title}
										</p>
										{notification.content && (
											<p className="mt-0.5 truncate text-[#8A8F98] text-xs">
												{notification.content}
											</p>
										)}
										{notification.issue && (
											<p className="mt-1 text-[#5E6AD2] text-xs">
												{notification.issue.team.key}-
												{notification.issue.number}
											</p>
										)}
										<p className="mt-1 text-[#8A8F98] text-xs">
											{formatTimeAgo(notification.createdAt)}
										</p>
									</div>

									{/* Unread indicator */}
									{!notification.read && (
										<div className="flex-shrink-0">
											<div className="h-2 w-2 rounded-full bg-[#5E6AD2]" />
										</div>
									)}
								</DropdownMenuItem>
							))}
						</div>
					)}
				</ScrollArea>

				<DropdownMenuSeparator className="bg-[#2A2F35]" />
				<DropdownMenuItem
					className="cursor-pointer justify-center text-[#8A8F98] text-xs hover:text-[#F7F8F8]"
					onClick={() => {
						router.push("/settings/notifications");
						setIsOpen(false);
					}}
				>
					Notification preferences
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
