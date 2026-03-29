"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppErrorBoundary({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("App error:", error);
	}, [error]);

	return (
		<div className="flex h-full flex-col items-center justify-center p-8">
			<div className="w-full max-w-md space-y-6 text-center">
				<div className="flex justify-center">
					<div className="rounded-full bg-red-500/10 p-4">
						<AlertTriangle className="h-10 w-10 text-red-500" />
					</div>
				</div>

				<div className="space-y-2">
					<h2 className="font-semibold text-[#F7F8F8] text-xl">Page Error</h2>
					<p className="text-[#8A8F98] text-sm">
						There was a problem loading this page. Please try refreshing.
					</p>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
					<Button
						className="gap-2 bg-[#5E6AD2] hover:bg-[#5E6AD2]/90"
						onClick={reset}
					>
						<RefreshCw className="h-4 w-4" />
						Try Again
					</Button>
					<Link href="/">
						<Button className="w-full gap-2 sm:w-auto" variant="outline">
							<Home className="h-4 w-4" />
							Go Home
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
