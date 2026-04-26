"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { followUser, unfollowUser } from "@/actions/user";

type FollowButtonProps = {
	userId: string;
	initialIsFollowing: boolean;
};

export function FollowButton({
	userId,
	initialIsFollowing,
}: FollowButtonProps) {
	const router = useRouter();
	const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
	const [isLoading, setIsLoading] = useState(false);

	const handleToggleFollow = async () => {
		setIsLoading(true);
		try {
			if (isFollowing) {
				await unfollowUser(userId);
				setIsFollowing(false);
			} else {
				await followUser(userId);
				setIsFollowing(true);
			}
			router.refresh();
		} catch (error) {
			console.error("Failed to toggle follow:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<button
			type="button"
			onClick={handleToggleFollow}
			disabled={isLoading}
			className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 tracking-wide ${
				isFollowing
					? "bg-muted text-card-foreground hover:bg-muted/80"
					: "gradient-primary text-primary-foreground hover:shadow-lg hover:scale-105 shadow-md"
			} disabled:opacity-50 disabled:cursor-not-allowed`}
		>
			{isLoading ? "処理中..." : isFollowing ? "フォロー中" : "フォロー"}
		</button>
	);
}
