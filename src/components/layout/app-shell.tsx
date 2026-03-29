"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCommandPaletteStore } from "@/stores/command-palette";
import { CommandPalette } from "./command-palette";
import { Header } from "./header";
import {
	KeyboardShortcutsHelp,
	useKeyboardShortcutsHelp,
} from "./keyboard-shortcuts-help";

interface AppShellProps {
	user: {
		name?: string | null;
		email?: string | null;
		image?: string | null;
	};
	onSignOut: () => void;
	workspaceId: string;
	children: React.ReactNode;
}

export function AppShell({
	user,
	onSignOut,
	workspaceId,
	children,
}: AppShellProps) {
	const router = useRouter();
	const { setIsOpen } = useCommandPaletteStore();
	const { isOpen: helpOpen, setIsOpen: setHelpOpen } =
		useKeyboardShortcutsHelp();
	const [, setCreateIssueOpen] = useState(false);

	// Register keyboard shortcuts
	useEffect(() => {
		const shortcuts = new Map<string, () => void>();

		const registerShortcut = (key: string, callback: () => void) => {
			shortcuts.set(key.toLowerCase(), callback);
		};

		// Navigation shortcuts
		registerShortcut("g i", () => router.push("/issues"));
		registerShortcut("g p", () => router.push("/projects"));
		registerShortcut("g c", () => router.push("/cycles"));
		registerShortcut("g t", () => router.push("/teams"));
		registerShortcut("g l", () => router.push("/labels"));
		registerShortcut("g s", () => router.push("/settings"));
		registerShortcut("g h", () => router.push("/"));
		registerShortcut("/", () => {
			const searchInput = document.querySelector(
				"[data-search-input]",
			) as HTMLInputElement;
			if (searchInput) {
				searchInput.focus();
			}
		});

		// Action shortcuts
		registerShortcut("c", () => setCreateIssueOpen(true));

		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger shortcuts when typing in inputs, textareas, or select elements
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				e.target instanceof HTMLSelectElement
			) {
				// Allow Cmd+Enter in inputs
				if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
					const form = (e.target as HTMLElement).closest("form");
					if (form) {
						const submitEvent = new Event("submit", {
							bubbles: true,
							cancelable: true,
						});
						form.dispatchEvent(submitEvent);
					}
				}
				return;
			}

			const key = e.key.toLowerCase();

			// Handle "g" prefix for navigation (g + i, g + p, etc.)
			if (key === "g") {
				const nextKeyHandler = (nextE: KeyboardEvent) => {
					if (
						nextE.target instanceof HTMLInputElement ||
						nextE.target instanceof HTMLTextAreaElement ||
						nextE.target instanceof HTMLSelectElement
					) {
						document.removeEventListener("keydown", nextKeyHandler);
						return;
					}

					const nextKey = nextE.key.toLowerCase();
					const shortcutKey = `g ${nextKey}`;

					if (shortcuts.has(shortcutKey)) {
						nextE.preventDefault();
						shortcuts.get(shortcutKey)?.();
					}

					document.removeEventListener("keydown", nextKeyHandler);
				};

				document.addEventListener("keydown", nextKeyHandler, { once: true });

				// Set timeout to clear the listener if no second key is pressed
				setTimeout(() => {
					document.removeEventListener("keydown", nextKeyHandler);
				}, 1000);

				return;
			}

			// Direct shortcuts
			if (shortcuts.has(key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
				e.preventDefault();
				shortcuts.get(key)?.();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [router]);

	return (
		<>
			<Header
				onSearchClick={() => setIsOpen(true)}
				onSignOut={onSignOut}
				user={user}
			/>
			<CommandPalette workspaceId={workspaceId} />
			<KeyboardShortcutsHelp onOpenChange={setHelpOpen} open={helpOpen} />
			{children}
		</>
	);
}
