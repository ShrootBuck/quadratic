import type { NextRequest } from "next/server";
import { realtimeManager } from "~/server/realtime/manager";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	const workspaceId = req.nextUrl.searchParams.get("workspaceId");
	const userId = req.nextUrl.searchParams.get("userId");

	if (!workspaceId || !userId) {
		return new Response("Missing workspaceId or userId", { status: 400 });
	}

	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		start(controller) {
			// Send initial connection message
			const message = encoder.encode(
				`event: connected\ndata: ${JSON.stringify({ connected: true, userId })}\n\n`,
			);
			controller.enqueue(message);

			// Register client with the realtime manager
			const clientId = realtimeManager.addClient(workspaceId, userId, {
				send: (event: string, data: unknown) => {
					try {
						const message = encoder.encode(
							`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
						);
						controller.enqueue(message);
					} catch {
						// Client disconnected
					}
				},
				close: () => {
					controller.close();
				},
			});

			// Handle client disconnect
			req.signal.addEventListener("abort", () => {
				realtimeManager.removeClient(workspaceId, clientId);
				controller.close();
			});

			// Keep connection alive with ping every 30 seconds
			const pingInterval = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
				} catch {
					clearInterval(pingInterval);
				}
			}, 30000);

			// Cleanup on abort
			req.signal.addEventListener("abort", () => {
				clearInterval(pingInterval);
			});
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
}
