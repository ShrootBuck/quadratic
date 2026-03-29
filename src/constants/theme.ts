/**
 * Priority colors for UI indicators and badges
 */
export const PRIORITY_COLORS = {
	NO_PRIORITY: {
		text: "text-gray-500",
		bg: "bg-gray-500/10",
		border: "border-gray-500/20",
		hex: "#8A8F98",
	},
	LOW: {
		text: "text-blue-500",
		bg: "bg-blue-500/10",
		border: "border-blue-500/20",
		hex: "#5E6AD2",
	},
	MEDIUM: {
		text: "text-yellow-500",
		bg: "bg-yellow-500/10",
		border: "border-yellow-500/20",
		hex: "#F59E0B",
	},
	HIGH: {
		text: "text-orange-500",
		bg: "bg-orange-500/10",
		border: "border-orange-500/20",
		hex: "#F97316",
	},
	URGENT: {
		text: "text-red-500",
		bg: "bg-red-500/10",
		border: "border-red-500/20",
		hex: "#EF4444",
	},
} as const;

/**
 * Status colors for UI indicators
 */
export const STATUS_COLORS = {
	BACKLOG: {
		text: "text-gray-500",
		bg: "bg-gray-500/10",
		hex: "#8A8F98",
	},
	TODO: {
		text: "text-gray-400",
		bg: "bg-gray-400/10",
		hex: "#8A8F98",
	},
	IN_PROGRESS: {
		text: "text-blue-500",
		bg: "bg-blue-500/10",
		hex: "#5E6AD2",
	},
	DONE: {
		text: "text-green-500",
		bg: "bg-green-500/10",
		hex: "#4EC9B0",
	},
	CANCELLED: {
		text: "text-red-400",
		bg: "bg-red-400/10",
		hex: "#F87171",
	},
} as const;

/**
 * Label color palette options
 */
export const LABEL_COLOR_OPTIONS = [
	{ name: "Slate", bg: "bg-slate-500", text: "text-slate-500", hex: "#64748b" },
	{ name: "Red", bg: "bg-red-500", text: "text-red-500", hex: "#ef4444" },
	{
		name: "Orange",
		bg: "bg-orange-500",
		text: "text-orange-500",
		hex: "#f97316",
	},
	{ name: "Amber", bg: "bg-amber-500", text: "text-amber-500", hex: "#f59e0b" },
	{
		name: "Yellow",
		bg: "bg-yellow-500",
		text: "text-yellow-500",
		hex: "#eab308",
	},
	{ name: "Lime", bg: "bg-lime-500", text: "text-lime-500", hex: "#84cc16" },
	{ name: "Green", bg: "bg-green-500", text: "text-green-500", hex: "#22c55e" },
	{
		name: "Emerald",
		bg: "bg-emerald-500",
		text: "text-emerald-500",
		hex: "#10b981",
	},
	{ name: "Teal", bg: "bg-teal-500", text: "text-teal-500", hex: "#14b8a6" },
	{ name: "Cyan", bg: "bg-cyan-500", text: "text-cyan-500", hex: "#06b6d4" },
	{ name: "Sky", bg: "bg-sky-500", text: "text-sky-500", hex: "#0ea5e9" },
	{ name: "Blue", bg: "bg-blue-500", text: "text-blue-500", hex: "#3b82f6" },
	{
		name: "Indigo",
		bg: "bg-indigo-500",
		text: "text-indigo-500",
		hex: "#6366f1",
	},
	{
		name: "Violet",
		bg: "bg-violet-500",
		text: "text-violet-500",
		hex: "#8b5cf6",
	},
	{
		name: "Purple",
		bg: "bg-purple-500",
		text: "text-purple-500",
		hex: "#a855f7",
	},
	{
		name: "Fuchsia",
		bg: "bg-fuchsia-500",
		text: "text-fuchsia-500",
		hex: "#d946ef",
	},
	{ name: "Pink", bg: "bg-pink-500", text: "text-pink-500", hex: "#ec4899" },
	{ name: "Rose", bg: "bg-rose-500", text: "text-rose-500", hex: "#f43f5e" },
] as const;

/**
 * Default label color index
 */
export const DEFAULT_LABEL_COLOR_INDEX = 10;

/**
 * Linear-inspired color palette
 */
export const THEME_COLORS = {
	background: {
		dark: "#0F1115",
		light: "#FFFFFF",
	},
	border: {
		dark: "#2A2F35",
		light: "#E5E7EB",
	},
	text: {
		primary: "#F7F8F8",
		secondary: "#8A8F98",
	},
	accent: {
		primary: "#5E6AD2",
	},
} as const;
