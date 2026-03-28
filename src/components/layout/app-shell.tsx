"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CommandPalette } from "./command-palette";
import { Header } from "./header";

interface AppShellProps {
	user: {
		name?: string | null;
		email?: string | null;
		image?: string | null;
	};
	onSignOut: () => void;
	children: React.ReactNode;
}

export function AppShell({ user, onSignOut, children }: AppShellProps) {
	const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
	const _router = useRouter();

	return (
		<>
			<Header
				onSearchClick={() => setCommandPaletteOpen(true)}
				onSignOut={onSignOut}
				user={user}
			/>
			<CommandPalette
				onOpenChange={setCommandPaletteOpen}
				open={commandPaletteOpen}
			/>
			{children}
		</>
	);
}
