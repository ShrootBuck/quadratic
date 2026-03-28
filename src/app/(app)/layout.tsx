import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { auth } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";

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

	async function handleSignOut() {
		"use server";
		await auth.api.signOut({
			headers: await headers(),
		});
		redirect("/login");
	}

	return (
		<div className="flex h-screen overflow-hidden bg-[#0F1115]">
			{/* Sidebar */}
			<Sidebar className="hidden md:flex" />

			{/* Main content area */}
			<div className="flex flex-1 flex-col overflow-hidden">
				<AppShell
					onSignOut={handleSignOut}
					user={{
						name: user.name,
						email: user.email,
						image: user.image,
					}}
				>
					<main className="flex-1 overflow-auto p-6">{children}</main>
				</AppShell>
			</div>
		</div>
	);
}
