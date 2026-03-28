"use client";

import {
	FileText,
	FolderKanban,
	Home,
	Plus,
	RotateCcw,
	Settings,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "@/components/ui/command";

interface CommandPaletteProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

// Mock data for demo
const recentItems = [
	{ id: "1", title: "ENG-123: Fix login bug", type: "issue" },
	{ id: "2", title: "Mobile App", type: "project" },
];

const navigationItems = [
	{
		name: "Home",
		href: "/app",
		icon: Home,
		shortcut: "G H",
	},
	{
		name: "Issues",
		href: "/app/issues",
		icon: FileText,
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
	{
		name: "Teams",
		href: "/app/teams",
		icon: Users,
		shortcut: "G T",
	},
	{
		name: "Settings",
		href: "/app/settings",
		icon: Settings,
		shortcut: "G S",
	},
];

const quickActions = [
	{
		name: "Create Issue",
		icon: Plus,
		action: "create-issue",
		shortcut: "C",
	},
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");

	const runCommand = useCallback(
		(command: () => unknown) => {
			onOpenChange(false);
			command();
		},
		[onOpenChange],
	);

	// Keyboard shortcut handler
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				onOpenChange(!open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [open, onOpenChange]);

	return (
		<CommandDialog onOpenChange={onOpenChange} open={open}>
			<CommandInput
				onValueChange={setSearchQuery}
				placeholder="Type a command or search..."
				value={searchQuery}
			/>
			<CommandList className="max-h-[400px]">
				<CommandEmpty>No results found.</CommandEmpty>

				{/* Recent Items */}
				{recentItems.length > 0 && !searchQuery && (
					<CommandGroup heading="Recent">
						{recentItems.map((item) => (
							<CommandItem
								key={item.id}
								onSelect={() =>
									runCommand(() => {
										if (item.type === "issue") {
											router.push(`/app/issues/${item.id}`);
										} else if (item.type === "project") {
											router.push(`/app/projects/${item.id}`);
										}
									})
								}
							>
								<FileText className="mr-2 h-4 w-4" />
								<span>{item.title}</span>
							</CommandItem>
						))}
					</CommandGroup>
				)}

				{recentItems.length > 0 && !searchQuery && <CommandSeparator />}

				{/* Navigation */}
				<CommandGroup heading="Navigation">
					{navigationItems.map((item) => {
						const Icon = item.icon;
						return (
							<CommandItem
								key={item.name}
								onSelect={() => runCommand(() => router.push(item.href))}
							>
								<Icon className="mr-2 h-4 w-4" />
								<span>{item.name}</span>
								<CommandShortcut>{item.shortcut}</CommandShortcut>
							</CommandItem>
						);
					})}
				</CommandGroup>

				<CommandSeparator />

				{/* Quick Actions */}
				<CommandGroup heading="Actions">
					{quickActions.map((action) => {
						const Icon = action.icon;
						return (
							<CommandItem
								key={action.name}
								onSelect={() =>
									runCommand(() => {
										if (action.action === "create-issue") {
											// TODO: Open create issue modal
											console.log("Create issue");
										}
									})
								}
							>
								<Icon className="mr-2 h-4 w-4" />
								<span>{action.name}</span>
								<CommandShortcut>{action.shortcut}</CommandShortcut>
							</CommandItem>
						);
					})}
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}
