import { type NextRequest, NextResponse } from "next/server";
import { realtimeManager } from "~/server/realtime/manager";

const editActionSchema = z.object({
	workspaceId: z.string(),
	userId: z.string(),
	issueId: z.string(),
	field: z.string(),
	action: z.enum(["start", "stop"]),
	userName: z.string().optional(),
});

import { z } from "zod";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const result = editActionSchema.safeParse(body);

		if (!result.success) {
			return NextResponse.json(
				{ error: "Invalid request body" },
				{ status: 400 },
			);
		}

		const { workspaceId, userId, issueId, field, action, userName } =
			result.data;

		if (action === "start") {
			realtimeManager.startEditing(
				workspaceId,
				issueId,
				userId,
				userName ?? "Someone",
				field,
			);
		} else {
			realtimeManager.stopEditing(workspaceId, issueId, userId, field);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[Realtime] Error handling edit action:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
