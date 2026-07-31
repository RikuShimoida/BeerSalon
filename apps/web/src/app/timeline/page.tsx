import { PenSquare } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTimelinePosts } from "@/actions/user";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { TimelinePostCard } from "@/components/post/timeline-post-card";

export default async function TimelinePage() {
	const posts = await getTimelinePosts();

	if (posts === null) {
		redirect("/login");
	}

	return (
		<AuthenticatedLayout>
			<div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
				<div className="mb-6">
					<p className="font-archivo text-xs uppercase tracking-[0.2em] text-primary mb-1">
						Timeline
					</p>
					<h1 className="font-mincho text-3xl text-heading">タイムライン</h1>
				</div>

				{/* Why not みんなタブを描画: 全ユーザー投稿を横断取得する機能は未実装のため、
				    存在しないタブは描かない（推測実装禁止）。フォロー中のみをアクティブ表示する。 */}
				<div className="flex gap-6 border-b border-primary/15 mb-6">
					<span
						className="pb-3 text-sm font-medium text-primary border-b-2 border-primary"
						aria-current="page"
					>
						フォロー中
					</span>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
					<div className="flex flex-col gap-4">
						{posts.length === 0 ? (
							<div className="bg-card rounded-2xl border border-primary/15 p-8 text-center">
								<p className="text-heading font-medium mb-2">
									フォローしているユーザーの投稿がありません
								</p>
								<p className="text-sm text-subtext">
									他のユーザーをフォローして、投稿をチェックしましょう
								</p>
							</div>
						) : (
							posts.map((post) => (
								<TimelinePostCard key={post.id} post={post} />
							))
						)}
					</div>

					<aside className="hidden lg:block">
						<div className="sticky top-20 rounded-2xl bg-gradient-to-br from-primary to-primary-strong p-5 shadow-lg">
							<h2 className="font-mincho text-lg text-primary-foreground mb-2">
								一杯を、シェアしよう
							</h2>
							<p className="text-sm text-primary-foreground/80 mb-4">
								訪れたお店の感想を投稿して、みんなと共有しませんか。
							</p>
							<Link
								href="/posts/new"
								className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-deep text-primary font-medium text-sm hover:bg-surface-deep/80 transition-colors"
							>
								<PenSquare className="w-4 h-4" aria-hidden="true" />
								投稿する
							</Link>
						</div>
					</aside>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
