"use client";

import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "~/trpc/react";

interface IssueCommentsProps {
	issueId: string;
}

export function IssueComments({ issueId }: IssueCommentsProps) {
	const [newComment, setNewComment] = useState("");
	const utils = api.useUtils();

	const { data: issue } = api.issue.byId.useQuery(
		{ id: issueId },
		{ enabled: !!issueId },
	);

	const createCommentMutation = api.issue.createComment.useMutation({
		onSuccess: () => {
			utils.issue.byId.invalidate({ id: issueId });
			setNewComment("");
		},
	});

	const handleSubmit = () => {
		if (!newComment.trim()) return;
		createCommentMutation.mutate({ issueId, content: newComment });
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<MessageSquare className="h-5 w-5 text-[#8A8F98]" />
				<h3 className="font-semibold text-[#F7F8F8]">Comments</h3>
				<span className="rounded-full bg-[#2A2F35] px-2 py-0.5 text-[#8A8F98] text-xs">
					{issue?.comments.length ?? 0}
				</span>
			</div>

			{/* Comment Input */}
			<div className="space-y-3">
				<Textarea
					className="min-h-[100px] border-[#2A2F35] bg-[#16181D] text-[#F7F8F8] placeholder:text-[#8A8F98] focus:border-[#5E6AD2]"
					onChange={(e) => setNewComment(e.target.value)}
					placeholder="Add a comment..."
					value={newComment}
				/>
				<div className="flex justify-end">
					<Button
						className="bg-[#5E6AD2] text-white hover:bg-[#4F57B3]"
						disabled={!newComment.trim() || createCommentMutation.isPending}
						onClick={handleSubmit}
					>
						<Send className="mr-2 h-4 w-4" />
						Comment
					</Button>
				</div>
			</div>

			{/* Comments List */}
			<div className="space-y-4">
				{issue?.comments.map((comment) => (
					<div className="flex gap-3" key={comment.id}>
						<Avatar className="h-8 w-8 shrink-0">
							<AvatarImage src={comment.author.image ?? undefined} />
							<AvatarFallback className="bg-[#5E6AD2] text-white text-xs">
								{comment.author.name?.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 space-y-1">
							<div className="flex items-center gap-2">
								<span className="font-medium text-[#F7F8F8] text-sm">
									{comment.author.name}
								</span>
								<span className="text-[#8A8F98] text-xs">
									{formatDistanceToNow(new Date(comment.createdAt), {
										addSuffix: true,
									})}
								</span>
							</div>
							<div className="rounded-lg border border-[#2A2F35] bg-[#0F1115] p-3">
								<p className="whitespace-pre-wrap text-[#F7F8F8] text-sm">
									{comment.content}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
