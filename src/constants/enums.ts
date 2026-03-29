/**
 * Issue status enum values
 */
export const IssueStatus = {
	BACKLOG: "BACKLOG",
	TODO: "TODO",
	IN_PROGRESS: "IN_PROGRESS",
	DONE: "DONE",
	CANCELLED: "CANCELLED",
} as const;

export type IssueStatus = (typeof IssueStatus)[keyof typeof IssueStatus];

/**
 * Issue priority enum values
 */
export const Priority = {
	NO_PRIORITY: "NO_PRIORITY",
	LOW: "LOW",
	MEDIUM: "MEDIUM",
	HIGH: "HIGH",
	URGENT: "URGENT",
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

/**
 * Issue type enum values
 */
export const IssueType = {
	BUG: "BUG",
	FEATURE: "FEATURE",
	IMPROVEMENT: "IMPROVEMENT",
	TASK: "TASK",
} as const;

export type IssueType = (typeof IssueType)[keyof typeof IssueType];

/**
 * Custom field type enum values
 */
export const CustomFieldType = {
	TEXT: "TEXT",
	NUMBER: "NUMBER",
	SELECT: "SELECT",
	MULTI_SELECT: "MULTI_SELECT",
	DATE: "DATE",
	URL: "URL",
} as const;

export type CustomFieldType =
	(typeof CustomFieldType)[keyof typeof CustomFieldType];

/**
 * Automation trigger type enum values
 */
export const AutomationTriggerType = {
	ISSUE_CREATED: "ISSUE_CREATED",
	ISSUE_UPDATED: "ISSUE_UPDATED",
	ISSUE_STATUS_CHANGED: "ISSUE_STATUS_CHANGED",
	ISSUE_ASSIGNED: "ISSUE_ASSIGNED",
	DUE_DATE_APPROACHING: "DUE_DATE_APPROACHING",
} as const;

export type AutomationTriggerType =
	(typeof AutomationTriggerType)[keyof typeof AutomationTriggerType];

/**
 * Automation action type enum values
 */
export const AutomationActionType = {
	SET_STATUS: "SET_STATUS",
	SET_PRIORITY: "SET_PRIORITY",
	SET_ASSIGNEE: "SET_ASSIGNEE",
	ADD_LABEL: "ADD_LABEL",
	REMOVE_LABEL: "REMOVE_LABEL",
	SEND_NOTIFICATION: "SEND_NOTIFICATION",
} as const;

export type AutomationActionType =
	(typeof AutomationActionType)[keyof typeof AutomationActionType];

/**
 * Notification type enum values
 */
export const NotificationType = {
	ISSUE_ASSIGNED: "ISSUE_ASSIGNED",
	ISSUE_MENTIONED: "ISSUE_MENTIONED",
	ISSUE_STATUS_CHANGED: "ISSUE_STATUS_CHANGED",
	ISSUE_COMMENTED: "ISSUE_COMMENTED",
	CYCLE_STARTED: "CYCLE_STARTED",
	CYCLE_ENDING: "CYCLE_ENDING",
} as const;

export type NotificationType =
	(typeof NotificationType)[keyof typeof NotificationType];
