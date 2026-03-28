"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
} from "react";

interface KeyboardShortcutsContextType {
	registerShortcut: (key: string, callback: () => void) => void;
	unregisterShortcut: (key: string) => void;
}

const KeyboardShortcutsContext =
	createContext<KeyboardShortcutsContextType | null>(null);

interface KeyboardShortcutsProviderProps {
	children: ReactNode;
}

export function KeyboardShortcutsProvider({
	children,
}: KeyboardShortcutsProviderProps) {
	const shortcuts = new Map<string, () => void>();

	const registerShortcut = useCallback(
		(key: string, callback: () => void) => {
			shortcuts.set(key.toLowerCase(), callback);
		},
		[shortcuts],
	);

	const unregisterShortcut = useCallback(
		(key: string) => {
			shortcuts.delete(key.toLowerCase());
		},
		[shortcuts],
	);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger shortcuts when typing in inputs
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				e.target instanceof HTMLSelectElement
			) {
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
			if (shortcuts.has(key)) {
				e.preventDefault();
				shortcuts.get(key)?.();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [shortcuts]);

	return (
		<KeyboardShortcutsContext.Provider
			value={{ registerShortcut, unregisterShortcut }}
		>
			{children}
		</KeyboardShortcutsContext.Provider>
	);
}

export function useKeyboardShortcuts() {
	const context = useContext(KeyboardShortcutsContext);
	if (!context) {
		throw new Error(
			"useKeyboardShortcuts must be used within a KeyboardShortcutsProvider",
		);
	}
	return context;
}
