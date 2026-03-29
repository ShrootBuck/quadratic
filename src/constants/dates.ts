/**
 * Date format strings for consistent date display
 */

// Short date format: "Jan 15"
export const DATE_FORMAT_SHORT = "MMM d";

// Medium date format: "Jan 15, 2024"
export const DATE_FORMAT_MEDIUM = "MMM d, yyyy";

// Long date format: "January 15, 2024"
export const DATE_FORMAT_LONG = "MMMM d, yyyy";

// ISO date format: "2024-01-15"
export const DATE_FORMAT_ISO = "yyyy-MM-dd";

// DateTime format: "Jan 15, 2024 2:30 PM"
export const DATE_FORMAT_DATETIME = "MMM d, yyyy h:mm a";

// Relative time thresholds (in seconds)
export const RELATIVE_TIME_THRESHOLDS = {
	JUST_NOW: 60, // less than 1 minute
	MINUTES: 3600, // less than 1 hour
	HOURS: 86400, // less than 1 day
	DAYS: 604800, // less than 1 week
	WEEKS: 2592000, // less than 1 month
} as const;
