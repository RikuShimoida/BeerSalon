import Link from "next/link";
import { redirect } from "next/navigation";
import { getFollowingUsers } from "@/actions/user";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default async function FollowingPage() {
	const followingUsers = await getFollowingUsers();

	if (followingUsers === null) {
		redirect("/login");
	}

	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="bg-white rounded-lg shadow-md overflow-hidden">
					<div className="p-6 border-b border-gray-200">
						<h1 className="text-2xl font-bold text-gray-900">フォロー</h1>
					</div>

					{followingUsers.length === 0 ? (
						<div className="p-8 text-center">
							<p className="text-gray-500">
								フォローしているユーザーはいません
							</p>
						</div>
					) : (
						<div className="divide-y divide-gray-200">
							{followingUsers.map((user) => (
								<Link
									key={user.id}
									href={`/users/${user.id}`}
									className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
								>
									<div className="flex flex-col">
										<span className="text-gray-900 font-medium">
											{user.nickname}
										</span>
										<span className="text-sm text-gray-500">
											{user.lastName} {user.firstName}
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
