"use client";

import * as React from "react";

type ContrastMode = "normal" | "high";

interface AccessibilityContextValue {
	contrastMode: ContrastMode;
	setContrastMode: (mode: ContrastMode) => void;
	reduceMotion: boolean;
	setReduceMotion: (value: boolean) => void;
	focusMode: "default" | "enhanced";
	setFocusMode: (mode: "default" | "enhanced") => void;
}

const AccessibilityContext =
	React.createContext<AccessibilityContextValue | null>(null);

export function useAccessibility() {
	const context = React.useContext(AccessibilityContext);
	if (!context) {
		throw new Error(
			"useAccessibility must be used within AccessibilityProvider",
		);
	}
	return context;
}

interface AccessibilityProviderProps {
	children: React.ReactNode;
}

export function AccessibilityProvider({
	children,
}: AccessibilityProviderProps) {
	const [contrastMode, setContrastModeState] =
		React.useState<ContrastMode>("normal");
	const [reduceMotion, setReduceMotion] = React.useState(false);
	const [focusMode, setFocusMode] = React.useState<"default" | "enhanced">(
		"default",
	);

	React.useEffect(() => {
		// Check for system preferences
		const prefersHighContrast = window.matchMedia(
			"(prefers-contrast: more)",
		).matches;
		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		if (prefersHighContrast) {
			setContrastModeState("high");
		}
		if (prefersReducedMotion) {
			setReduceMotion(true);
		}

		// Load saved preferences
		const savedContrast = localStorage.getItem("contrast-mode") as ContrastMode;
		const savedMotion = localStorage.getItem("reduce-motion");
		const savedFocus = localStorage.getItem("focus-mode") as
			| "default"
			| "enhanced";

		if (savedContrast) setContrastModeState(savedContrast);
		if (savedMotion) setReduceMotion(savedMotion === "true");
		if (savedFocus) setFocusMode(savedFocus);
	}, []);

	const setContrastMode = React.useCallback((mode: ContrastMode) => {
		setContrastModeState(mode);
		localStorage.setItem("contrast-mode", mode);

		if (mode === "high") {
			document.documentElement.classList.add("high-contrast");
		} else {
			document.documentElement.classList.remove("high-contrast");
		}
	}, []);

	const handleSetReduceMotion = React.useCallback((value: boolean) => {
		setReduceMotion(value);
		localStorage.setItem("reduce-motion", String(value));

		if (value) {
			document.documentElement.classList.add("reduce-motion");
		} else {
			document.documentElement.classList.remove("reduce-motion");
		}
	}, []);

	const handleSetFocusMode = React.useCallback(
		(mode: "default" | "enhanced") => {
			setFocusMode(mode);
			localStorage.setItem("focus-mode", mode);

			if (mode === "enhanced") {
				document.documentElement.classList.add("enhanced-focus");
			} else {
				document.documentElement.classList.remove("enhanced-focus");
			}
		},
		[],
	);

	const value = React.useMemo(
		() => ({
			contrastMode,
			setContrastMode,
			reduceMotion,
			setReduceMotion: handleSetReduceMotion,
			focusMode,
			setFocusMode: handleSetFocusMode,
		}),
		[
			contrastMode,
			setContrastMode,
			reduceMotion,
			handleSetReduceMotion,
			focusMode,
			handleSetFocusMode,
		],
	);

	return (
		<AccessibilityContext.Provider value={value}>
			{children}
		</AccessibilityContext.Provider>
	);
}
