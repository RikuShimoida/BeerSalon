import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTimelinePosts } from "@/actions/user";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default async function TimelinePage() {
	const posts = await getTimelinePosts();

	if (posts === null) {
		redirect("/login");
	}

	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
				<div className="bg-card rounded-lg shadow-md overflow-hidden">
					<div className="p-6 border-b border-border/50">
						<h1 className="text-2xl font-semibold text-foreground">
							タイムライン
						</h1>
					</div>

					{posts.length === 0 ? (
						<div className="p-8 text-center">
							<p className="text-muted-foreground mb-4">
								フォローしているユーザーの投稿がありません
							</p>
							<p className="text-sm text-muted-foreground/70">
								他のユーザーをフォローして、投稿をチェックしましょう
							</p>
						</div>
					) : (
						<div className="divide-y divide-border/50">
							{posts.map((post) => (
								<div key={post.id} className="p-6">
									<div className="flex items-center mb-4">
										<Link
											href={`/users/${post.user.id}`}
											className="text-card-foreground font-semibold hover:underline"
										>
											{post.user.nickname}
										</Link>
										<span className="mx-2 text-muted-foreground">•</span>
										<span className="text-sm text-muted-foreground">
											{new Date(post.createdAt).toLocaleDateString("ja-JP")}
										</span>
									</div>

									{post.images.length > 0 && (
										<div className="mb-4">
											<div className="aspect-square relative max-w-md">
												<Image
													src={post.images[0].url}
													alt=""
													fill
													className="object-cover rounded-lg"
												/>
											</div>
										</div>
									)}

									<p className="text-card-foreground mb-3 whitespace-pre-wrap">
										{post.body}
									</p>

									<div className="flex items-center gap-2">
										<Link
											href={`/bars/${post.bar.id}`}
											className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
										>
											{post.bar.name}
										</Link>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
