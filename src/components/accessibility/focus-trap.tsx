"use client";

import * as React from "react";

interface FocusTrapProps {
	children: React.ReactNode;
	active?: boolean;
	onDeactivate?: () => void;
	initialFocus?: boolean;
	returnFocus?: boolean;
}

export function FocusTrap({
	children,
	active = true,
	onDeactivate,
	initialFocus = true,
	returnFocus = true,
}: FocusTrapProps) {
	const containerRef = React.useRef<HTMLDivElement>(null);
	const previousActiveElement = React.useRef<Element | null>(null);

	React.useEffect(() => {
		if (!active) return;

		// Store the currently focused element
		previousActiveElement.current = document.activeElement;

		// Focus the first focusable element
		if (initialFocus && containerRef.current) {
			const focusableElements = getFocusableElements(containerRef.current);
			if (focusableElements.length > 0) {
				focusableElements[0]?.focus();
			}
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "Tab") return;

			const container = containerRef.current;
			if (!container) return;

			const focusableElements = getFocusableElements(container);
			if (focusableElements.length === 0) return;

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			// Shift + Tab
			if (e.shiftKey) {
				if (document.activeElement === firstElement) {
					e.preventDefault();
					lastElement?.focus();
				}
			} else {
				// Tab
				if (document.activeElement === lastElement) {
					e.preventDefault();
					firstElement?.focus();
				}
			}
		};

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && onDeactivate) {
				onDeactivate();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("keydown", handleEscape);

			// Return focus to the previous element
			if (returnFocus && previousActiveElement.current instanceof HTMLElement) {
				previousActiveElement.current.focus();
			}
		};
	}, [active, initialFocus, returnFocus, onDeactivate]);

	return <div ref={containerRef}>{children}</div>;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
	const selector = [
		'button:not([disabled]):not([tabindex="-1"])',
		'[href]:not([tabindex="-1"])',
		'input:not([disabled]):not([tabindex="-1"])',
		'select:not([disabled]):not([tabindex="-1"])',
		'textarea:not([disabled]):not([tabindex="-1"])',
		'[tabindex]:not([tabindex="-1"]):not([disabled])',
		'[contenteditable="true"]:not([tabindex="-1"])',
	].join(", ");

	const elements = Array.from(container.querySelectorAll(selector));
	return elements.filter(
		(el): el is HTMLElement =>
			el instanceof HTMLElement &&
			el.offsetWidth > 0 &&
			el.offsetHeight > 0 &&
			el.tabIndex !== -1,
	);
}
