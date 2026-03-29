"use client";

import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface Shortcut {
	key: string;
	description: string;
	group: string;
}

const shortcuts: Shortcut[] = [
	// Navigation
	{ key: "G then I", description: "Go to Issues", group: "Navigation" },
	{ key: "G then P", description: "Go to Projects", group: "Navigation" },
	{ key: "G then C", description: "Go to Cycles", group: "Navigation" },
	{ key: "G then T", description: "Go to Teams", group: "Navigation" },
	{ key: "G then L", description: "Go to Labels", group: "Navigation" },
	{ key: "G then S", description: "Go to Settings", group: "Navigation" },
	{ key: "G then H", description: "Go to Home", group: "Navigation" },
	{ key: "/", description: "Focus search", group: "Navigation" },

	// Actions
	{ key: "C", description: "Create new issue", group: "Actions" },
	{ key: "Cmd + Enter", description: "Save / Submit", group: "Actions" },
	{ key: "Cmd + Shift + C", description: "Copy issue URL", group: "Actions" },

	// List Navigation
	{ key: "J", description: "Navigate down", group: "List Navigation" },
	{ key: "K", description: "Navigate up", group: "List Navigation" },
	{
		key: "X",
		description: "Select / Deselect issue",
		group: "List Navigation",
	},
	{
		key: "Enter",
		description: "Open selected issue",
		group: "List Navigation",
	},

	// General
	{ key: "Cmd + K", description: "Open command palette", group: "General" },
	{ key: "?", description: "Show keyboard shortcuts", group: "General" },
	{ key: "Esc", description: "Close modal / Go back", group: "General" },
];

const groups = Array.from(new Set(shortcuts.map((s) => s.group)));

interface KeyboardShortcutsHelpProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({
	open,
	onOpenChange,
}: KeyboardShortcutsHelpProps) {
	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-w-2xl border-[#2A2F35] bg-[#16181D] text-[#F7F8F8]">
				<DialogHeader>
					<DialogTitle className="text-[#F7F8F8]">
						Keyboard Shortcuts
					</DialogTitle>
				</DialogHeader>

				<div className="mt-4 space-y-6">
					{groups.map((group) => (
						<div key={group}>
							<h3 className="mb-3 font-medium text-[#8A8F98] text-sm uppercase tracking-wide">
								{group}
							</h3>
							<div className="grid gap-2">
								{shortcuts
									.filter((s) => s.group === group)
									.map((shortcut) => (
										<div
											className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-[#2A2F35]"
											key={shortcut.key}
										>
											<span className="text-[#F7F8F8]">
												{shortcut.description}
											</span>
											<kbd className="rounded border border-[#2A2F35] bg-[#0F1115] px-2 py-1 font-mono text-[#8A8F98] text-xs">
												{shortcut.key}
											</kbd>
										</div>
									))}
							</div>
						</div>
					))}
				</div>

				<div className="mt-6 border-[#2A2F35] border-t pt-4 text-center text-[#8A8F98] text-sm">
					Press{" "}
					<kbd className="rounded border border-[#2A2F35] bg-[#0F1115] px-1.5 py-0.5 font-mono text-xs">
						?
					</kbd>{" "}
					anytime to show this help
				</div>
			</DialogContent>
		</Dialog>
	);
}

// Hook to handle the ? shortcut
export function useKeyboardShortcutsHelp() {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger when typing in inputs
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				e.target instanceof HTMLSelectElement
			) {
				return;
			}

			if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
				e.preventDefault();
				setIsOpen(true);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	return { isOpen, setIsOpen };
}
