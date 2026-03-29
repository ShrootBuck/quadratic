import {
	Bell,
	Brush,
	Database,
	Key,
	Palette,
	Settings,
	User,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";

interface SettingsLayoutProps {
	children: React.ReactNode;
}

export default async function SettingsLayout({
	children,
}: SettingsLayoutProps) {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	// Get user's workspace
	const membership = await db.workspaceMember.findFirst({
		where: { userId: session.user.id },
		include: { workspace: true },
		orderBy: { joinedAt: "asc" },
	});

	const _workspace = membership?.workspace;
	const isAdmin = membership?.role === "ADMIN";

	const settingsNav = [
		{
			label: "Profile",
			href: "/settings/profile",
			icon: User,
		},
		{
			label: "Workspace",
			href: "/settings/workspace",
			icon: Settings,
			adminOnly: true,
		},
		{
			label: "Appearance",
			href: "/settings/appearance",
			icon: Palette,
		},
		{
			label: "Notifications",
			href: "/settings/notifications",
			icon: Bell,
		},
		{
			label: "Labels",
			href: "/labels",
			icon: Brush,
		},
		{
			label: "API Keys",
			href: "/settings/api-keys",
			icon: Key,
			adminOnly: true,
		},
		{
			label: "Import / Export",
			href: "/settings/import-export",
			icon: Database,
			adminOnly: true,
		},
	];

	return (
		<div className="flex h-full">
			{/* Settings Sidebar */}
			<div className="w-64 border-[#2A2F35] border-r bg-[#0F1115]">
				<div className="border-[#2A2F35] border-b p-4">
					<h2 className="font-semibold text-[#F7F8F8]">Settings</h2>
					<p className="text-[#8A8F98] text-sm">Manage your preferences</p>
				</div>
				<nav className="p-2">
					{settingsNav.map((item) => {
						if (item.adminOnly && !isAdmin) return null;
						return (
							<Link
								className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#8A8F98] transition-colors hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
								href={item.href}
								key={item.href}
							>
								<item.icon className="h-4 w-4" />
								{item.label}
							</Link>
						);
					})}
				</nav>
			</div>

			{/* Main Content */}
			<div className="flex-1 overflow-auto bg-[#0F1115]">{children}</div>
		</div>
	);
}
