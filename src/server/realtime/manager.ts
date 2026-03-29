import {
	SESSION_CLEANUP_INTERVAL_MS,
	STALE_SESSION_THRESHOLD_MS,
} from "~/constants/timeouts";

// Server-side real-time update manager
// Manages SSE connections and broadcasts updates to clients

type Client = {
	id: string;
	userId: string;
	workspaceId: string;
	send: (event: string, data: unknown) => void;
	close: () => void;
	lastPing: number;
};

type ActiveEditingSession = {
	issueId: string;
	userId: string;
	userName: string;
	field: string;
	timestamp: number;
};

class RealtimeManager {
	private clients: Map<string, Client> = new Map();
	private editingSessions: Map<string, ActiveEditingSession> = new Map();
	private workspaceClients: Map<string, Set<string>> = new Map();

	constructor() {
		// Clean up stale editing sessions every 30 seconds
		setInterval(() => this.cleanupStaleSessions(), SESSION_CLEANUP_INTERVAL_MS);
	}

	addClient(
		workspaceId: string,
		userId: string,
		handlers: {
			send: (event: string, data: unknown) => void;
			close: () => void;
		},
	): string {
		const clientId = `${workspaceId}:${userId}:${Date.now()}`;
		const client: Client = {
			id: clientId,
			userId,
			workspaceId,
			send: handlers.send,
			close: handlers.close,
			lastPing: Date.now(),
		};

		this.clients.set(clientId, client);

		// Add to workspace index
		if (!this.workspaceClients.has(workspaceId)) {
			this.workspaceClients.set(workspaceId, new Set());
		}
		this.workspaceClients.get(workspaceId)?.add(clientId);

		console.log(`[Realtime] Client connected: ${clientId}`);

		return clientId;
	}

	removeClient(workspaceId: string, clientId: string): void {
		this.clients.delete(clientId);
		this.workspaceClients.get(workspaceId)?.delete(clientId);

		// Clean up editing sessions for this user
		for (const [key, session] of this.editingSessions.entries()) {
			if (session.userId === clientId.split(":")[1]) {
				this.editingSessions.delete(key);
				// Notify others that user stopped editing
				this.broadcastToWorkspace(workspaceId, "editing_stopped", {
					issueId: session.issueId,
					userId: session.userId,
				});
			}
		}

		console.log(`[Realtime] Client disconnected: ${clientId}`);
	}

	broadcastToWorkspace(
		workspaceId: string,
		event: string,
		data: unknown,
	): void {
		const clientIds = this.workspaceClients.get(workspaceId);
		if (!clientIds) return;

		for (const clientId of clientIds) {
			const client = this.clients.get(clientId);
			if (client) {
				try {
					client.send(event, data);
				} catch (error) {
					console.error(`[Realtime] Failed to send to ${clientId}:`, error);
					// Remove dead client
					this.removeClient(workspaceId, clientId);
				}
			}
		}
	}

	broadcastToOthers(
		workspaceId: string,
		excludeUserId: string,
		event: string,
		data: unknown,
	): void {
		const clientIds = this.workspaceClients.get(workspaceId);
		if (!clientIds) return;

		for (const clientId of clientIds) {
			const client = this.clients.get(clientId);
			if (client && client.userId !== excludeUserId) {
				try {
					client.send(event, data);
				} catch (error) {
					console.error(`[Realtime] Failed to send to ${clientId}:`, error);
					this.removeClient(workspaceId, clientId);
				}
			}
		}
	}

	// Track active editing sessions
	startEditing(
		workspaceId: string,
		issueId: string,
		userId: string,
		userName: string,
		field: string,
	): void {
		const key = `${issueId}:${field}`;
		this.editingSessions.set(key, {
			issueId,
			userId,
			userName,
			field,
			timestamp: Date.now(),
		});

		// Notify others
		this.broadcastToOthers(workspaceId, userId, "editing_started", {
			issueId,
			userId,
			userName,
			field,
		});
	}

	stopEditing(
		workspaceId: string,
		issueId: string,
		userId: string,
		field: string,
	): void {
		const key = `${issueId}:${field}`;
		this.editingSessions.delete(key);

		this.broadcastToOthers(workspaceId, userId, "editing_stopped", {
			issueId,
			userId,
			field,
		});
	}

	getActiveEditors(
		issueId: string,
		excludeUserId?: string,
	): ActiveEditingSession[] {
		const editors: ActiveEditingSession[] = [];
		for (const session of this.editingSessions.values()) {
			if (session.issueId === issueId && session.userId !== excludeUserId) {
				editors.push(session);
			}
		}
		return editors;
	}

	private cleanupStaleSessions(): void {
		const now = Date.now();
		const staleThreshold = STALE_SESSION_THRESHOLD_MS;

		for (const [key, session] of this.editingSessions.entries()) {
			if (now - session.timestamp > staleThreshold) {
				this.editingSessions.delete(key);
				// Notify workspace that editing stopped
				const workspaceIds = Array.from(this.workspaceClients.keys());
				for (const workspaceId of workspaceIds) {
					this.broadcastToWorkspace(workspaceId, "editing_stopped", {
						issueId: session.issueId,
						userId: session.userId,
						field: session.field,
					});
				}
			}
		}
	}

	// Issue update events
	notifyIssueCreated(
		workspaceId: string,
		issue: unknown,
		actorId: string,
	): void {
		this.broadcastToOthers(workspaceId, actorId, "issue_created", { issue });
	}

	notifyIssueUpdated(
		workspaceId: string,
		issueId: string,
		changes: unknown,
		actorId: string,
	): void {
		this.broadcastToOthers(workspaceId, actorId, "issue_updated", {
			issueId,
			changes,
			timestamp: Date.now(),
		});
	}

	notifyIssueDeleted(
		workspaceId: string,
		issueId: string,
		actorId: string,
	): void {
		this.broadcastToOthers(workspaceId, actorId, "issue_deleted", { issueId });
	}

	// Notification events
	notifyNewNotification(
		workspaceId: string,
		userId: string,
		notification: unknown,
	): void {
		// Only send to specific user
		const clientIds = this.workspaceClients.get(workspaceId);
		if (!clientIds) return;

		for (const clientId of clientIds) {
			const client = this.clients.get(clientId);
			if (client && client.userId === userId) {
				try {
					client.send("notification_new", { notification });
				} catch (error) {
					console.error(
						`[Realtime] Failed to send notification to ${clientId}:`,
						error,
					);
				}
			}
		}
	}

	notifyNotificationCountUpdate(
		workspaceId: string,
		userId: string,
		count: number,
	): void {
		const clientIds = this.workspaceClients.get(workspaceId);
		if (!clientIds) return;

		for (const clientId of clientIds) {
			const client = this.clients.get(clientId);
			if (client && client.userId === userId) {
				try {
					client.send("notification_count", { count });
				} catch (error) {
					console.error(
						`[Realtime] Failed to send count to ${clientId}:`,
						error,
					);
				}
			}
		}
	}

	// Get connection stats
	getStats(): { totalClients: number; workspaceCount: number } {
		return {
			totalClients: this.clients.size,
			workspaceCount: this.workspaceClients.size,
		};
	}
}

// Export singleton instance
export const realtimeManager = new RealtimeManager();
