import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleDetail } from "@/actions/article";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default async function ArticlePage({
	params,
}: {
	params: Promise<{ articleId: string }>;
}) {
	const { articleId } = await params;

	const article = await getArticleDetail(articleId);

	if (!article) {
		notFound();
	}

	const formatDate = (date: Date | null) => {
		if (!date) return "";
		const d = new Date(date);
		return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
	};

	return (
		<AuthenticatedLayout>
			<div className="max-w-4xl mx-auto px-4 py-6">
				<article className="bg-white rounded-lg shadow-md overflow-hidden">
					<div className="p-6">
						<Link
							href={`/bars/${article.bar.id}`}
							className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
						>
							{article.bar.name}
						</Link>

						<h1 className="text-3xl font-bold text-gray-900 mb-4">
							{article.title}
						</h1>

						{article.publishedAt && (
							<p className="text-sm text-gray-500 mb-6">
								{formatDate(article.publishedAt)}
							</p>
						)}

						{article.imageUrl && (
							<div className="relative w-full h-96 mb-6 rounded-lg overflow-hidden bg-gray-100">
								<Image
									src={article.imageUrl}
									alt={article.title}
									fill
									className="object-cover"
								/>
							</div>
						)}

						<div className="prose prose-lg max-w-none">
							<p className="text-gray-700 whitespace-pre-wrap">
								{article.body}
							</p>
						</div>

						<div className="mt-8 pt-6 border-t border-gray-200">
							<Link
								href={`/bars/${article.bar.id}`}
								className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
							>
								店舗詳細を見る
							</Link>
						</div>
					</div>
				</article>
			</div>
		</AuthenticatedLayout>
	);
}
