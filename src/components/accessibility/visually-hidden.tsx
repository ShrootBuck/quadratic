"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

interface VisuallyHiddenProps {
	children: React.ReactNode;
	className?: string;
}

export function VisuallyHidden({ children, className }: VisuallyHiddenProps) {
	return (
		<span
			className={cn(
				"absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0",
				"[clip:rect(0,0,0,0)]",
				className,
			)}
		>
			{children}
		</span>
	);
}
