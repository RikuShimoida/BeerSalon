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
				<div className="bg-white rounded-lg shadow-md overflow-hidden">
					<div className="p-6 border-b border-gray-200">
						<div className="flex items-center justify-between mb-4">
							<div>
								<h1 className="text-2xl font-bold text-gray-900 mb-2">
									{user.nickname}
								</h1>
								<p className="text-gray-600">
									{user.lastName} {user.firstName}
								</p>
							</div>
							<FollowButton userId={userId} initialIsFollowing={followStatus} />
						</div>

						<div className="flex gap-6 mt-4">
							<Link
								href={`/users/${userId}/following`}
								className="hover:underline"
							>
								<span className="font-semibold text-gray-900">
									{user.followingCount}
								</span>
								<span className="text-gray-600 ml-1">フォロー</span>
							</Link>
							<Link
								href={`/users/${userId}/followers`}
								className="hover:underline"
							>
								<span className="font-semibold text-gray-900">
									{user.followersCount}
								</span>
								<span className="text-gray-600 ml-1">フォロワー</span>
							</Link>
						</div>
					</div>

					<div className="p-6">
						<h2 className="text-xl font-bold text-gray-900 mb-4">投稿</h2>
						{posts.length === 0 ? (
							<div className="p-8 text-center">
								<p className="text-gray-500">投稿はありません</p>
							</div>
						) : (
							<div className="space-y-6">
								{posts.map((post) => (
									<div
										key={post.id}
										className="border border-gray-200 rounded-lg p-4"
									>
										{post.images.length > 0 && (
											<div className="grid grid-cols-2 gap-2 mb-4">
												{post.images.map((image) => (
													<div
														key={image.id}
														className="aspect-square relative"
													>
														<Image
															src={image.url}
															alt=""
															fill
															className="object-cover rounded-md"
														/>
													</div>
												))}
											</div>
										)}
										<p className="text-gray-800 mb-2">{post.body}</p>
										<div className="flex items-center justify-between text-sm">
											<Link
												href={`/bars/${post.bar.id}`}
												className="text-blue-600 hover:underline"
											>
												{post.bar.name}
											</Link>
											<span className="text-gray-500">
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
