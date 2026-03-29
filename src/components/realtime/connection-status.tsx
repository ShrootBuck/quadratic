"use client";

import { Loader2, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionStatusIndicatorProps {
	status: "connected" | "connecting" | "disconnected" | "error";
	className?: string;
}

export function ConnectionStatusIndicator({
	status,
	className,
}: ConnectionStatusIndicatorProps) {
	return (
		<div
			className={cn("flex items-center gap-2 font-medium text-xs", className)}
		>
			{status === "connected" && (
				<>
					<Wifi className="h-3 w-3 text-emerald-500" />
					<span className="text-emerald-500">Connected</span>
				</>
			)}
			{status === "connecting" && (
				<>
					<Loader2 className="h-3 w-3 animate-spin text-amber-500" />
					<span className="text-amber-500">Connecting...</span>
				</>
			)}
			{status === "disconnected" && (
				<>
					<WifiOff className="h-3 w-3 text-slate-400" />
					<span className="text-slate-400">Offline</span>
				</>
			)}
			{status === "error" && (
				<>
					<WifiOff className="h-3 w-3 text-red-500" />
					<span className="text-red-500">Connection error</span>
				</>
			)}
		</div>
	);
}
