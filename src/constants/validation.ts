/**
 * Validation constraints for form inputs and API validation
 */

// Issue title constraints
export const ISSUE_TITLE_MIN = 1;
export const ISSUE_TITLE_MAX = 500;

// Issue description constraints
export const ISSUE_DESCRIPTION_MAX = 10000;

// Custom field name constraints
export const CUSTOM_FIELD_NAME_MIN = 1;
export const CUSTOM_FIELD_NAME_MAX = 50;

// Custom field description constraints
export const CUSTOM_FIELD_DESC_MAX = 200;

// API key name constraints
export const API_KEY_NAME_MIN = 1;
export const API_KEY_NAME_MAX = 100;

// API key expiry constraints (in days)
export const API_KEY_EXPIRY_MIN = 1;
export const API_KEY_EXPIRY_MAX = 365;

// Team name constraints
export const TEAM_NAME_MIN = 1;
export const TEAM_NAME_MAX = 100;

// Team key constraints
export const TEAM_KEY_MIN = 1;
export const TEAM_KEY_MAX = 10;

// Label name constraints
export const LABEL_NAME_MIN = 1;
export const LABEL_NAME_MAX = 50;

// Template name constraints
export const TEMPLATE_NAME_MIN = 1;
export const TEMPLATE_NAME_MAX = 100;

// Template description constraints
export const TEMPLATE_DESC_MAX = 500;

// Template title constraints
export const TEMPLATE_TITLE_MAX = 500;

// Workspace name constraints
export const WORKSPACE_NAME_MIN = 1;
export const WORKSPACE_NAME_MAX = 100;

// Workspace slug constraints
export const WORKSPACE_SLUG_MIN = 1;
export const WORKSPACE_SLUG_MAX = 50;

// Cycle name constraints
export const CYCLE_NAME_MIN = 1;
export const CYCLE_NAME_MAX = 100;

// Cycle description constraints
export const CYCLE_DESC_MAX = 500;

// Project name constraints
export const PROJECT_NAME_MIN = 1;
export const PROJECT_NAME_MAX = 100;

// Project description constraints
export const PROJECT_DESC_MAX = 1000;

// Automation name constraints
export const AUTOMATION_NAME_MIN = 1;
export const AUTOMATION_NAME_MAX = 100;

// Comment content constraints
export const COMMENT_CONTENT_MIN = 1;
export const COMMENT_CONTENT_MAX = 5000;

// Cycle key constraints (e.g., C-1, C-2)
export const CYCLE_KEY_MAX = 20;

// Issue identifier number max
export const ISSUE_IDENTIFIER_MAX = 1000000;
