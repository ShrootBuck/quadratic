"use client";

import { api } from "~/trpc/react";

export function useCurrentWorkspace() {
	const { data: workspace, isLoading } = api.workspace.getCurrent.useQuery();

	return {
		workspaceId: workspace?.id,
		workspace,
		isLoading,
	};
}
