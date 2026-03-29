import { db } from "@/server/db";

// Simple in-memory cache for GitHub API responses
interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

let lastRequestTime = 0;

// Parse GitHub PR URL to extract owner, repo, and PR number
export function parseGitHubUrl(
	url: string,
): { owner: string; repo: string; number: number } | null {
	const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
	if (!match || !match[1] || !match[2] || !match[3]) return null;
	return {
		owner: match[1],
		repo: match[2],
		number: Number.parseInt(match[3], 10),
	};
}

// Rate limiting helper
async function rateLimit(): Promise<void> {
	const now = Date.now();
	const timeSinceLastRequest = now - lastRequestTime;
	if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
		await new Promise((resolve) =>
			setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest),
		);
	}
	lastRequestTime = Date.now();
}

// Cache helper
function getCached<T>(key: string): T | null {
	const entry = cache.get(key);
	if (!entry) return null;
	if (Date.now() - entry.timestamp > CACHE_TTL) {
		cache.delete(key);
		return null;
	}
	return entry.data as T;
}

function setCached<T>(key: string, data: T): void {
	cache.set(key, { data, timestamp: Date.now() });
}

// GitHub PR data interface
export interface GitHubPullRequestData {
	id: number;
	number: number;
	title: string;
	state: "open" | "closed";
	merged: boolean;
	draft: boolean;
	html_url: string;
	head: {
		ref: string;
	};
	base: {
		ref: string;
	};
	user: {
		login: string;
	};
	merged_at: string | null;
	created_at: string;
	updated_at: string;
}

// Fetch PR data from GitHub API
export async function fetchPullRequest(
	owner: string,
	repo: string,
	number: number,
): Promise<GitHubPullRequestData | null> {
	const cacheKey = `pr:${owner}/${repo}/${number}`;
	const cached = getCached<GitHubPullRequestData>(cacheKey);
	if (cached) return cached;

	await rateLimit();

	try {
		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
			{
				headers: {
					Accept: "application/vnd.github.v3+json",
					"User-Agent": "Quadratic-App",
				},
			},
		);

		if (!response.ok) {
			if (response.status === 404) return null;
			throw new Error(`GitHub API error: ${response.status}`);
		}

		const data = (await response.json()) as GitHubPullRequestData;
		setCached(cacheKey, data);
		return data;
	} catch (error) {
		console.error("Error fetching GitHub PR:", error);
		return null;
	}
}

// Fetch PR data from URL
export async function fetchPullRequestFromUrl(
	url: string,
): Promise<GitHubPullRequestData | null> {
	const parsed = parseGitHubUrl(url);
	if (!parsed) return null;
	return fetchPullRequest(parsed.owner, parsed.repo, parsed.number);
}

// Sync PR data to database
export async function syncPullRequestToDb(
	issueId: string,
	workspaceId: string,
	prData: GitHubPullRequestData,
): Promise<void> {
	const status = prData.merged
		? "MERGED"
		: prData.draft
			? "DRAFT"
			: prData.state === "open"
				? "OPEN"
				: "CLOSED";

	await db.gitHubPullRequest.upsert({
		where: {
			issueId_githubId: {
				issueId,
				githubId: String(prData.id),
			},
		},
		create: {
			githubId: String(prData.id),
			number: prData.number,
			title: prData.title,
			url: prData.html_url,
			status,
			branch: prData.head.ref,
			baseBranch: prData.base.ref,
			author: prData.user.login,
			repository: `${prData.html_url.split("/").slice(3, 5).join("/")}`,
			mergedAt: prData.merged_at ? new Date(prData.merged_at) : null,
			issueId,
			workspaceId,
		},
		update: {
			title: prData.title,
			status,
			branch: prData.head.ref,
			mergedAt: prData.merged_at ? new Date(prData.merged_at) : null,
		},
	});
}

// Generate branch name from issue
export function generateBranchName(identifier: string, title: string): string {
	// Convert title to kebab-case
	const slug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 50);

	return `feature/${identifier}-${slug}`;
}

// Extract issue references from commit message
export function extractIssueReferences(message: string): string[] {
	// Match patterns like "fixes ENG-123", "closes ENG-123", "ENG-123"
	const regex = /(?:fixes|closes|resolves|fix|close|resolve)?\s*([A-Z]+-\d+)/gi;
	const matches: string[] = [];

	let match = regex.exec(message);
	while (match !== null) {
		if (match[1]) {
			matches.push(match[1].toUpperCase());
		}
		match = regex.exec(message);
	}

	return [...new Set(matches)]; // Remove duplicates
}

// Refresh PR status for an issue
export async function refreshPullRequestStatus(issueId: string): Promise<void> {
	const prs = await db.gitHubPullRequest.findMany({
		where: { issueId },
	});

	for (const pr of prs) {
		const parsed = parseGitHubUrl(pr.url);
		if (!parsed) continue;

		const freshData = await fetchPullRequest(
			parsed.owner,
			parsed.repo,
			parsed.number,
		);
		if (freshData) {
			await syncPullRequestToDb(issueId, pr.workspaceId, freshData);
		}
	}
}
