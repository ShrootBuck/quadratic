"use client";

import {
	FileText,
	FolderKanban,
	Home,
	Plus,
	RotateCcw,
	Settings,
	Tag,
	User,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CreateIssueModal } from "@/components/features/issues/create-issue-modal";
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
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCommandPaletteStore } from "@/stores/command-palette";
import { COMMAND_PALETTE_LIMIT } from "~/constants";
import { api } from "~/trpc/react";

// Types for recent items
interface RecentItem {
	id: string;
	title: string;
	type: "issue" | "project" | "cycle" | "team";
	teamKey?: string;
}

interface CommandPaletteProps {
	workspaceId: string;
}

const navigationItems = [
	{
		name: "Home",
		href: "/",
		icon: Home,
		shortcut: "G H",
	},
	{
		name: "Issues",
		href: "/issues",
		icon: FileText,
		shortcut: "G I",
	},
	{
		name: "Projects",
		href: "/projects",
		icon: FolderKanban,
		shortcut: "G P",
	},
	{
		name: "Cycles",
		href: "/cycles",
		icon: RotateCcw,
		shortcut: "G C",
	},
	{
		name: "Teams",
		href: "/teams",
		icon: Users,
		shortcut: "G T",
	},
	{
		name: "Labels",
		href: "/labels",
		icon: Tag,
		shortcut: "G L",
	},
	{
		name: "Settings",
		href: "/settings",
		icon: Settings,
		shortcut: "G S",
	},
];

export function CommandPalette({ workspaceId }: CommandPaletteProps) {
	const router = useRouter();
	const { isOpen, setIsOpen } = useCommandPaletteStore();
	const [searchQuery, setSearchQuery] = useState("");
	const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
	const [createIssueOpen, setCreateIssueOpen] = useState(false);

	// Debounce search query
	const debouncedQuery = useDebouncedValue(searchQuery, 200);

	// Load recent items from localStorage
	useEffect(() => {
		const saved = localStorage.getItem("quadratic:recent-items");
		if (saved) {
			try {
				setRecentItems(JSON.parse(saved));
			} catch {
				// Ignore parse errors
			}
		}
	}, []);

	// Save recent items to localStorage
	const addRecentItem = useCallback((item: RecentItem) => {
		setRecentItems((prev) => {
			const filtered = prev.filter((i) => i.id !== item.id);
			const updated = [item, ...filtered].slice(0, COMMAND_PALETTE_LIMIT);
			localStorage.setItem("quadratic:recent-items", JSON.stringify(updated));
			return updated;
		});
	}, []);

	// Search query
	const { data: searchResults, isLoading: isSearching } =
		api.workspace.search.useQuery(
			{
				workspaceId,
				query: debouncedQuery,
				limit: COMMAND_PALETTE_LIMIT,
			},
			{
				enabled: debouncedQuery.length > 0 && isOpen,
			},
		);

	// Run command and close palette
	const runCommand = useCallback(
		(command: () => unknown) => {
			setIsOpen(false);
			setSearchQuery("");
			command();
		},
		[setIsOpen],
	);

	// Add to recent and navigate
	const navigateTo = useCallback(
		(
			path: string,
			item?: {
				id: string;
				title: string;
				type: RecentItem["type"];
				teamKey?: string;
			},
		) => {
			if (item) {
				addRecentItem(item);
			}
			runCommand(() => router.push(path));
		},
		[addRecentItem, runCommand, router],
	);

	// Keyboard shortcut handler for Cmd+K
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setIsOpen(!isOpen);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [isOpen, setIsOpen]);

	// Filtered recent items (exclude if searching)
	const filteredRecentItems = searchQuery ? [] : recentItems.slice(0, 5);
	const hasRecentItems = filteredRecentItems.length > 0;

	return (
		<>
			<CommandDialog onOpenChange={setIsOpen} open={isOpen}>
				<CommandInput
					className="border-none focus:ring-0"
					onValueChange={setSearchQuery}
					placeholder="Search or jump to..."
					value={searchQuery}
				/>
				<CommandList className="max-h-[60vh] overflow-y-auto">
					<CommandEmpty>
						{isSearching ? (
							<div className="py-6 text-center text-muted-foreground text-sm">
								Searching...
							</div>
						) : searchQuery ? (
							<div className="py-6 text-center text-muted-foreground text-sm">
								No results found for &quot;{searchQuery}&quot;
							</div>
						) : (
							<div className="py-6 text-center text-muted-foreground text-sm">
								Type to search issues, projects, cycles, and more...
							</div>
						)}
					</CommandEmpty>

					{/* Recent Items */}
					{hasRecentItems && (
						<CommandGroup heading="Recent">
							{filteredRecentItems.map((item) => (
								<CommandItem
									key={`recent-${item.id}`}
									onSelect={() => {
										const path =
											item.type === "issue"
												? `/issues/${item.id}`
												: item.type === "project"
													? `/projects/${item.id}`
													: item.type === "cycle"
														? `/cycles/${item.id}`
														: `/teams/${item.id}`;
										navigateTo(path, item);
									}}
								>
									{item.type === "issue" && (
										<FileText className="mr-2 h-4 w-4 text-[#5E6AD2]" />
									)}
									{item.type === "project" && (
										<FolderKanban className="mr-2 h-4 w-4 text-[#4EC9B0]" />
									)}
									{item.type === "cycle" && (
										<RotateCcw className="mr-2 h-4 w-4 text-[#F59E0B]" />
									)}
									{item.type === "team" && (
										<Users className="mr-2 h-4 w-4 text-[#8A8F98]" />
									)}
									<span className="flex-1 truncate">{item.title}</span>
									<span className="text-muted-foreground text-xs">
										{item.type}
									</span>
								</CommandItem>
							))}
						</CommandGroup>
					)}

					{hasRecentItems && <CommandSeparator />}

					{/* Search Results */}
					{searchResults && searchQuery && (
						<>
							{searchResults.issues.length > 0 && (
								<CommandGroup heading="Issues">
									{searchResults.issues.map((issue) => (
										<CommandItem
											key={`issue-${issue.id}`}
											onSelect={() =>
												navigateTo(`/issues/${issue.id}`, {
													id: issue.id,
													title: `${issue.identifier}: ${issue.title}`,
													type: "issue",
												})
											}
										>
											<FileText className="mr-2 h-4 w-4 text-[#5E6AD2]" />
											<div className="flex flex-1 flex-col">
												<span className="truncate">{issue.title}</span>
												<span className="text-muted-foreground text-xs">
													{issue.identifier}
												</span>
											</div>
										</CommandItem>
									))}
								</CommandGroup>
							)}

							{searchResults.projects.length > 0 && (
								<CommandGroup heading="Projects">
									{searchResults.projects.map((project) => (
										<CommandItem
											key={`project-${project.id}`}
											onSelect={() =>
												navigateTo(`/projects/${project.id}`, {
													id: project.id,
													title: project.name,
													type: "project",
												})
											}
										>
											<FolderKanban className="mr-2 h-4 w-4 text-[#4EC9B0]" />
											<span className="flex-1 truncate">{project.name}</span>
											<span className="text-muted-foreground text-xs">
												Project
											</span>
										</CommandItem>
									))}
								</CommandGroup>
							)}

							{searchResults.cycles.length > 0 && (
								<CommandGroup heading="Cycles">
									{searchResults.cycles.map((cycle) => (
										<CommandItem
											key={`cycle-${cycle.id}`}
											onSelect={() =>
												navigateTo(`/cycles/${cycle.id}`, {
													id: cycle.id,
													title: cycle.name,
													type: "cycle",
												})
											}
										>
											<RotateCcw className="mr-2 h-4 w-4 text-[#F59E0B]" />
											<span className="flex-1 truncate">{cycle.name}</span>
											<span className="text-muted-foreground text-xs">
												Cycle
											</span>
										</CommandItem>
									))}
								</CommandGroup>
							)}

							{searchResults.teams.length > 0 && (
								<CommandGroup heading="Teams">
									{searchResults.teams.map((team) => (
										<CommandItem
											key={`team-${team.id}`}
											onSelect={() =>
												navigateTo(`/teams/${team.id}`, {
													id: team.id,
													title: team.name,
													type: "team",
												})
											}
										>
											<div
												className="mr-2 h-4 w-4 rounded-full"
												style={{ backgroundColor: team.color }}
											/>
											<span className="flex-1 truncate">{team.name}</span>
											<span className="text-muted-foreground text-xs">
												{team.key}
											</span>
										</CommandItem>
									))}
								</CommandGroup>
							)}

							{searchResults.users.length > 0 && (
								<CommandGroup heading="Users">
									{searchResults.users.map((user) => (
										<CommandItem
											key={`user-${user.id}`}
											onSelect={() => {
												// Could navigate to user profile in future
												runCommand(() => {});
											}}
										>
											<User className="mr-2 h-4 w-4 text-[#8A8F98]" />
											<div className="flex flex-1 flex-col">
												<span>{user.name || user.email}</span>
												<span className="text-muted-foreground text-xs">
													{user.email}
												</span>
											</div>
										</CommandItem>
									))}
								</CommandGroup>
							)}
						</>
					)}

					{/* Navigation */}
					{!searchQuery && (
						<>
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

							{/* Actions */}
							<CommandGroup heading="Actions">
								<CommandItem
									onSelect={() => runCommand(() => setCreateIssueOpen(true))}
								>
									<Plus className="mr-2 h-4 w-4" />
									<span>Create Issue</span>
									<CommandShortcut>C</CommandShortcut>
								</CommandItem>
							</CommandGroup>
						</>
					)}
				</CommandList>
			</CommandDialog>

			<CreateIssueModal
				onOpenChange={setCreateIssueOpen}
				open={createIssueOpen}
				workspaceId={workspaceId}
			/>
		</>
	);
}
