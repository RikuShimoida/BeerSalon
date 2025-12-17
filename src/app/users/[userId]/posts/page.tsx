import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getUserById, getUserPosts } from "@/actions/user";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

type UserPostsPageProps = {
	params: Promise<{
		userId: string;
	}>;
};

export default async function UserPostsPage({ params }: UserPostsPageProps) {
	const { userId } = await params;
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		redirect("/login");
	}

	const user = await getUserById(userId);

	if (!user) {
		redirect("/");
	}

	const posts = await getUserPosts(userId);

	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="bg-white rounded-lg shadow-md overflow-hidden">
					<div className="p-6 border-b border-gray-200">
						<h1 className="text-2xl font-bold text-gray-900">
							{user.nickname} の投稿
						</h1>
					</div>

					<div className="p-6">
						{posts.length === 0 ? (
							<div className="p-8 text-center">
								<p className="text-gray-500">投稿がありません</p>
							</div>
						) : (
							<div className="space-y-6">
								{posts.map((post) => (
									<div
										key={post.id}
										className="border border-gray-200 rounded-lg p-4"
									>
										<div className="flex items-center mb-3">
											<Link
												href={`/users/${post.user.id}`}
												className="text-blue-600 hover:underline font-semibold"
											>
												{post.user.nickname}
											</Link>
											<span className="text-gray-500 ml-auto text-sm">
												{new Date(post.createdAt).toLocaleDateString("ja-JP")}
											</span>
										</div>

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

										<div className="flex items-center text-sm">
											<Link
												href={`/bars/${post.bar.id}`}
												className="text-blue-600 hover:underline"
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
			</div>
		</AuthenticatedLayout>
	);
}
