import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getUserById, getUserFollowers } from "@/actions/user";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

type UserFollowersPageProps = {
	params: Promise<{
		userId: string;
	}>;
};

export default async function UserFollowersPage({
	params,
}: UserFollowersPageProps) {
	const { userId } = await params;
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		redirect("/login");
	}

	const user = await getUserById(userId);

	if (!user) {
		redirect("/");
	}

	const followers = await getUserFollowers(userId);

	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="bg-white rounded-lg shadow-md overflow-hidden">
					<div className="p-6 border-b border-gray-200">
						<h1 className="text-2xl font-bold text-gray-900">
							{user.nickname}のフォロワー
						</h1>
					</div>

					{followers.length === 0 ? (
						<div className="p-8 text-center">
							<p className="text-gray-500">フォロワーはいません</p>
						</div>
					) : (
						<div className="divide-y divide-gray-200">
							{followers.map((follower) => (
								<Link
									key={follower.id}
									href={`/users/${follower.id}`}
									className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
								>
									<div className="flex flex-col">
										<span className="text-gray-900 font-medium">
											{follower.nickname}
										</span>
										<span className="text-sm text-gray-500">
											{follower.lastName} {follower.firstName}
										</span>
									</div>
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
								</Link>
							))}
						</div>
					)}
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
