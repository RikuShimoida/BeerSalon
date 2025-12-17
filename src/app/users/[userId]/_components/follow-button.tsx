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
			className={`px-6 py-2 rounded-md font-medium transition-colors ${
				isFollowing
					? "bg-gray-200 text-gray-700 hover:bg-gray-300"
					: "bg-blue-600 text-white hover:bg-blue-700"
			} disabled:opacity-50`}
		>
			{isLoading ? "処理中..." : isFollowing ? "フォロー中" : "フォロー"}
		</button>
	);
}
