"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "~/server/better-auth/client";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			const result = await authClient.signIn.email({
				email,
				password,
				callbackURL: "/app",
			});

			if (result.error) {
				setError(result.error.message || "Failed to sign in");
			} else {
				router.push("/app");
				router.refresh();
			}
		} catch {
			setError("An unexpected error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-[#0F1115] px-4">
			<Card className="w-full max-w-md border-[#2A2F35] bg-[#16181D]">
				<CardHeader className="space-y-1">
					<CardTitle className="font-bold text-2xl text-[#F7F8F8]">
						Sign in
					</CardTitle>
					<CardDescription className="text-[#8A8F98]">
						Enter your email and password to access your workspace
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						{error && (
							<div className="rounded-md bg-red-500/10 p-3 text-red-400 text-sm">
								{error}
							</div>
						)}
						<div className="space-y-2">
							<Label className="text-[#F7F8F8]" htmlFor="email">
								Email
							</Label>
							<Input
								className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] placeholder:text-[#8A8F98] focus-visible:ring-[#5E6AD2]"
								id="email"
								onChange={(e) => setEmail(e.target.value)}
								placeholder="name@company.com"
								required
								type="email"
								value={email}
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-[#F7F8F8]" htmlFor="password">
								Password
							</Label>
							<Input
								className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] placeholder:text-[#8A8F98] focus-visible:ring-[#5E6AD2]"
								id="password"
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								required
								type="password"
								value={password}
							/>
						</div>
					</CardContent>
					<CardFooter className="flex flex-col space-y-4">
						<Button
							className="w-full bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
							disabled={isLoading}
							type="submit"
						>
							{isLoading ? "Signing in..." : "Sign in"}
						</Button>
						<div className="text-center text-[#8A8F98] text-sm">
							Don&apos;t have an account?{" "}
							<Link
								className="font-medium text-[#5E6AD2] hover:text-[#4E5AC2]"
								href="/register"
							>
								Create one
							</Link>
						</div>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
