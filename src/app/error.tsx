"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error("Error caught by error boundary:", error);
	}, [error]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-[#0F1115] p-4">
			<div className="w-full max-w-md space-y-6 text-center">
				<div className="flex justify-center">
					<div className="rounded-full bg-red-500/10 p-4">
						<AlertTriangle className="h-12 w-12 text-red-500" />
					</div>
				</div>

				<div className="space-y-2">
					<h1 className="font-semibold text-2xl text-[#F7F8F8]">
						Something went wrong
					</h1>
					<p className="text-[#8A8F98] text-sm">
						We&apos;ve encountered an unexpected error. Please try again or
						contact support if the problem persists.
					</p>
				</div>

				{error.message && (
					<div className="rounded-lg bg-[#1A1D21] p-4 text-left">
						<p className="font-mono text-[#8A8F98] text-xs">Error details:</p>
						<p className="mt-1 break-all font-mono text-red-400 text-xs">
							{error.message}
						</p>
						{error.digest && (
							<p className="mt-2 font-mono text-[#5E6AD2] text-xs">
								Digest: {error.digest}
							</p>
						)}
					</div>
				)}

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
