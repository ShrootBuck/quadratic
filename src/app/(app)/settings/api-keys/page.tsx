"use client";

import { format } from "date-fns";
import {
	AlertTriangle,
	Check,
	Copy,
	Eye,
	EyeOff,
	Key,
	Link,
	MoreHorizontal,
	Plus,
	RefreshCw,
	Shield,
	Trash2,
	Webhook,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "~/trpc/react";

// API Key Scope Badge
function ScopeBadge({ scope }: { scope: string }) {
	const colors = {
		READ: "bg-blue-500/10 text-blue-400 border-blue-500/20",
		WRITE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
		ADMIN: "bg-red-500/10 text-red-400 border-red-500/20",
	};

	return (
		<Badge
			className={`${colors[scope as keyof typeof colors] ?? colors.READ} border`}
			variant="outline"
		>
			{scope}
		</Badge>
	);
}

// Webhook Status Badge
function WebhookStatusBadge({ status }: { status: string }) {
	const colors = {
		ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
		PAUSED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
		FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
	};

	return (
		<Badge
			className={
				colors[status as keyof typeof colors] ?? `${colors.ACTIVE}border`
			}
			variant="outline"
		>
			{status.toLowerCase()}
		</Badge>
	);
}

// Create API Key Modal
function CreateApiKeyModal({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const [name, setName] = useState("");
	const [scope, setScope] = useState<"READ" | "WRITE" | "ADMIN">("READ");
	const [expiresInDays, setExpiresInDays] = useState<string>("");
	const [createdKey, setCreatedKey] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const utils = api.useUtils();
	const createMutation = api.apiKeys.create.useMutation({
		onSuccess: (data) => {
			setCreatedKey(data.apiKey);
			void utils.apiKeys.list.invalidate({ workspaceId: "clz1234567890" });
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		createMutation.mutate({
			name: name.trim(),
			scope,
			expiresInDays: expiresInDays
				? Number.parseInt(expiresInDays, 10)
				: undefined,
		});
	};

	const handleCopy = () => {
		if (createdKey) {
			void navigator.clipboard.writeText(createdKey);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleClose = () => {
		setName("");
		setScope("READ");
		setExpiresInDays("");
		setCreatedKey(null);
		setCopied(false);
		onClose();
	};

	if (createdKey) {
		return (
			<Dialog onOpenChange={handleClose} open={isOpen}>
				<DialogContent className="border-[#2A2F35] bg-[#0F1115] sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-[#F7F8F8]">
							<Check className="h-5 w-5 text-green-500" />
							API Key Created
						</DialogTitle>
						<DialogDescription className="text-[#8A8F98]">
							Copy this key now. You won&apos;t be able to see it again!
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
							<div className="flex items-start gap-3">
								<AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400" />
								<div>
									<p className="font-medium text-amber-200 text-sm">
										Important
									</p>
									<p className="text-amber-200/70 text-sm">
										This is the only time this key will be displayed. Store it
										somewhere secure.
									</p>
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label className="text-[#8A8F98]">API Key</Label>
							<div className="flex gap-2">
								<code className="flex-1 rounded-md border border-[#2A2F35] bg-[#1A1D21] p-3 font-mono text-[#F7F8F8] text-sm">
									{createdKey}
								</code>
								<Button
									className="bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
									onClick={handleCopy}
									size="icon"
								>
									{copied ? (
										<Check className="h-4 w-4" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							className="bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
							onClick={handleClose}
						>
							I&apos;ve Copied the Key
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog onOpenChange={handleClose} open={isOpen}>
			<DialogContent className="border-[#2A2F35] bg-[#0F1115] sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-[#F7F8F8]">Create API Key</DialogTitle>
					<DialogDescription className="text-[#8A8F98]">
						Generate a new API key for external integrations.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label className="text-[#8A8F98]" htmlFor="name">
								Name
							</Label>
							<Input
								autoFocus
								className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8] placeholder:text-[#8A8F98]"
								id="name"
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g., Production API, CI/CD Integration"
								value={name}
							/>
						</div>

						<div className="space-y-2">
							<Label className="text-[#8A8F98]">Scope</Label>
							<Select
								onValueChange={(v) => setScope(v as typeof scope)}
								value={scope}
							>
								<SelectTrigger className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="border-[#2A2F35] bg-[#1A1D21]">
									<SelectItem className="text-[#F7F8F8]" value="READ">
										<div className="flex items-center gap-2">
											<Shield className="h-4 w-4 text-blue-400" />
											<div>
												<span className="font-medium">Read</span>
												<p className="text-[#8A8F98] text-xs">
													Read-only access to issues, projects, etc.
												</p>
											</div>
										</div>
									</SelectItem>
									<SelectItem className="text-[#F7F8F8]" value="WRITE">
										<div className="flex items-center gap-2">
											<Shield className="h-4 w-4 text-amber-400" />
											<div>
												<span className="font-medium">Write</span>
												<p className="text-[#8A8F98] text-xs">
													Read and write access to issues and projects
												</p>
											</div>
										</div>
									</SelectItem>
									<SelectItem className="text-[#F7F8F8]" value="ADMIN">
										<div className="flex items-center gap-2">
											<Shield className="h-4 w-4 text-red-400" />
											<div>
												<span className="font-medium">Admin</span>
												<p className="text-[#8A8F98] text-xs">
													Full access including workspace management
												</p>
											</div>
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label className="text-[#8A8F98]" htmlFor="expires">
								Expires In (days, optional)
							</Label>
							<Input
								className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8] placeholder:text-[#8A8F98]"
								id="expires"
								onChange={(e) => setExpiresInDays(e.target.value)}
								placeholder="e.g., 30, 90, 365"
								type="number"
								value={expiresInDays}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
							onClick={handleClose}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							className="bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
							disabled={!name.trim() || createMutation.isPending}
							type="submit"
						>
							{createMutation.isPending ? "Creating..." : "Create API Key"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// Create Webhook Modal
function CreateWebhookModal({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const [name, setName] = useState("");
	const [url, setUrl] = useState("");
	const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
	const [showSecret, setShowSecret] = useState(false);
	const [createdWebhook, setCreatedWebhook] = useState<{
		secret: string;
	} | null>(null);
	const [copied, setCopied] = useState(false);

	const utils = api.useUtils();
	const createMutation = api.apiKeys.createWebhook.useMutation({
		onSuccess: (data) => {
			if ("secret" in data && data.secret) {
				setCreatedWebhook({ secret: data.secret });
			}
			void utils.apiKeys.listWebhooks.invalidate({
				workspaceId: "clz1234567890",
			});
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !url.trim() || selectedEvents.length === 0) return;

		createMutation.mutate({
			name: name.trim(),
			url: url.trim(),
			events: selectedEvents as Array<
				"ISSUE_CREATED" | "ISSUE_UPDATED" | "ISSUE_DELETED"
			>,
		});
	};

	const toggleEvent = (event: string) => {
		setSelectedEvents((prev) =>
			prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
		);
	};

	const handleCopy = () => {
		if (createdWebhook?.secret) {
			void navigator.clipboard.writeText(createdWebhook.secret);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleClose = () => {
		setName("");
		setUrl("");
		setSelectedEvents([]);
		setShowSecret(false);
		setCreatedWebhook(null);
		setCopied(false);
		onClose();
	};

	if (createdWebhook) {
		return (
			<Dialog onOpenChange={handleClose} open={isOpen}>
				<DialogContent className="border-[#2A2F35] bg-[#0F1115] sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-[#F7F8F8]">
							<Check className="h-5 w-5 text-green-500" />
							Webhook Created
						</DialogTitle>
						<DialogDescription className="text-[#8A8F98]">
							Copy this secret now. You won&apos;t be able to see it again!
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
							<div className="flex items-start gap-3">
								<AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400" />
								<div>
									<p className="font-medium text-amber-200 text-sm">
										Webhook Secret
									</p>
									<p className="text-amber-200/70 text-sm">
										Use this secret to verify webhook signatures. Store it
										securely.
									</p>
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label className="text-[#8A8F98]">Webhook Secret</Label>
							<div className="flex gap-2">
								<code className="flex-1 rounded-md border border-[#2A2F35] bg-[#1A1D21] p-3 font-mono text-[#F7F8F8] text-sm">
									{showSecret
										? createdWebhook.secret
										: "•".repeat(createdWebhook.secret.length)}
								</code>
								<Button
									className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35]"
									onClick={() => setShowSecret(!showSecret)}
									size="icon"
									variant="outline"
								>
									{showSecret ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</Button>
								<Button
									className="bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
									onClick={handleCopy}
									size="icon"
								>
									{copied ? (
										<Check className="h-4 w-4" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							className="bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
							onClick={handleClose}
						>
							I&apos;ve Copied the Secret
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	const events = [
		{
			value: "ISSUE_CREATED",
			label: "Issue Created",
			description: "When a new issue is created",
		},
		{
			value: "ISSUE_UPDATED",
			label: "Issue Updated",
			description: "When an issue is modified",
		},
		{
			value: "ISSUE_DELETED",
			label: "Issue Deleted",
			description: "When an issue is deleted",
		},
	];

	return (
		<Dialog onOpenChange={handleClose} open={isOpen}>
			<DialogContent className="border-[#2A2F35] bg-[#0F1115] sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-[#F7F8F8]">Create Webhook</DialogTitle>
					<DialogDescription className="text-[#8A8F98]">
						Set up a webhook to receive real-time event notifications.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label className="text-[#8A8F98]" htmlFor="webhook-name">
								Name
							</Label>
							<Input
								autoFocus
								className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8] placeholder:text-[#8A8F98]"
								id="webhook-name"
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g., Slack Integration, CI/CD Pipeline"
								value={name}
							/>
						</div>

						<div className="space-y-2">
							<Label className="text-[#8A8F98]" htmlFor="webhook-url">
								URL
							</Label>
							<Input
								className="border-[#2A2F35] bg-[#1A1D21] text-[#F7F8F8] placeholder:text-[#8A8F98]"
								id="webhook-url"
								onChange={(e) => setUrl(e.target.value)}
								placeholder="https://api.example.com/webhook"
								type="url"
								value={url}
							/>
						</div>

						<div className="space-y-2">
							<Label className="text-[#8A8F98]">Events</Label>
							<div className="space-y-2">
								{events.map((event) => (
									<label
										className="flex cursor-pointer items-start gap-3 rounded-md border border-[#2A2F35] bg-[#1A1D21] p-3 transition-colors hover:bg-[#2A2F35]"
										key={event.value}
									>
										<input
											checked={selectedEvents.includes(event.value)}
											className="mt-1 h-4 w-4 rounded border-[#2A2F35] bg-[#0F1115] text-[#5E6AD2]"
											onChange={() => toggleEvent(event.value)}
											type="checkbox"
										/>
										<div>
											<p className="font-medium text-[#F7F8F8] text-sm">
												{event.label}
											</p>
											<p className="text-[#8A8F98] text-xs">
												{event.description}
											</p>
										</div>
									</label>
								))}
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
							onClick={handleClose}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							className="bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
							disabled={
								!name.trim() ||
								!url.trim() ||
								selectedEvents.length === 0 ||
								createMutation.isPending
							}
							type="submit"
						>
							{createMutation.isPending ? "Creating..." : "Create Webhook"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// Delete Webhook Dialog
function DeleteWebhookDialog({
	isOpen,
	onClose,
	webhook,
}: {
	isOpen: boolean;
	onClose: () => void;
	webhook: { id: string; name: string } | null;
}) {
	const utils = api.useUtils();
	const deleteMutation = api.apiKeys.deleteWebhook.useMutation({
		onSuccess: () => {
			void utils.apiKeys.listWebhooks.invalidate({
				workspaceId: "clz1234567890",
			});
			onClose();
		},
	});

	if (!webhook) return null;

	return (
		<Dialog onOpenChange={onClose} open={isOpen}>
			<DialogContent className="border-[#2A2F35] bg-[#0F1115] sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-[#F7F8F8]">Delete Webhook</DialogTitle>
					<DialogDescription className="text-[#8A8F98]">
						Are you sure you want to delete the webhook &quot;{webhook.name}
						&quot;? This action cannot be undone.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="mt-4">
					<Button
						className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
						onClick={onClose}
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						className="bg-red-600 text-white hover:bg-red-700"
						disabled={deleteMutation.isPending}
						onClick={() => deleteMutation.mutate({ id: webhook.id })}
					>
						{deleteMutation.isPending ? "Deleting..." : "Delete Webhook"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Revoke API Key Dialog
function RevokeApiKeyDialog({
	isOpen,
	onClose,
	apiKey,
}: {
	isOpen: boolean;
	onClose: () => void;
	apiKey: { id: string; name: string } | null;
}) {
	const utils = api.useUtils();
	const revokeMutation = api.apiKeys.revoke.useMutation({
		onSuccess: () => {
			void utils.apiKeys.list.invalidate({ workspaceId: "clz1234567890" });
			onClose();
		},
	});

	if (!apiKey) return null;

	return (
		<Dialog onOpenChange={onClose} open={isOpen}>
			<DialogContent className="border-[#2A2F35] bg-[#0F1115] sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-[#F7F8F8]">Revoke API Key</DialogTitle>
					<DialogDescription className="text-[#8A8F98]">
						Are you sure you want to revoke the API key &quot;{apiKey.name}
						&quot;? Any applications using this key will stop working
						immediately.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="mt-4">
					<Button
						className="border-[#2A2F35] bg-transparent text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
						onClick={onClose}
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						className="bg-red-600 text-white hover:bg-red-700"
						disabled={revokeMutation.isPending}
						onClick={() => revokeMutation.mutate({ id: apiKey.id })}
					>
						{revokeMutation.isPending ? "Revoking..." : "Revoke Key"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// API Documentation Component
function ApiDocumentation() {
	const baseUrl = "https://api.quadratic.app/v1";

	const endpoints = [
		{
			method: "GET",
			path: "/issues",
			description: "List all issues in your workspace",
			scopes: ["READ", "WRITE", "ADMIN"],
		},
		{
			method: "GET",
			path: "/issues/{id}",
			description: "Get a specific issue by ID",
			scopes: ["READ", "WRITE", "ADMIN"],
		},
		{
			method: "POST",
			path: "/issues",
			description: "Create a new issue",
			scopes: ["WRITE", "ADMIN"],
		},
		{
			method: "PATCH",
			path: "/issues/{id}",
			description: "Update an existing issue",
			scopes: ["WRITE", "ADMIN"],
		},
		{
			method: "DELETE",
			path: "/issues/{id}",
			description: "Delete an issue",
			scopes: ["ADMIN"],
		},
		{
			method: "GET",
			path: "/projects",
			description: "List all projects",
			scopes: ["READ", "WRITE", "ADMIN"],
		},
		{
			method: "GET",
			path: "/cycles",
			description: "List all cycles",
			scopes: ["READ", "WRITE", "ADMIN"],
		},
		{
			method: "GET",
			path: "/teams",
			description: "List all teams",
			scopes: ["READ", "WRITE", "ADMIN"],
		},
	];

	const webhookEvents = [
		{
			event: "issue.created",
			description: "Triggered when a new issue is created",
			payload: `{
  "event": "issue.created",
  "data": {
    "id": "issue_id",
    "identifier": "ENG-123",
    "title": "Issue Title",
    "status": "BACKLOG",
    ...
  }
}`,
		},
		{
			event: "issue.updated",
			description: "Triggered when an issue is updated",
			payload: `{
  "event": "issue.updated",
  "data": {
    "id": "issue_id",
    "changes": {
      "status": { "from": "BACKLOG", "to": "IN_PROGRESS" }
    }
  }
}`,
		},
		{
			event: "issue.deleted",
			description: "Triggered when an issue is deleted",
			payload: `{
  "event": "issue.deleted",
  "data": {
    "id": "issue_id",
    "identifier": "ENG-123"
  }
}`,
		},
	];

	return (
		<div className="space-y-6">
			{/* Authentication */}
			<section className="space-y-3">
				<h3 className="font-semibold text-[#F7F8F8] text-lg">Authentication</h3>
				<p className="text-[#8A8F98]">
					All API requests must include your API key in the Authorization
					header:
				</p>
				<code className="block rounded-md border border-[#2A2F35] bg-[#1A1D21] p-4 font-mono text-[#F7F8F8] text-sm">
					Authorization: Bearer {"<"}your_api_key{">"}
				</code>
			</section>

			{/* Base URL */}
			<section className="space-y-3">
				<h3 className="font-semibold text-[#F7F8F8] text-lg">Base URL</h3>
				<code className="block rounded-md border border-[#2A2F35] bg-[#1A1D21] p-4 font-mono text-[#F7F8F8] text-sm">
					{baseUrl}
				</code>
			</section>

			{/* Rate Limits */}
			<section className="space-y-3">
				<h3 className="font-semibold text-[#F7F8F8] text-lg">Rate Limits</h3>
				<p className="text-[#8A8F98]">
					API requests are limited to 1000 requests per hour per API key. Rate
					limit headers are included in all responses:
				</p>
				<ul className="list-inside list-disc space-y-1 text-[#8A8F98]">
					<li>X-RateLimit-Limit: Maximum requests allowed</li>
					<li>X-RateLimit-Remaining: Requests remaining in current window</li>
					<li>X-RateLimit-Reset: Unix timestamp when the window resets</li>
				</ul>
			</section>

			{/* Endpoints */}
			<section className="space-y-4">
				<h3 className="font-semibold text-[#F7F8F8] text-lg">Endpoints</h3>
				<div className="space-y-2">
					{endpoints.map((endpoint) => (
						<div
							className="flex items-center justify-between rounded-md border border-[#2A2F35] bg-[#1A1D21] p-4"
							key={endpoint.path}
						>
							<div className="flex items-center gap-4">
								<Badge
									className={`${
										endpoint.method === "GET"
											? "bg-blue-500/10 text-blue-400"
											: endpoint.method === "POST"
												? "bg-green-500/10 text-green-400"
												: endpoint.method === "PATCH"
													? "bg-amber-500/10 text-amber-400"
													: "bg-red-500/10 text-red-400"
									} border`}
									variant="outline"
								>
									{endpoint.method}
								</Badge>
								<code className="font-mono text-[#F7F8F8] text-sm">
									{endpoint.path}
								</code>
							</div>
							<div className="flex items-center gap-4">
								<p className="text-[#8A8F98] text-sm">{endpoint.description}</p>
								<div className="flex gap-1">
									{endpoint.scopes.map((scope) => (
										<Badge
											className="border-[#2A2F35] bg-transparent text-[#8A8F98] text-[10px]"
											key={scope}
											variant="outline"
										>
											{scope[0]}
										</Badge>
									))}
								</div>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Webhook Events */}
			<section className="space-y-4">
				<h3 className="font-semibold text-[#F7F8F8] text-lg">Webhook Events</h3>
				<div className="space-y-4">
					{webhookEvents.map((event) => (
						<div
							className="space-y-2 rounded-md border border-[#2A2F35] bg-[#1A1D21] p-4"
							key={event.event}
						>
							<div className="flex items-center gap-2">
								<code className="font-mono text-[#5E6AD2] text-sm">
									{event.event}
								</code>
								<span className="text-[#8A8F98] text-sm">
									- {event.description}
								</span>
							</div>
							<pre className="overflow-x-auto rounded-md bg-[#0F1115] p-3 font-mono text-[#8A8F98] text-xs">
								{event.payload}
							</pre>
						</div>
					))}
				</div>
			</section>

			{/* Webhook Verification */}
			<section className="space-y-3">
				<h3 className="font-semibold text-[#F7F8F8] text-lg">
					Webhook Verification
				</h3>
				<p className="text-[#8A8F98]">
					Webhooks include a signature header to verify authenticity. Use your
					webhook secret to verify the HMAC-SHA256 signature:
				</p>
				<pre className="overflow-x-auto rounded-md border border-[#2A2F35] bg-[#1A1D21] p-4 font-mono text-[#8A8F98] text-xs">
					{`const crypto = require('crypto');

const signature = req.headers['x-webhook-signature'];
const payload = JSON.stringify(req.body);

const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}`}
				</pre>
			</section>
		</div>
	);
}

// Main Page Component
export default function ApiKeysPage() {
	const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
	const [isCreateWebhookModalOpen, setIsCreateWebhookModalOpen] =
		useState(false);
	const [revokingKey, setRevokingKey] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [deletingWebhook, setDeletingWebhook] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [activeTab, setActiveTab] = useState("api-keys");

	const workspaceId = "clz1234567890";

	const { data: apiKeys, isLoading: isLoadingKeys } = api.apiKeys.list.useQuery(
		{ workspaceId },
	);
	const { data: webhooks, isLoading: isLoadingWebhooks } =
		api.apiKeys.listWebhooks.useQuery({
			workspaceId,
		});

	return (
		<div className="mx-auto max-w-4xl p-8">
			<div className="mb-8">
				<h1 className="mb-2 font-semibold text-2xl text-[#F7F8F8]">
					API Keys &amp; Webhooks
				</h1>
				<p className="text-[#8A8F98]">
					Manage API access and integrations for your workspace
				</p>
			</div>

			<Tabs
				className="space-y-6"
				onValueChange={setActiveTab}
				value={activeTab}
			>
				<TabsList className="border-[#2A2F35] bg-[#16181D]">
					<TabsTrigger
						className="data-[state=active]:bg-[#5E6AD2] data-[state=active]:text-white"
						value="api-keys"
					>
						<Key className="mr-2 h-4 w-4" />
						API Keys
					</TabsTrigger>
					<TabsTrigger
						className="data-[state=active]:bg-[#5E6AD2] data-[state=active]:text-white"
						value="webhooks"
					>
						<Webhook className="mr-2 h-4 w-4" />
						Webhooks
					</TabsTrigger>
					<TabsTrigger
						className="data-[state=active]:bg-[#5E6AD2] data-[state=active]:text-white"
						value="docs"
					>
						<Link className="mr-2 h-4 w-4" />
						Documentation
					</TabsTrigger>
				</TabsList>

				{/* API Keys Tab */}
				<TabsContent className="space-y-6" value="api-keys">
					<Card className="border-[#2A2F35] bg-[#0F1115]">
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle className="text-[#F7F8F8]">API Keys</CardTitle>
								<CardDescription className="text-[#8A8F98]">
									Manage API keys for external integrations
								</CardDescription>
							</div>
							<Button
								className="gap-2 bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
								onClick={() => setIsCreateKeyModalOpen(true)}
							>
								<Plus className="h-4 w-4" />
								Create API Key
							</Button>
						</CardHeader>
						<CardContent>
							{isLoadingKeys ? (
								<div className="space-y-2">
									<div className="h-16 animate-pulse rounded-md bg-[#1A1D21]" />
									<div className="h-16 animate-pulse rounded-md bg-[#1A1D21]" />
									<div className="h-16 animate-pulse rounded-md bg-[#1A1D21]" />
								</div>
							) : apiKeys?.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2A2F35]">
										<Key className="h-6 w-6 text-[#8A8F98]" />
									</div>
									<h3 className="mb-1 font-medium text-[#F7F8F8]">
										No API keys yet
									</h3>
									<p className="max-w-sm text-[#8A8F98] text-sm">
										Create an API key to integrate Quadratic with external tools
										and services.
									</p>
								</div>
							) : (
								<div className="divide-y divide-[#2A2F35]">
									{apiKeys?.map((key) => (
										<div
											className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
											key={key.id}
										>
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													<span className="font-medium text-[#F7F8F8]">
														{key.name}
													</span>
													<ScopeBadge scope={key.scope} />
												</div>
												<div className="flex items-center gap-3 text-[#8A8F98] text-sm">
													<code className="font-mono">{key.keyPrefix}...</code>
													<span>•</span>
													<span>
														Created{" "}
														{format(new Date(key.createdAt), "MMM d, yyyy")}
													</span>
													{key.expiresAt && (
														<>
															<span>•</span>
															<span className="text-amber-400">
																Expires{" "}
																{format(new Date(key.expiresAt), "MMM d, yyyy")}
															</span>
														</>
													)}
													{key.lastUsedAt && (
														<>
															<span>•</span>
															<span>
																Last used{" "}
																{format(new Date(key.lastUsedAt), "MMM d")}
															</span>
														</>
													)}
												</div>
											</div>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														className="h-8 w-8 text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
														size="icon"
														variant="ghost"
													>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent className="border-[#2A2F35] bg-[#1A1D21]">
													<DropdownMenuItem
														className="text-red-400 hover:bg-[#2A2F35] hover:text-red-300 focus:bg-[#2A2F35] focus:text-red-300"
														onClick={() =>
															setRevokingKey({ id: key.id, name: key.name })
														}
													>
														<Trash2 className="mr-2 h-4 w-4" />
														Revoke Key
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Webhooks Tab */}
				<TabsContent className="space-y-6" value="webhooks">
					<Card className="border-[#2A2F35] bg-[#0F1115]">
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle className="text-[#F7F8F8]">Webhooks</CardTitle>
								<CardDescription className="text-[#8A8F98]">
									Receive real-time event notifications via HTTP callbacks
								</CardDescription>
							</div>
							<Button
								className="gap-2 bg-[#5E6AD2] text-white hover:bg-[#4E5AC2]"
								onClick={() => setIsCreateWebhookModalOpen(true)}
							>
								<Plus className="h-4 w-4" />
								Create Webhook
							</Button>
						</CardHeader>
						<CardContent>
							{isLoadingWebhooks ? (
								<div className="space-y-2">
									<div className="h-20 animate-pulse rounded-md bg-[#1A1D21]" />
									<div className="h-20 animate-pulse rounded-md bg-[#1A1D21]" />
									<div className="h-20 animate-pulse rounded-md bg-[#1A1D21]" />
								</div>
							) : webhooks?.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2A2F35]">
										<Webhook className="h-6 w-6 text-[#8A8F98]" />
									</div>
									<h3 className="mb-1 font-medium text-[#F7F8F8]">
										No webhooks yet
									</h3>
									<p className="max-w-sm text-[#8A8F98] text-sm">
										Create a webhook to receive real-time notifications when
										events occur in your workspace.
									</p>
								</div>
							) : (
								<div className="divide-y divide-[#2A2F35]">
									{webhooks?.map((webhook) => (
										<div
											className="flex items-start justify-between py-4 first:pt-0 last:pb-0"
											key={webhook.id}
										>
											<div className="space-y-2">
												<div className="flex items-center gap-2">
													<span className="font-medium text-[#F7F8F8]">
														{webhook.name}
													</span>
													<WebhookStatusBadge status={webhook.status} />
												</div>
												<code className="block font-mono text-[#8A8F98] text-sm">
													{webhook.url}
												</code>
												<div className="flex items-center gap-2">
													{(webhook.events as string[]).map((event) => (
														<Badge
															className="border-[#2A2F35] bg-[#5E6AD2]/10 text-[#5E6AD2]"
															key={event}
															variant="outline"
														>
															{event.toLowerCase().replace("_", ".")}
														</Badge>
													))}
												</div>
												<div className="text-[#8A8F98] text-sm">
													{webhook._count.deliveries} deliveries in the last 30
													days
												</div>
											</div>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														className="h-8 w-8 text-[#8A8F98] hover:bg-[#2A2F35] hover:text-[#F7F8F8]"
														size="icon"
														variant="ghost"
													>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent className="border-[#2A2F35] bg-[#1A1D21]">
													<DropdownMenuItem
														className="text-[#F7F8F8] hover:bg-[#2A2F35] focus:bg-[#2A2F35]"
														onClick={() => {
															// Toggle status logic would go here
														}}
													>
														<RefreshCw className="mr-2 h-4 w-4" />
														{webhook.status === "ACTIVE" ? "Pause" : "Resume"}
													</DropdownMenuItem>
													<DropdownMenuItem
														className="text-red-400 hover:bg-[#2A2F35] hover:text-red-300 focus:bg-[#2A2F35] focus:text-red-300"
														onClick={() =>
															setDeletingWebhook({
																id: webhook.id,
																name: webhook.name,
															})
														}
													>
														<Trash2 className="mr-2 h-4 w-4" />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Documentation Tab */}
				<TabsContent value="docs">
					<Card className="border-[#2A2F35] bg-[#0F1115]">
						<CardHeader>
							<CardTitle className="text-[#F7F8F8]">
								API Documentation
							</CardTitle>
							<CardDescription className="text-[#8A8F98]">
								Learn how to integrate with the Quadratic API
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ApiDocumentation />
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Modals */}
			<CreateApiKeyModal
				isOpen={isCreateKeyModalOpen}
				onClose={() => setIsCreateKeyModalOpen(false)}
			/>
			<CreateWebhookModal
				isOpen={isCreateWebhookModalOpen}
				onClose={() => setIsCreateWebhookModalOpen(false)}
			/>
			<RevokeApiKeyDialog
				apiKey={revokingKey}
				isOpen={!!revokingKey}
				onClose={() => setRevokingKey(null)}
			/>
			<DeleteWebhookDialog
				isOpen={!!deletingWebhook}
				onClose={() => setDeletingWebhook(null)}
				webhook={deletingWebhook}
			/>
		</div>
	);
}
