import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
	getCurrentUser,
	getUserById,
	getUserPosts,
	isFollowing,
} from "@/actions/user";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { FollowButton } from "./_components/follow-button";

type UserDetailPageProps = {
	params: Promise<{
		userId: string;
	}>;
};

export default async function UserDetailPage({ params }: UserDetailPageProps) {
	const { userId } = await params;
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		redirect("/login");
	}

	if (currentUser.id === userId) {
		redirect("/mypage");
	}

	const user = await getUserById(userId);

	if (!user) {
		redirect("/");
	}

	const [posts, followStatus] = await Promise.all([
		getUserPosts(userId),
		isFollowing(userId),
	]);

	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="glass-card rounded-2xl modern-shadow overflow-hidden animate-fade-in">
					<div className="p-6 border-b border-border/50">
						<div className="flex items-center justify-between mb-4">
							<div>
								<h1 className="text-2xl font-bold text-card-foreground mb-2 tracking-tight">
									{user.nickname}
								</h1>
								<p className="text-muted-foreground tracking-wide">
									{user.lastName} {user.firstName}
								</p>
							</div>
							<FollowButton userId={userId} initialIsFollowing={followStatus} />
						</div>

						<div className="flex gap-6 mt-4">
							<Link
								href={`/users/${userId}/following`}
								className="hover:text-primary transition-colors duration-300"
							>
								<span className="font-semibold text-card-foreground">
									{user.followingCount}
								</span>
								<span className="text-muted-foreground ml-1 tracking-wide">
									フォロー
								</span>
							</Link>
							<Link
								href={`/users/${userId}/followers`}
								className="hover:text-primary transition-colors duration-300"
							>
								<span className="font-semibold text-card-foreground">
									{user.followersCount}
								</span>
								<span className="text-muted-foreground ml-1 tracking-wide">
									フォロワー
								</span>
							</Link>
						</div>
					</div>

					<div className="p-6">
						<h2 className="text-xl font-bold text-card-foreground mb-4 tracking-tight">
							投稿
						</h2>
						{posts.length === 0 ? (
							<div className="p-8 text-center">
								<p className="text-muted-foreground tracking-wide">
									投稿はありません
								</p>
							</div>
						) : (
							<div className="space-y-6">
								{posts.map((post) => (
									<div
										key={post.id}
										className="glass-card border-border/30 rounded-xl p-4 hover-lift"
									>
										{post.images.length > 0 && (
											<div className="grid grid-cols-2 gap-2 mb-4">
												{post.images.map((image) => (
													<div
														key={image.id}
														className="aspect-square relative overflow-hidden rounded-lg"
													>
														<Image
															src={image.url}
															alt=""
															fill
															className="object-cover"
														/>
													</div>
												))}
											</div>
										)}
										<p className="text-card-foreground mb-2 tracking-wide">
											{post.body}
										</p>
										<div className="flex items-center justify-between text-sm">
											<Link
												href={`/bars/${post.bar.id}`}
												className="text-primary hover:text-primary/80 transition-colors duration-300 tracking-wide"
											>
												{post.bar.name}
											</Link>
											<span className="text-muted-foreground tracking-wide">
												{new Date(post.createdAt).toLocaleDateString("ja-JP")}
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
