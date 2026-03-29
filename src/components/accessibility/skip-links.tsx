"use client";

import { cn } from "@/lib/utils";

interface SkipLinksProps {
	className?: string;
}

export function SkipLinks({ className }: SkipLinksProps) {
	return (
		<div
			className={cn(
				"fixed top-0 left-0 z-[100] flex -translate-y-full flex-col gap-2 p-4 transition-transform focus-within:translate-y-0",
				className,
			)}
		>
			<a
				className="rounded-md bg-[#5E6AD2] px-4 py-2 font-medium text-sm text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#5E6AD2] focus:ring-offset-2 focus:ring-offset-[#0F1115]"
				href="#main-content"
			>
				Skip to main content
			</a>
			<a
				className="rounded-md bg-[#2A2F35] px-4 py-2 font-medium text-[#F7F8F8] text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-[#5E6AD2] focus:ring-offset-2 focus:ring-offset-[#0F1115]"
				href="#navigation"
			>
				Skip to navigation
			</a>
		</div>
	);
}
