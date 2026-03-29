"use client";

import * as React from "react";

interface Announcement {
	id: string;
	message: string;
	priority: "polite" | "assertive";
}

interface AriaLiveContextValue {
	announce: (message: string, priority?: "polite" | "assertive") => void;
}

const AriaLiveContext = React.createContext<AriaLiveContextValue | null>(null);

export function useAriaLive() {
	const context = React.useContext(AriaLiveContext);
	if (!context) {
		throw new Error("useAriaLive must be used within AriaLiveProvider");
	}
	return context;
}

interface AriaLiveProviderProps {
	children: React.ReactNode;
}

export function AriaLiveProvider({ children }: AriaLiveProviderProps) {
	const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);

	const announce = React.useCallback(
		(message: string, priority: "polite" | "assertive" = "polite") => {
			const id = `${Date.now()}-${Math.random()}`;
			setAnnouncements((prev) => [...prev, { id, message, priority }]);

			// Remove announcement after it's been read
			setTimeout(() => {
				setAnnouncements((prev) => prev.filter((a) => a.id !== id));
			}, 1000);
		},
		[],
	);

	const value = React.useMemo(() => ({ announce }), [announce]);

	return (
		<AriaLiveContext.Provider value={value}>
			{children}
			{/* Screen reader announcements */}
			<div
				aria-atomic="true"
				aria-live="polite"
				className="sr-only"
				role="status"
			>
				{announcements
					.filter((a) => a.priority === "polite")
					.map((a) => (
						<div key={a.id}>{a.message}</div>
					))}
			</div>
			<div
				aria-atomic="true"
				aria-live="assertive"
				className="sr-only"
				role="alert"
			>
				{announcements
					.filter((a) => a.priority === "assertive")
					.map((a) => (
						<div key={a.id}>{a.message}</div>
					))}
			</div>
		</AriaLiveContext.Provider>
	);
}
