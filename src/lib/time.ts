/**
 * Format a duration in hours to a human-readable string
 */
export function formatDuration(hours: number): string {
	if (hours === 0) return "0h";

	const wholeHours = Math.floor(hours);
	const minutes = Math.round((hours - wholeHours) * 60);

	if (wholeHours === 0) {
		return `${minutes}m`;
	}

	if (minutes === 0) {
		return `${wholeHours}h`;
	}

	return `${wholeHours}h ${minutes}m`;
}

/**
 * Format a duration in seconds to HH:MM:SS format
 */
export function formatTimerDisplay(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format a date to a relative time string (e.g., "2 hours ago")
 */
export function formatTimeAgo(date: Date | string): string {
	const now = new Date();
	const then = new Date(date);
	const diffInMs = now.getTime() - then.getTime();
	const diffInSecs = Math.floor(diffInMs / 1000);
	const diffInMins = Math.floor(diffInSecs / 60);
	const diffInHours = Math.floor(diffInMins / 60);
	const diffInDays = Math.floor(diffInHours / 24);

	if (diffInSecs < 60) {
		return "just now";
	}
	if (diffInMins < 60) {
		return `${diffInMins} minute${diffInMins === 1 ? "" : "s"} ago`;
	}
	if (diffInHours < 24) {
		return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
	}
	if (diffInDays < 30) {
		return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
	}

	// Fall back to date string
	return then.toLocaleDateString();
}

/**
 * Format hours to decimal with 2 decimal places
 */
export function formatHoursDecimal(hours: number): string {
	return hours.toFixed(2);
}
