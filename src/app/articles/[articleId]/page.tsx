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
				<article className="glass-card rounded-2xl modern-shadow overflow-hidden animate-fade-in">
					<div className="p-6 md:p-8">
						<Link
							href={`/bars/${article.bar.id}`}
							className="text-sm text-primary hover:text-primary/80 mb-2 inline-block transition-colors duration-300 tracking-wide"
						>
							{article.bar.name}
						</Link>

						<h1 className="text-3xl font-bold text-card-foreground mb-4 tracking-tight">
							{article.title}
						</h1>

						{article.publishedAt && (
							<p className="text-sm text-muted-foreground mb-6 tracking-wide">
								{formatDate(article.publishedAt)}
							</p>
						)}

						{article.imageUrl && (
							<div className="relative w-full h-96 mb-6 rounded-xl overflow-hidden bg-muted/30">
								<Image
									src={article.imageUrl}
									alt={article.title}
									fill
									className="object-cover"
								/>
							</div>
						)}

						<div className="prose prose-lg max-w-none">
							<p className="text-card-foreground whitespace-pre-wrap tracking-wide leading-relaxed">
								{article.body}
							</p>
						</div>

						<div className="mt-8 pt-6 border-t border-border/50">
							<Link
								href={`/bars/${article.bar.id}`}
								className="inline-block gradient-primary text-primary-foreground px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 shadow-md tracking-wide"
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
