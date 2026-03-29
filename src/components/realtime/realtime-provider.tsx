"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";
import { useRealtime } from "@/hooks/use-realtime";
import { ActiveEditorsIndicator } from "./active-editors";
import { ConnectionStatusIndicator } from "./connection-status";

interface RealtimeContextType {
	status: "connected" | "connecting" | "disconnected" | "error";
	isConnected: boolean;
	startEditing: (issueId: string, field: string) => void;
	stopEditing: (issueId: string, field: string) => void;
	activeEditors: Map<
		string,
		{ userId: string; userName: string; field: string }[]
	>;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function useRealtimeContext() {
	const context = useContext(RealtimeContext);
	if (!context) {
		throw new Error("useRealtimeContext must be used within RealtimeProvider");
	}
	return context;
}

interface RealtimeProviderProps {
	children: ReactNode;
	workspaceId: string;
	userId: string;
	userName: string;
}

export function RealtimeProvider({
	children,
	workspaceId,
	userId,
	userName,
}: RealtimeProviderProps) {
	const [activeEditors, setActiveEditors] = useState<
		Map<string, { userId: string; userName: string; field: string }[]>
	>(new Map());

	const handleEditingStarted = useCallback(
		(data: {
			issueId: string;
			userId: string;
			userName: string;
			field: string;
		}) => {
			setActiveEditors((prev) => {
				const newMap = new Map(prev);
				const issueEditors = newMap.get(data.issueId) || [];
				// Check if already in list
				if (
					!issueEditors.some(
						(e) => e.userId === data.userId && e.field === data.field,
					)
				) {
					newMap.set(data.issueId, [...issueEditors, data]);
				}
				return newMap;
			});
		},
		[],
	);

	const handleEditingStopped = useCallback(
		(data: { issueId: string; userId: string; field: string }) => {
			setActiveEditors((prev) => {
				const newMap = new Map(prev);
				const issueEditors = newMap.get(data.issueId) || [];
				const filtered = issueEditors.filter(
					(e) => !(e.userId === data.userId && e.field === data.field),
				);
				if (filtered.length === 0) {
					newMap.delete(data.issueId);
				} else {
					newMap.set(data.issueId, filtered);
				}
				return newMap;
			});
		},
		[],
	);

	const { status, isConnected, startEditing, stopEditing } = useRealtime({
		workspaceId,
		userId,
		onEditingStarted: handleEditingStarted,
		onEditingStopped: handleEditingStopped,
	});

	const wrappedStartEditing = useCallback(
		(issueId: string, field: string) => {
			startEditing(issueId, field);
		},
		[startEditing],
	);

	const wrappedStopEditing = useCallback(
		(issueId: string, field: string) => {
			stopEditing(issueId, field);
		},
		[stopEditing],
	);

	return (
		<RealtimeContext.Provider
			value={{
				status,
				isConnected,
				startEditing: wrappedStartEditing,
				stopEditing: wrappedStopEditing,
				activeEditors,
			}}
		>
			{children}
		</RealtimeContext.Provider>
	);
}

export { ActiveEditorsIndicator, ConnectionStatusIndicator };
