import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getUserCoupons, getUserPosts } from "@/actions/user";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { LikeButton } from "@/components/post/like-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function MyPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const posts = await getUserPosts(user.id);
	const coupons = await getUserCoupons();

	if (coupons === null) {
		redirect("/login");
	}

	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="glass-card rounded-2xl modern-shadow overflow-hidden animate-fade-in">
					<div className="p-6 border-b border-border/50">
						<div className="flex items-center gap-4 mb-4">
							<div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary flex-shrink-0">
								{user.profileImageUrl ? (
									<Image
										src={user.profileImageUrl}
										alt={`${user.nickname}のプロフィール画像`}
										width={96}
										height={96}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full bg-muted flex items-center justify-center text-4xl text-muted-foreground">
										{user.nickname.charAt(0)}
									</div>
								)}
							</div>
							<div className="flex-1">
								<h1 className="text-2xl font-bold text-card-foreground mb-2 tracking-tight">
									{user.nickname}
								</h1>
								{user.bio && (
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">
										{user.bio}
									</p>
								)}
							</div>
						</div>

						<div className="flex gap-2 mb-4">
							<Link
								href="/mypage/edit"
								className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-300 font-medium tracking-wide"
							>
								プロフィールを編集
							</Link>
						</div>

						<div className="flex gap-6 mt-4">
							<Link
								href="/mypage/following"
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
								href="/mypage/followers"
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

					<Tabs defaultValue="posts" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="posts">投稿</TabsTrigger>
							<TabsTrigger value="coupons">持っているクーポン</TabsTrigger>
						</TabsList>

						<TabsContent value="posts" className="p-6">
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
											<div className="flex items-center justify-between text-sm mb-2">
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
											<div className="flex justify-end">
												<LikeButton
													postId={post.id}
													initialLikeCount={post.likeCount}
													initialIsLiked={post.isLikedByCurrentUser}
												/>
											</div>
										</div>
									))}
								</div>
							)}
						</TabsContent>

						<TabsContent value="coupons" className="p-6">
							{coupons.length === 0 ? (
								<div className="p-8 text-center">
									<p className="text-muted-foreground tracking-wide">
										取得済みのクーポンはありません
									</p>
								</div>
							) : (
								<div className="divide-y divide-border/50">
									{coupons.map((coupon) => (
										<div
											key={coupon.id}
											className="p-4 hover:bg-primary/10 transition-all duration-300"
										>
											<div className="flex flex-col gap-2">
												<div className="flex items-start justify-between">
													<h2 className="text-lg font-semibold text-card-foreground tracking-tight">
														{coupon.title}
													</h2>
													{coupon.isUsed && (
														<span className="px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50 rounded-lg">
															使用済み
														</span>
													)}
												</div>

												<p className="text-card-foreground tracking-wide">
													{coupon.description}
												</p>

												{coupon.conditions && (
													<div className="text-sm text-muted-foreground tracking-wide">
														<span className="font-medium">取得条件：</span>
														{coupon.conditions}
													</div>
												)}

												<div className="text-sm text-muted-foreground tracking-wide">
													<span className="font-medium">対象店舗：</span>
													{coupon.barName}
												</div>

												{coupon.validUntil && (
													<div className="text-sm text-muted-foreground tracking-wide">
														<span className="font-medium">有効期限：</span>
														{new Date(coupon.validUntil).toLocaleDateString(
															"ja-JP",
														)}
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
