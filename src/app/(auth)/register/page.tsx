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
import { api } from "~/trpc/react";

export default function RegisterPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [workspaceName, setWorkspaceName] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const createWorkspace = api.workspace.create.useMutation({
		onSuccess: () => {
			router.push("/app");
			router.refresh();
		},
		onError: (err) => {
			setError(err.message);
			setIsLoading(false);
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			// First, sign up the user
			const signUpResult = await authClient.signUp.email({
				name,
				email,
				password,
			});

			if (signUpResult.error) {
				setError(signUpResult.error.message || "Failed to create account");
				setIsLoading(false);
				return;
			}

			// Then create the workspace
			createWorkspace.mutate({
				name: workspaceName || `${name}'s Workspace`,
			});
		} catch {
			setError("An unexpected error occurred");
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-[#0F1115] px-4 py-8">
			<Card className="w-full max-w-md border-[#2A2F35] bg-[#16181D]">
				<CardHeader className="space-y-1">
					<CardTitle className="font-bold text-2xl text-[#F7F8F8]">
						Create account
					</CardTitle>
					<CardDescription className="text-[#8A8F98]">
						Sign up and create your workspace to get started
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
							<Label className="text-[#F7F8F8]" htmlFor="name">
								Full name
							</Label>
							<Input
								className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] placeholder:text-[#8A8F98] focus-visible:ring-[#5E6AD2]"
								id="name"
								onChange={(e) => setName(e.target.value)}
								placeholder="John Doe"
								required
								type="text"
								value={name}
							/>
						</div>
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
								minLength={8}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								required
								type="password"
								value={password}
							/>
							<p className="text-[#8A8F98] text-xs">
								Must be at least 8 characters
							</p>
						</div>
						<div className="space-y-2">
							<Label className="text-[#F7F8F8]" htmlFor="workspace">
								Workspace name
							</Label>
							<Input
								className="border-[#2A2F35] bg-[#0F1115] text-[#F7F8F8] placeholder:text-[#8A8F98] focus-visible:ring-[#5E6AD2]"
								id="workspace"
								onChange={(e) => setWorkspaceName(e.target.value)}
								placeholder="Acme Inc"
								type="text"
								value={workspaceName}
							/>
							<p className="text-[#8A8F98] text-xs">
								Optional - defaults to "{name}&apos;s Workspace"
							</p>
						</div>
					</CardContent>
					<CardFooter className="flex flex-col space-y-4">
						<Button
							className="w-full bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
							disabled={isLoading}
							type="submit"
						>
							{isLoading ? "Creating account..." : "Create account"}
						</Button>
						<div className="text-center text-[#8A8F98] text-sm">
							Already have an account?{" "}
							<Link
								className="font-medium text-[#5E6AD2] hover:text-[#4E5AC2]"
								href="/login"
							>
								Sign in
							</Link>
						</div>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
