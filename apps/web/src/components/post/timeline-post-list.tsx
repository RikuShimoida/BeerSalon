"use client";

import { useState, useTransition } from "react";
import type {
	TimelineCursor,
	TimelinePostsResult,
} from "@/actions/timeline-types";
import { getTimelinePosts } from "@/actions/user";
import { TimelinePostCard } from "./timeline-post-card";

type TimelinePostListProps = {
	initialPosts: TimelinePostsResult["posts"];
	initialCursor: TimelineCursor | null;
};

export function TimelinePostList({
	initialPosts,
	initialCursor,
}: TimelinePostListProps) {
	const [posts, setPosts] = useState(initialPosts);
	const [cursor, setCursor] = useState<TimelineCursor | null>(initialCursor);
	const [isPending, startTransition] = useTransition();

	function handleLoadMore() {
		if (!cursor) {
			return;
		}

		startTransition(async () => {
			const next = await getTimelinePosts(cursor);
			// Why not null を空扱いで無視: null は未認証（セッション切れ）を意味するため、
			// 既存リストを保持したまま追加読み込みだけ止める。
			if (next === null) {
				setCursor(null);
				return;
			}
			setPosts((prev) => [...prev, ...next.posts]);
			setCursor(next.nextCursor);
		});
	}

	if (posts.length === 0) {
		return (
			<div className="bg-card rounded-2xl border border-primary/15 p-8 text-center">
				<p className="text-heading font-medium mb-2">
					フォローしているユーザーの投稿がありません
				</p>
				<p className="text-sm text-subtext">
					他のユーザーをフォローして、投稿をチェックしましょう
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{posts.map((post) => (
				<TimelinePostCard key={post.id} post={post} />
			))}

			{cursor && (
				<button
					type="button"
					onClick={handleLoadMore}
					disabled={isPending}
					className="mx-auto mt-2 px-6 py-2.5 rounded-full border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
				>
					{isPending ? "読み込み中..." : "もっと見る"}
				</button>
			)}
		</div>
	);
}
