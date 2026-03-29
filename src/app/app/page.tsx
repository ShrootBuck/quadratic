import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";

export default async function AppPage() {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	return (
		<div className="container mx-auto p-8">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl text-[#F7F8F8]">Dashboard</h1>
					<p className="mt-1 text-[#8A8F98]">
						Welcome back, {session.user.name}
					</p>
				</div>
				<form>
					<Button
						className="border-[#2A2F35] bg-transparent text-[#F7F8F8] hover:bg-[#2A2F35]"
						formAction={async () => {
							"use server";
							await auth.api.signOut({
								headers: await headers(),
							});
							redirect("/login");
						}}
						type="submit"
						variant="outline"
					>
						Sign out
					</Button>
				</form>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<Link
					className="group rounded-lg border border-[#2A2F35] bg-[#16181D] p-6 transition-colors hover:border-[#5E6AD2]"
					href="/app/issues"
				>
					<h2 className="mb-2 font-semibold text-[#F7F8F8] text-xl group-hover:text-[#5E6AD2]">
						Issues
					</h2>
					<p className="text-[#8A8F98]">View and manage all issues</p>
				</Link>

				<Link
					className="group rounded-lg border border-[#2A2F35] bg-[#16181D] p-6 transition-colors hover:border-[#5E6AD2]"
					href="/app/projects"
				>
					<h2 className="mb-2 font-semibold text-[#F7F8F8] text-xl group-hover:text-[#5E6AD2]">
						Projects
					</h2>
					<p className="text-[#8A8F98]">Manage your projects</p>
				</Link>

				<Link
					className="group rounded-lg border border-[#2A2F35] bg-[#16181D] p-6 transition-colors hover:border-[#5E6AD2]"
					href="/app/cycles"
				>
					<h2 className="mb-2 font-semibold text-[#F7F8F8] text-xl group-hover:text-[#5E6AD2]">
						Cycles
					</h2>
					<p className="text-[#8A8F98]">View sprint cycles</p>
				</Link>
			</div>
		</div>
	);
}
