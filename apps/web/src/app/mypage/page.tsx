import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getUserCoupons, getUserPosts } from "@/actions/user";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { MyCouponsList } from "@/components/mypage/my-coupons-list";
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
			<div className="mx-auto max-w-3xl px-4 py-6">
				<div className="overflow-hidden rounded-2xl border border-border bg-card modern-shadow">
					<div className="bg-gradient-to-br from-surface-raised to-surface-deep p-6">
						<div className="mb-4 flex items-center gap-4">
							<div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary">
								{user.profileImageUrl ? (
									<Image
										src={user.profileImageUrl}
										alt={`${user.nickname}のプロフィール画像`}
										width={96}
										height={96}
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center bg-surface-raised text-4xl text-primary/60">
										{user.nickname.charAt(0)}
									</div>
								)}
							</div>
							<div className="min-w-0 flex-1">
								<h1 className="mb-2 font-mincho text-2xl font-bold text-heading">
									{user.nickname}
								</h1>
								{user.bio && (
									<p className="whitespace-pre-wrap text-sm text-subtext">
										{user.bio}
									</p>
								)}
							</div>
						</div>

						<div className="mb-4 flex gap-6">
							<div className="text-center">
								<span className="block font-semibold text-heading">
									{user.postsCount}
								</span>
								<span className="text-xs tracking-wide text-subtext">投稿</span>
							</div>
							<Link href="/mypage/following" className="text-center">
								<span className="block font-semibold text-heading">
									{user.followingCount}
								</span>
								<span className="text-xs tracking-wide text-subtext">
									フォロー
								</span>
							</Link>
							<Link href="/mypage/followers" className="text-center">
								<span className="block font-semibold text-heading">
									{user.followersCount}
								</span>
								<span className="text-xs tracking-wide text-subtext">
									フォロワー
								</span>
							</Link>
						</div>

						<Link
							href="/mypage/edit"
							className="inline-flex items-center rounded-full border border-primary/40 bg-surface-raised px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
						>
							プロフィールを編集
						</Link>
					</div>

					<Tabs defaultValue="posts" className="w-full">
						<TabsList className="grid w-full grid-cols-2 rounded-none border-b border-border bg-transparent p-0">
							<TabsTrigger
								value="posts"
								className="rounded-none border-b-2 border-transparent py-3 text-subtext data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
							>
								投稿
							</TabsTrigger>
							<TabsTrigger
								value="coupons"
								className="rounded-none border-b-2 border-transparent py-3 text-subtext data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
							>
								持っているクーポン
							</TabsTrigger>
						</TabsList>

						<TabsContent value="posts" className="p-4">
							{posts.length === 0 ? (
								<div className="py-12 text-center">
									<p className="tracking-wide text-subtext">投稿はありません</p>
								</div>
							) : (
								<div className="grid grid-cols-3 gap-1">
									{posts.map((post) => (
										<Link
											key={post.id}
											href={`/bars/${post.bar.id}`}
											className="group relative aspect-square overflow-hidden rounded-lg bg-surface-raised"
										>
											{post.images.length > 0 ? (
												<Image
													src={post.images[0].url}
													alt=""
													fill
													className="object-cover transition-transform duration-300 group-hover:scale-105"
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-raised to-surface-deep p-2">
													<p className="line-clamp-4 text-xs text-subtext">
														{post.body}
													</p>
												</div>
											)}
										</Link>
									))}
								</div>
							)}
						</TabsContent>

						<TabsContent value="coupons" className="p-4">
							<MyCouponsList coupons={coupons} />
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
