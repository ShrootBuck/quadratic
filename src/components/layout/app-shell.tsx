"use client";

import { useCommandPaletteStore } from "@/stores/command-palette";
import { CommandPalette } from "./command-palette";
import { Header } from "./header";

interface AppShellProps {
	user: {
		name?: string | null;
		email?: string | null;
		image?: string | null;
	};
	onSignOut: () => void;
	workspaceId: string;
	children: React.ReactNode;
}

export function AppShell({
	user,
	onSignOut,
	workspaceId,
	children,
}: AppShellProps) {
	const { setIsOpen } = useCommandPaletteStore();

	return (
		<>
			<Header
				onSearchClick={() => setIsOpen(true)}
				onSignOut={onSignOut}
				user={user}
			/>
			<CommandPalette workspaceId={workspaceId} />
			{children}
		</>
	);
}
