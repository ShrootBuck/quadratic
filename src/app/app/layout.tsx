import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
	AccessibilityProvider,
	AriaLiveProvider,
	SkipLinks,
} from "@/components/accessibility";
import { AppShell } from "@/components/layout/app-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { RealtimeProvider } from "@/components/realtime/realtime-provider";
import { auth } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";

export default async function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	const user = session.user;

	// Get user's workspace
	const membership = await db.workspaceMember.findFirst({
		where: { userId: user.id },
		include: { workspace: true },
		orderBy: { joinedAt: "asc" },
	});

	const workspace = membership?.workspace;

	async function handleSignOut() {
		"use server";
		await auth.api.signOut({
			headers: await headers(),
		});
		redirect("/login");
	}

	return (
		<AccessibilityProvider>
			<AriaLiveProvider>
				<RealtimeProvider
					userId={user.id}
					userName={user.name || "Anonymous"}
					workspaceId={workspace?.id ?? ""}
				>
					{/* Skip Links for Accessibility */}
					<SkipLinks />

					<div className="flex h-screen overflow-hidden bg-[#0F1115]">
						{/* Sidebar */}
						<Sidebar
							className="hidden md:flex"
							workspaceId={workspace?.id ?? ""}
						/>

						{/* Main content area */}
						<div className="flex flex-1 flex-col overflow-hidden">
							<AppShell
								onSignOut={handleSignOut}
								user={{
									name: user.name,
									email: user.email,
									image: user.image,
								}}
								workspaceId={workspace?.id ?? ""}
							>
								<main
									className="flex-1 overflow-auto p-6"
									id="main-content"
									tabIndex={-1}
								>
									{children}
								</main>
							</AppShell>
						</div>
					</div>
				</RealtimeProvider>
			</AriaLiveProvider>
		</AccessibilityProvider>
	);
}
