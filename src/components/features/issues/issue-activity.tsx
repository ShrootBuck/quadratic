"use client";

import { formatDistanceToNow } from "date-fns";
import { History, MessageSquare, Plus, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HistoryItem {
	id: string;
	field: string;
	oldValue: string | null;
	newValue: string;
	createdAt: Date;
	actor: {
		id: string;
		name: string | null;
		image: string | null;
	};
}

interface IssueActivityProps {
	history: HistoryItem[];
}

function getActivityIcon(field: string) {
	switch (field) {
		case "created":
			return Plus;
		case "comment":
			return MessageSquare;
		default:
			return History;
	}
}

function formatActivityText(
	field: string,
	newValue: string,
	oldValue: string | null,
) {
	switch (field) {
		case "created":
			return "created this issue";
		case "comment":
			return "added a comment";
		case "status": {
			const value = JSON.parse(newValue).value;
			return `changed status to ${value}`;
		}
		case "priority": {
			const value = JSON.parse(newValue).value;
			return `changed priority to ${value}`;
		}
		case "assigneeId": {
			const value = JSON.parse(newValue).value;
			if (value === "null") {
				return "removed assignee";
			}
			return "changed assignee";
		}
		case "title": {
			return "changed the title";
		}
		case "projectId": {
			const value = JSON.parse(newValue).value;
			if (value === "null") {
				return "removed from project";
			}
			return "changed project";
		}
		case "cycleId": {
			const value = JSON.parse(newValue).value;
			if (value === "null") {
				return "removed from cycle";
			}
			return "changed cycle";
		}
		default:
			return `changed ${field}`;
	}
}

export function IssueActivity({ history }: IssueActivityProps) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<History className="h-5 w-5 text-[#8A8F98]" />
				<h3 className="font-semibold text-[#F7F8F8]">Activity</h3>
			</div>

			<div className="space-y-3">
				{history.map((item) => {
					const Icon = getActivityIcon(item.field);
					return (
						<div className="flex gap-3" key={item.id}>
							<div className="relative">
								<Avatar className="h-8 w-8 shrink-0">
									<AvatarImage src={item.actor.image ?? undefined} />
									<AvatarFallback className="bg-[#5E6AD2] text-white text-xs">
										{item.actor.name?.charAt(0).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="absolute -right-1 -bottom-1 rounded-full bg-[#2A2F35] p-1">
									<Icon className="h-3 w-3 text-[#8A8F98]" />
								</div>
							</div>
							<div className="flex-1 space-y-1">
								<div className="flex items-center gap-2">
									<span className="font-medium text-[#F7F8F8] text-sm">
										{item.actor.name}
									</span>
									<span className="text-[#8A8F98] text-sm">
										{formatActivityText(
											item.field,
											item.newValue,
											item.oldValue,
										)}
									</span>
								</div>
								<span className="text-[#8A8F98] text-xs">
									{formatDistanceToNow(new Date(item.createdAt), {
										addSuffix: true,
									})}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
