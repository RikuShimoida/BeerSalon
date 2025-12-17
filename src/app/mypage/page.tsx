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
				<div className="bg-white rounded-lg shadow-md overflow-hidden">
					<div className="p-6 border-b border-gray-200">
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							マイページ
						</h1>
						<p className="text-lg text-gray-700">{user.nickname}</p>
					</div>

					<div className="divide-y divide-gray-200">
						{menuItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
							>
								<span className="text-gray-900 font-medium">{item.label}</span>
								<div className="flex items-center gap-2">
									<span className="text-gray-600">{item.count}</span>
									<svg
										className="w-5 h-5 text-gray-400"
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
