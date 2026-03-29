"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

type _RealtimeEvent =
	| { type: "connected"; data: { connected: boolean; userId: string } }
	| { type: "ping"; data: Record<string, never> }
	| { type: "issue_created"; data: { issue: unknown } }
	| {
			type: "issue_updated";
			data: { issueId: string; changes: unknown; timestamp: number };
	  }
	| { type: "issue_deleted"; data: { issueId: string } }
	| { type: "notification_new"; data: { notification: unknown } }
	| { type: "notification_count"; data: { count: number } }
	| {
			type: "editing_started";
			data: {
				issueId: string;
				userId: string;
				userName: string;
				field: string;
			};
	  }
	| {
			type: "editing_stopped";
			data: { issueId: string; userId: string; field: string };
	  };

interface UseRealtimeOptions {
	workspaceId: string;
	userId: string;
	onIssueCreated?: (issue: unknown) => void;
	onIssueUpdated?: (issueId: string, changes: unknown) => void;
	onIssueDeleted?: (issueId: string) => void;
	onNotificationReceived?: (notification: unknown) => void;
	onNotificationCountUpdate?: (count: number) => void;
	onEditingStarted?: (data: {
		issueId: string;
		userId: string;
		userName: string;
		field: string;
	}) => void;
	onEditingStopped?: (data: {
		issueId: string;
		userId: string;
		field: string;
	}) => void;
}

export function useRealtime({
	workspaceId,
	userId,
	onIssueCreated,
	onIssueUpdated,
	onIssueDeleted,
	onNotificationReceived,
	onNotificationCountUpdate,
	onEditingStarted,
	onEditingStopped,
}: UseRealtimeOptions) {
	const [status, setStatus] = useState<ConnectionStatus>("disconnected");
	const [reconnectAttempt, setReconnectAttempt] = useState(0);
	const eventSourceRef = useRef<EventSource | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const queryClient = useQueryClient();

	const connect = useCallback(() => {
		if (!workspaceId || !userId) return;
		if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

		setStatus("connecting");

		const url = new URL("/api/realtime", window.location.origin);
		url.searchParams.set("workspaceId", workspaceId);
		url.searchParams.set("userId", userId);

		const es = new EventSource(url.toString());
		eventSourceRef.current = es;

		es.onopen = () => {
			setStatus("connected");
			setReconnectAttempt(0);
		};

		es.onerror = (error) => {
			console.error("[Realtime] SSE error:", error);
			setStatus("error");
			es.close();

			// Exponential backoff for reconnection
			const backoffDelay = Math.min(1000 * 2 ** reconnectAttempt, 30000);
			setReconnectAttempt((prev) => prev + 1);

			reconnectTimeoutRef.current = setTimeout(() => {
				connect();
			}, backoffDelay);
		};

		// Handle connected event
		es.addEventListener("connected", (event) => {
			const data = JSON.parse(event.data) as {
				connected: boolean;
				userId: string;
			};
			setStatus("connected");
		});

		// Handle ping (keep-alive)
		es.addEventListener("ping", () => {
			// Just keeps connection alive
		});

		// Handle issue created
		es.addEventListener("issue_created", (event) => {
			const data = JSON.parse(event.data) as { issue: unknown };

			// Invalidate issue list queries
			queryClient.invalidateQueries({ queryKey: ["issue", "list"] });

			onIssueCreated?.(data.issue);
		});

		// Handle issue updated
		es.addEventListener("issue_updated", (event) => {
			const data = JSON.parse(event.data) as {
				issueId: string;
				changes: unknown;
				timestamp: number;
			};

			// Invalidate specific issue query
			queryClient.invalidateQueries({
				queryKey: ["issue", "get", data.issueId],
			});
			// Also invalidate lists that might contain this issue
			queryClient.invalidateQueries({ queryKey: ["issue", "list"] });

			onIssueUpdated?.(data.issueId, data.changes);
		});

		// Handle issue deleted
		es.addEventListener("issue_deleted", (event) => {
			const data = JSON.parse(event.data) as { issueId: string };

			// Invalidate issue queries
			queryClient.invalidateQueries({ queryKey: ["issue", "list"] });
			queryClient.removeQueries({ queryKey: ["issue", "get", data.issueId] });

			onIssueDeleted?.(data.issueId);
		});

		// Handle new notification
		es.addEventListener("notification_new", (event) => {
			const data = JSON.parse(event.data) as { notification: unknown };

			// Invalidate notification queries
			queryClient.invalidateQueries({ queryKey: ["notification", "list"] });

			onNotificationReceived?.(data.notification);
		});

		// Handle notification count update
		es.addEventListener("notification_count", (event) => {
			const data = JSON.parse(event.data) as { count: number };

			// Update notification count query
			queryClient.setQueryData(
				["notification", "getUnreadCount", workspaceId],
				data.count,
			);

			onNotificationCountUpdate?.(data.count);
		});

		// Handle editing started
		es.addEventListener("editing_started", (event) => {
			const data = JSON.parse(event.data) as {
				issueId: string;
				userId: string;
				userName: string;
				field: string;
			};
			onEditingStarted?.(data);
		});

		// Handle editing stopped
		es.addEventListener("editing_stopped", (event) => {
			const data = JSON.parse(event.data) as {
				issueId: string;
				userId: string;
				field: string;
			};
			onEditingStopped?.(data);
		});
	}, [
		workspaceId,
		userId,
		reconnectAttempt,
		queryClient,
		onIssueCreated,
		onIssueUpdated,
		onIssueDeleted,
		onNotificationReceived,
		onNotificationCountUpdate,
		onEditingStarted,
		onEditingStopped,
	]);

	const disconnect = useCallback(() => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}

		setStatus("disconnected");
	}, []);

	const startEditing = useCallback(
		(issueId: string, field: string) => {
			// Send via HTTP POST to /api/realtime/edit
			fetch("/api/realtime/edit", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					workspaceId,
					userId,
					issueId,
					field,
					action: "start",
				}),
			}).catch(console.error);
		},
		[workspaceId, userId],
	);

	const stopEditing = useCallback(
		(issueId: string, field: string) => {
			fetch("/api/realtime/edit", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					workspaceId,
					userId,
					issueId,
					field,
					action: "stop",
				}),
			}).catch(console.error);
		},
		[workspaceId, userId],
	);

	useEffect(() => {
		connect();

		return () => {
			disconnect();
		};
	}, [connect, disconnect]);

	return {
		status,
		isConnected: status === "connected",
		isConnecting: status === "connecting",
		reconnectAttempt,
		connect,
		disconnect,
		startEditing,
		stopEditing,
	};
}
