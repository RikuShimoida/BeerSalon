"use client";

import { useState, useTransition } from "react";
import { togglePostLike } from "@/actions/post";

type LikeButtonProps = {
	postId: bigint;
	initialLikeCount: number;
	initialIsLiked: boolean;
};

export function LikeButton({
	postId,
	initialLikeCount,
	initialIsLiked,
}: LikeButtonProps) {
	const [isLiked, setIsLiked] = useState(initialIsLiked);
	const [likeCount, setLikeCount] = useState(initialLikeCount);
	const [isPending, startTransition] = useTransition();

	const handleLike = () => {
		setIsLiked(!isLiked);
		setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

		startTransition(async () => {
			try {
				await togglePostLike(postId);
			} catch (error) {
				setIsLiked(isLiked);
				setLikeCount(isLiked ? likeCount + 1 : likeCount - 1);
				console.error("Failed to toggle like:", error);
			}
		});
	};

	return (
		<button
			type="button"
			onClick={handleLike}
			disabled={isPending}
			className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
			aria-label={isLiked ? "いいねを取り消す" : "いいね"}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill={isLiked ? "currentColor" : "none"}
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className={`w-5 h-5 ${isLiked ? "text-primary" : ""}`}
				aria-hidden="true"
			>
				<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
			</svg>
			<span className="text-sm">{likeCount}</span>
		</button>
	);
}
