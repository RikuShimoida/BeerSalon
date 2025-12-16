import Image from "next/image";
import Link from "next/link";

interface Post {
	id: string;
	body: string;
	createdAt: Date;
	user: {
		id: string;
		nickname: string;
	};
	postImages: {
		id: string;
		imageUrl: string;
	}[];
}

interface PostsTabProps {
	posts: Post[];
}

export function PostsTab({ posts }: PostsTabProps) {
	if (posts.length === 0) {
		return (
			<div className="text-center py-8">
				<p className="text-gray-500">投稿はまだありません。</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{posts.map((post) => (
				<div
					key={post.id}
					className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
				>
					<div className="flex items-center mb-3">
						<Link
							href={`/users/${post.user.id}`}
							className="text-blue-600 hover:underline font-semibold"
						>
							{post.user.nickname}
						</Link>
						<span className="text-gray-500 text-sm ml-2">
							{new Date(post.createdAt).toLocaleDateString("ja-JP")}
						</span>
					</div>

					{post.postImages.length > 0 && (
						<div
							className={`grid gap-2 mb-3 ${
								post.postImages.length === 1 ? "grid-cols-1" : "grid-cols-2"
							}`}
						>
							{post.postImages.map((image) => (
								<div
									key={image.id}
									className="relative w-full h-64 rounded-md overflow-hidden bg-gray-100"
								>
									<Image
										src={image.imageUrl}
										alt="投稿画像"
										fill
										className="object-cover"
									/>
								</div>
							))}
						</div>
					)}

					<p className="text-gray-800 whitespace-pre-wrap">{post.body}</p>
				</div>
			))}
		</div>
	);
}
