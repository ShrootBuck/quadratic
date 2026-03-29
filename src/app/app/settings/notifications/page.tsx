"use client";

import {
	Check,
	Loader2,
	MessageSquare,
	RefreshCcw,
	UserCheck,
	UserPlus,
} from "lucide-react";
import { api } from "~/trpc/react";

interface NotificationPreference {
	id: string;
	name: string;
	description: string;
	icon: typeof UserCheck;
	key:
		| "notifyOnAssign"
		| "notifyOnMention"
		| "notifyOnStatusChange"
		| "notifyOnComment"
		| "notifyOnIssueCreated"
		| "notifyOnCycleStart"
		| "notifyOnCycleEnd";
}

const preferences: NotificationPreference[] = [
	{
		id: "assign",
		name: "Issue Assignments",
		description: "When an issue is assigned to you",
		icon: UserCheck,
		key: "notifyOnAssign",
	},
	{
		id: "mention",
		name: "Mentions",
		description: "When you are mentioned in a comment or description",
		icon: UserPlus,
		key: "notifyOnMention",
	},
	{
		id: "status",
		name: "Status Changes",
		description: "When an issue you are assigned to changes status",
		icon: RefreshCcw,
		key: "notifyOnStatusChange",
	},
	{
		id: "comment",
		name: "Comments",
		description: "When someone comments on an issue you are watching",
		icon: MessageSquare,
		key: "notifyOnComment",
	},
	{
		id: "issue-created",
		name: "New Issues",
		description: "When a new issue is created in your teams",
		icon: UserPlus,
		key: "notifyOnIssueCreated",
	},
	{
		id: "cycle-start",
		name: "Cycle Started",
		description: "When a cycle starts",
		icon: RefreshCcw,
		key: "notifyOnCycleStart",
	},
	{
		id: "cycle-end",
		name: "Cycle Ended",
		description: "When a cycle ends",
		icon: RefreshCcw,
		key: "notifyOnCycleEnd",
	},
];

export default function NotificationSettingsPage() {
	const { data: workspace } = api.workspace.getCurrent.useQuery();
	const { data: notificationPrefs, isLoading } =
		api.notification.getPreferences.useQuery(
			{
				workspaceId: workspace?.id ?? "",
			},
			{
				enabled: !!workspace?.id,
			},
		);
	const utils = api.useUtils();

	const updatePreferences = api.notification.updatePreferences.useMutation({
		onSuccess: () => {
			if (workspace?.id) {
				utils.notification.getPreferences.invalidate({
					workspaceId: workspace.id,
				});
			}
		},
	});

	const handleToggle = (key: NotificationPreference["key"]) => {
		if (!workspace?.id || !notificationPrefs) return;

		const currentValue = notificationPrefs[key];
		updatePreferences.mutate({
			workspaceId: workspace.id,
			[key]: !currentValue,
		});
	};

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5E6AD2] border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl p-8">
			<div className="mb-8">
				<h1 className="mb-2 font-semibold text-2xl text-[#F7F8F8]">
					Notifications
				</h1>
				<p className="text-[#8A8F98]">
					Choose what notifications you want to receive
				</p>
			</div>

			<div className="space-y-4">
				{preferences.map((pref) => {
					const Icon = pref.icon;
					const isEnabled = notificationPrefs?.[pref.key] ?? false;
					const isUpdating =
						updatePreferences.isPending &&
						updatePreferences.variables?.[pref.key] !== undefined;

					return (
						<div
							className="flex items-center justify-between rounded-lg border border-[#2A2F35] bg-[#16181D] p-4"
							key={pref.id}
						>
							<div className="flex items-center gap-4">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2A2F35]">
									<Icon className="h-5 w-5 text-[#8A8F98]" />
								</div>
								<div>
									<p className="font-medium text-[#F7F8F8]">{pref.name}</p>
									<p className="text-[#8A8F98] text-sm">{pref.description}</p>
								</div>
							</div>

							<button
								className={`relative h-6 w-11 rounded-full transition-colors ${
									isEnabled ? "bg-[#5E6AD2]" : "bg-[#2A2F35]"
								}`}
								disabled={isUpdating}
								onClick={() => handleToggle(pref.key)}
								type="button"
							>
								<span
									className={`absolute top-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white transition-transform ${
										isEnabled ? "translate-x-5" : "translate-x-0"
									}`}
								>
									{isUpdating ? (
										<Loader2 className="h-3 w-3 animate-spin text-[#2A2F35]" />
									) : isEnabled ? (
										<Check className="h-3 w-3 text-[#5E6AD2]" />
									) : null}
								</span>
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
}
