import {
	Calendar,
	FileQuestion,
	FolderOpen,
	Inbox,
	type LucideIcon,
	Search,
	Settings,
	Tag,
	Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
	title: string;
	description?: string;
	icon?: LucideIcon;
	action?: {
		label: string;
		onClick: () => void;
	};
	secondaryAction?: {
		label: string;
		onClick: () => void;
	};
	className?: string;
}

function EmptyState({
	title,
	description,
	icon: IconProp,
	action,
	secondaryAction,
	className,
}: EmptyStateProps) {
	const Icon = IconProp || FileQuestion;

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center rounded-lg border border-[#2A2F35] border-dashed bg-[#0F1115] p-12 text-center",
				className,
			)}
		>
			<div className="mb-4 rounded-full bg-[#1A1D21] p-4">
				<Icon className="h-8 w-8 text-[#8A8F98]" />
			</div>
			<h3 className="mb-2 font-medium text-[#F7F8F8] text-lg">{title}</h3>
			{description && (
				<p className="mb-6 max-w-sm text-[#8A8F98] text-sm">{description}</p>
			)}
			<div className="flex gap-3">
				{action && (
					<Button
						className="gap-2 bg-[#5E6AD2] hover:bg-[#5E6AD2]/90"
						onClick={action.onClick}
					>
						{action.label}
					</Button>
				)}
				{secondaryAction && (
					<Button onClick={secondaryAction.onClick} variant="outline">
						{secondaryAction.label}
					</Button>
				)}
			</div>
		</div>
	);
}

// Pre-configured empty states for common use cases
function EmptyIssues({ onCreate }: { onCreate?: () => void }) {
	return (
		<EmptyState
			action={
				onCreate
					? {
							label: "Create Issue",
							onClick: onCreate,
						}
					: undefined
			}
			description="Get started by creating your first issue to track work and collaborate with your team."
			icon={Inbox}
			title="No issues yet"
		/>
	);
}

function EmptyProjects({ onCreate }: { onCreate?: () => void }) {
	return (
		<EmptyState
			action={
				onCreate
					? {
							label: "Create Project",
							onClick: onCreate,
						}
					: undefined
			}
			description="Create a project to organize and track issues across your team."
			icon={FolderOpen}
			title="No projects yet"
		/>
	);
}

function EmptyTeams({ onCreate }: { onCreate?: () => void }) {
	return (
		<EmptyState
			action={
				onCreate
					? {
							label: "Create Team",
							onClick: onCreate,
						}
					: undefined
			}
			description="Create a team to organize members and track work together."
			icon={Users}
			title="No teams yet"
		/>
	);
}

function EmptyCycles({ onCreate }: { onCreate?: () => void }) {
	return (
		<EmptyState
			action={
				onCreate
					? {
							label: "Create Cycle",
							onClick: onCreate,
						}
					: undefined
			}
			description="Create a cycle to plan and track work in sprints."
			icon={Calendar}
			title="No cycles yet"
		/>
	);
}

function EmptyLabels({ onCreate }: { onCreate?: () => void }) {
	return (
		<EmptyState
			action={
				onCreate
					? {
							label: "Create Label",
							onClick: onCreate,
						}
					: undefined
			}
			description="Create labels to categorize and filter issues."
			icon={Tag}
			title="No labels yet"
		/>
	);
}

function EmptySearch({
	query,
	onClear,
}: {
	query: string;
	onClear: () => void;
}) {
	return (
		<EmptyState
			action={{
				label: "Clear Search",
				onClick: onClear,
			}}
			description={`We couldn't find anything matching "${query}". Try adjusting your search terms.`}
			icon={Search}
			title="No results found"
		/>
	);
}

function EmptyNotifications() {
	return (
		<EmptyState
			className="border-none bg-transparent"
			description="You're all caught up! Notifications will appear here when there's activity."
			icon={Inbox}
			title="No notifications"
		/>
	);
}

export {
	EmptyCycles,
	EmptyIssues,
	EmptyLabels,
	EmptyNotifications,
	EmptyProjects,
	EmptySearch,
	EmptyState,
	EmptyTeams,
};
