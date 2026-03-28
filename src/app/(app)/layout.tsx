import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";

export default async function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	return (
		<div className="min-h-screen bg-[#0F1115]">
			<header className="border-[#2A2F35] border-b bg-[#16181D]">
				<div className="flex h-14 items-center px-4">
					<div className="flex items-center gap-2">
						<div className="h-6 w-6 rounded bg-[#5E6AD2]" />
						<span className="font-semibold text-[#F7F8F8]">Quadratic</span>
					</div>
				</div>
			</header>
			<main>{children}</main>
		</div>
	);
}
