import Image from "next/image";
import Link from "next/link";

type PopularArticle = {
	id: number;
	title: string;
	barName: string;
	publishedAt: string;
	likeCount: number;
	imageUrl: string | null;
};

type PopularArticlesSectionProps = {
	articles: PopularArticle[];
};

export function PopularArticlesSection({
	articles,
}: PopularArticlesSectionProps) {
	if (articles.length === 0) {
		return null;
	}

	return (
		<section className="w-full">
			<h2 className="text-2xl md:text-3xl font-bold mb-6">
				先月いいねの多かった記事
			</h2>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{articles.map((article) => (
					<Link
						key={article.id}
						href={`/articles/${article.id}`}
						className="group block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
					>
						{article.imageUrl ? (
							<div className="relative h-48 bg-gray-200">
								<Image
									src={article.imageUrl}
									alt={article.title}
									fill
									className="object-cover"
								/>
							</div>
						) : (
							<div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
								<span className="text-gray-400 text-sm">No Image</span>
							</div>
						)}
						<div className="p-4">
							<h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
								{article.title}
							</h3>
							<p className="text-sm text-gray-600 mb-2">{article.barName}</p>
							<div className="flex items-center justify-between text-sm text-gray-500">
								<time dateTime={article.publishedAt}>
									{new Date(article.publishedAt).toLocaleDateString("ja-JP", {
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</time>
								<span className="flex items-center gap-1">
									<span>❤️</span>
									{article.likeCount}
								</span>
							</div>
						</div>
					</Link>
				))}
			</div>
		</section>
	);
}
