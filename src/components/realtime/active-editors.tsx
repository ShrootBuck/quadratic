"use client";

import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveEditorsIndicatorProps {
	editors: { userId: string; userName: string; field: string }[];
	className?: string;
}

export function ActiveEditorsIndicator({
	editors,
	className,
}: ActiveEditorsIndicatorProps) {
	if (editors.length === 0) return null;

	const fieldGroups = editors.reduce<Record<string, typeof editors>>(
		(acc, editor) => {
			if (!acc[editor.field]) {
				acc[editor.field] = [];
			}
			acc[editor.field]!.push(editor);
			return acc;
		},
		{},
	);

	return (
		<div className={cn("space-y-2", className)}>
			{Object.entries(fieldGroups).map(([field, fieldEditors]) => (
				<div
					className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1.5 text-amber-400 text-xs"
					key={field}
				>
					<User className="h-3 w-3" />
					<span>
						{fieldEditors.length === 1 && fieldEditors[0]
							? `${fieldEditors[0].userName} is editing ${field}`
							: `${fieldEditors.length} people are editing ${field}`}
					</span>
				</div>
			))}
		</div>
	);
}
