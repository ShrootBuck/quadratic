import type { IssueStatus, Priority } from "./enums";

/**
 * Default values for various entities
 */

// Issue defaults
export const DEFAULT_ISSUE_STATUS: IssueStatus = "BACKLOG";
export const DEFAULT_ISSUE_PRIORITY: Priority = "NO_PRIORITY";
export const DEFAULT_ISSUE_TYPE = "TASK";

// Template defaults
export const DEFAULT_TEMPLATE_PRIORITY: Priority = "MEDIUM";

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 50;

// Array index defaults
export const CURRENT_CYCLE_INDEX = 0;
export const FIRST_ITEM_INDEX = 0;

// Sorting defaults
export const DEFAULT_SORT_FIELD = "createdAt";
export const DEFAULT_SORT_ORDER = "desc" as const;
