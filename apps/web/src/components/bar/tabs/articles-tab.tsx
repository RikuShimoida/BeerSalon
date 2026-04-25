import Image from "next/image";
import Link from "next/link";

interface Article {
	id: string;
	title: string;
	body: string;
	imageUrl: string | null;
	publishedAt: Date | null;
}

interface ArticlesTabProps {
	articles: Article[];
}

export function ArticlesTab({ articles }: ArticlesTabProps) {
	if (articles.length === 0) {
		return (
			<div className="text-center py-8">
				<p className="text-gray-500">記事はまだ投稿されていません。</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{articles.map((article) => (
				<Link
					key={article.id}
					href={`/articles/${article.id}`}
					className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block"
				>
					{article.imageUrl && (
						<div className="relative w-full h-48 mb-3 rounded-md overflow-hidden bg-gray-100">
							<Image
								src={article.imageUrl}
								alt={article.title}
								fill
								className="object-cover"
							/>
						</div>
					)}
					<h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
						{article.title}
					</h3>
					<p className="text-sm text-gray-600 mb-2 line-clamp-3">
						{article.body}
					</p>
					{article.publishedAt && (
						<p className="text-xs text-gray-500">
							{new Date(article.publishedAt).toLocaleDateString("ja-JP")}
						</p>
					)}
				</Link>
			))}
		</div>
	);
}
