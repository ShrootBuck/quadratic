"use client";

import { useState } from "react";
import { CommandPalette } from "@/components/layout/command-palette";

export function CommandPaletteWrapper() {
	const [open, setOpen] = useState(false);

	return <CommandPalette onOpenChange={setOpen} open={open} />;
}
