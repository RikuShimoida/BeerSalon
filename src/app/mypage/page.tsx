import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/user";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default async function MyPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const menuItems = [
		{
			label: "フォロー",
			href: "/mypage/following",
			count: user.followingCount,
		},
		{
			label: "フォロワー",
			href: "/mypage/followers",
			count: user.followersCount,
		},
		{
			label: "投稿",
			href: "/mypage/posts",
			count: user.postsCount,
		},
		{
			label: "持っているクーポン",
			href: "/mypage/coupons",
			count: user.couponsCount,
		},
	];

	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
					<div className="p-6 border-b border-border">
						<h1 className="text-2xl font-bold text-foreground mb-2">
							マイページ
						</h1>
						<p className="text-lg text-muted-foreground">{user.nickname}</p>
					</div>

					<div className="divide-y divide-border">
						{menuItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="flex items-center justify-between p-4 hover:bg-accent transition-colors"
							>
								<span className="text-foreground font-medium">
									{item.label}
								</span>
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground">{item.count}</span>
									<svg
										className="w-5 h-5 text-muted-foreground"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										role="img"
										aria-label="次へ"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</div>
							</Link>
						))}
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
