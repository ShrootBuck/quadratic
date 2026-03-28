import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSession } from "~/server/better-auth/server";

export default async function Home() {
	const session = await getSession();

	// Redirect to app if already logged in
	if (session) {
		redirect("/app");
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-[#0F1115] px-4">
			<div className="mx-auto max-w-3xl text-center">
				<div className="mb-6 flex justify-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#5E6AD2]">
						<svg
							aria-label="Quadratic logo"
							className="h-7 w-7 text-white"
							fill="none"
							height="24"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							viewBox="0 0 24 24"
							width="24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
						</svg>
					</div>
				</div>
				<h1 className="mb-4 font-bold text-5xl text-[#F7F8F8] tracking-tight sm:text-6xl">
					Quadratic
				</h1>
				<p className="mb-8 text-[#8A8F98] text-xl">
					A Linear-style project management tool for modern teams.
					<br />
					Fast, keyboard-first, and beautifully designed.
				</p>
				<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
					<Link href="/register">
						<Button
							className="bg-[#5E6AD2] px-8 text-white hover:bg-[#4E5AC2]"
							size="lg"
						>
							Get Started
						</Button>
					</Link>
					<Link href="/login">
						<Button
							className="border-[#2A2F35] bg-transparent px-8 text-[#F7F8F8] hover:bg-[#2A2F35]"
							size="lg"
							variant="outline"
						>
							Sign In
						</Button>
					</Link>
				</div>
			</div>

			<div className="mt-16 grid max-w-4xl gap-8 sm:grid-cols-3">
				<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-6">
					<h3 className="mb-2 font-semibold text-[#F7F8F8]">Issue Tracking</h3>
					<p className="text-[#8A8F98] text-sm">
						Organize and track issues with a fast, intuitive interface.
					</p>
				</div>
				<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-6">
					<h3 className="mb-2 font-semibold text-[#F7F8F8]">Cycles</h3>
					<p className="text-[#8A8F98] text-sm">
						Plan and execute work in focused sprints.
					</p>
				</div>
				<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-6">
					<h3 className="mb-2 font-semibold text-[#F7F8F8]">Keyboard First</h3>
					<p className="text-[#8A8F98] text-sm">
						Navigate and take action without lifting your fingers.
					</p>
				</div>
			</div>
		</div>
	);
}
