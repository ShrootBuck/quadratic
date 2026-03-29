import { Key, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApiKeysPage() {
	return (
		<div className="mx-auto max-w-2xl p-8">
			<div className="mb-8">
				<h1 className="mb-2 font-semibold text-2xl text-[#F7F8F8]">API Keys</h1>
				<p className="text-[#8A8F98]">
					Manage API access for external integrations
				</p>
			</div>

			<div className="rounded-lg border border-[#2A2F35] bg-[#16181D] p-8">
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#5E6AD2]/10">
						<Key className="h-8 w-8 text-[#5E6AD2]" />
					</div>
					<h2 className="mb-2 font-medium text-[#F7F8F8] text-xl">
						Coming Soon
					</h2>
					<p className="mb-6 max-w-md text-[#8A8F98]">
						API keys and webhooks are currently in development. This feature
						will allow you to integrate Quadratic with external tools and
						services.
					</p>

					<div className="flex items-center gap-2 rounded-lg bg-[#2A2F35] px-4 py-3">
						<Lock className="h-4 w-4 text-[#8A8F98]" />
						<span className="text-[#8A8F98] text-sm">
							This feature will include:
						</span>
					</div>

					<ul className="mt-4 space-y-2 text-left text-[#8A8F98] text-sm">
						<li className="flex items-center gap-2">
							<span className="h-1.5 w-1.5 rounded-full bg-[#5E6AD2]" />
							Generate API keys with scoped permissions
						</li>
						<li className="flex items-center gap-2">
							<span className="h-1.5 w-1.5 rounded-full bg-[#5E6AD2]" />
							Create webhooks for real-time updates
						</li>
						<li className="flex items-center gap-2">
							<span className="h-1.5 w-1.5 rounded-full bg-[#5E6AD2]" />
							View API documentation
						</li>
						<li className="flex items-center gap-2">
							<span className="h-1.5 w-1.5 rounded-full bg-[#5E6AD2]" />
							Monitor API usage and rate limits
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
