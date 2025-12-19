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
				<div className="glass-card rounded-2xl modern-shadow overflow-hidden animate-fade-in">
					<div className="p-6 border-b border-border/50">
						<h1 className="text-2xl font-bold text-card-foreground mb-2 tracking-tight">
							マイページ
						</h1>
						<p className="text-lg text-muted-foreground tracking-wide">
							{user.nickname}
						</p>
					</div>

					<div className="divide-y divide-border/50">
						{menuItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="flex items-center justify-between p-4 hover:bg-primary/10 transition-all duration-300"
							>
								<span className="text-card-foreground font-medium tracking-wide">
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
