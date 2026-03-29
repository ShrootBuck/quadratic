"use client";

import { Check, Clock, X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

interface EstimatedTimeEditorProps {
	issueId: string;
	currentEstimate: number | null | undefined;
}

export function EstimatedTimeEditor({
	issueId,
	currentEstimate,
}: EstimatedTimeEditorProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [estimatedTime, setEstimatedTime] = useState(
		currentEstimate?.toString() ?? "",
	);

	const updateEstimatedTime = api.timeTracking.updateEstimatedTime.useMutation({
		onSuccess: () => {
			setIsEditing(false);
		},
	});

	const handleSave = () => {
		const value =
			estimatedTime.trim() === "" ? null : parseFloat(estimatedTime);
		if (value !== null && (Number.isNaN(value) || value < 0)) return;

		updateEstimatedTime.mutate({
			issueId,
			estimatedTime: value,
		});
	};

	const handleCancel = () => {
		setEstimatedTime(currentEstimate?.toString() ?? "");
		setIsEditing(false);
	};

	if (isEditing) {
		return (
			<div className="flex items-center gap-2">
				<div className="relative">
					<Input
						autoFocus
						className="w-24 pr-8"
						min="0"
						onChange={(e) => setEstimatedTime(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSave();
							if (e.key === "Escape") handleCancel();
						}}
						placeholder="Hours"
						step="0.5"
						type="number"
						value={estimatedTime}
					/>
					<span className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground text-xs">
						h
					</span>
				</div>
				<Button
					className="h-8 w-8"
					disabled={updateEstimatedTime.isPending}
					onClick={handleSave}
					size="icon"
					variant="ghost"
				>
					<Check className="h-4 w-4" />
				</Button>
				<Button
					className="h-8 w-8"
					onClick={handleCancel}
					size="icon"
					variant="ghost"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
		);
	}

	return (
		<Button
			className="h-8 gap-2 text-muted-foreground hover:text-foreground"
			onClick={() => setIsEditing(true)}
			size="sm"
			variant="ghost"
		>
			<Clock className="h-4 w-4" />
			{currentEstimate ? `${currentEstimate}h estimated` : "Set estimate"}
		</Button>
	);
}
