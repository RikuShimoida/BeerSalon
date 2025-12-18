import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTimelinePosts } from "@/actions/user";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default async function TimelinePage() {
	const posts = await getTimelinePosts();

	if (posts === null) {
		redirect("/login");
	}

	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="bg-white rounded-lg shadow-md overflow-hidden">
					<div className="p-6 border-b border-gray-200">
						<h1 className="text-2xl font-bold text-gray-900">タイムライン</h1>
					</div>

					{posts.length === 0 ? (
						<div className="p-8 text-center">
							<p className="text-gray-500 mb-4">
								フォローしているユーザーの投稿がありません
							</p>
							<p className="text-sm text-gray-400">
								他のユーザーをフォローして、投稿をチェックしましょう
							</p>
						</div>
					) : (
						<div className="divide-y divide-gray-200">
							{posts.map((post) => (
								<div key={post.id} className="p-6">
									<div className="flex items-center mb-4">
										<Link
											href={`/users/${post.user.id}`}
											className="text-gray-900 font-semibold hover:underline"
										>
											{post.user.nickname}
										</Link>
										<span className="mx-2 text-gray-400">•</span>
										<span className="text-sm text-gray-500">
											{new Date(post.createdAt).toLocaleDateString("ja-JP")}
										</span>
									</div>

									{post.images.length > 0 && (
										<div className="mb-4">
											<div className="aspect-square relative max-w-md">
												<Image
													src={post.images[0].url}
													alt=""
													fill
													className="object-cover rounded-lg"
												/>
											</div>
										</div>
									)}

									<p className="text-gray-800 mb-3 whitespace-pre-wrap">
										{post.body}
									</p>

									<div className="flex items-center gap-2">
										<Link
											href={`/bars/${post.bar.id}`}
											className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
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
		</AuthenticatedLayout>
	);
}
