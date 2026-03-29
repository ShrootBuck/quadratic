"use client";

import { useCallback, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmOptions {
	title: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: "destructive" | "default";
}

interface ConfirmState extends ConfirmOptions {
	isOpen: boolean;
	resolve: ((value: boolean) => void) | null;
}

export function useConfirm() {
	const [state, setState] = useState<ConfirmState>({
		isOpen: false,
		title: "",
		description: "",
		confirmLabel: "Confirm",
		cancelLabel: "Cancel",
		variant: "default",
		resolve: null,
	});

	const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
		return new Promise((resolve) => {
			setState({
				...options,
				isOpen: true,
				confirmLabel: options.confirmLabel || "Confirm",
				cancelLabel: options.cancelLabel || "Cancel",
				variant: options.variant || "default",
				resolve,
			});
		});
	}, []);

	const handleConfirm = useCallback(() => {
		if (state.resolve) {
			state.resolve(true);
		}
		setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
	}, [state.resolve]);

	const handleCancel = useCallback(() => {
		if (state.resolve) {
			state.resolve(false);
		}
		setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
	}, [state.resolve]);

	const ConfirmDialog = useCallback(() => {
		return (
			<AlertDialog onOpenChange={handleCancel} open={state.isOpen}>
				<AlertDialogContent className="border-[#2A2F35] bg-[#1A1D21]">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-[#F7F8F8]">
							{state.title}
						</AlertDialogTitle>
						{state.description && (
							<AlertDialogDescription className="text-[#8A8F98]">
								{state.description}
							</AlertDialogDescription>
						)}
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="border-[#2A2F35] bg-transparent text-[#F7F8F8] hover:bg-[#2A2F35]">
							{state.cancelLabel}
						</AlertDialogCancel>
						<AlertDialogAction
							className={
								state.variant === "destructive"
									? "bg-red-600 hover:bg-red-700"
									: "bg-[#5E6AD2] hover:bg-[#5E6AD2]/90"
							}
							onClick={handleConfirm}
						>
							{state.confirmLabel}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		);
	}, [state, handleConfirm, handleCancel]);

	return { confirm, ConfirmDialog };
}
