import { formatDateJst } from "@beersalon/shared";
import { Beer, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleDetail } from "@/actions/article";
import { ArticleShareButton } from "@/components/article/article-share-button";
import { ArticleLikeButton } from "@/components/article/like-button";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { getArticleImageUrls } from "./article-images";

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

	const imageUrls = getArticleImageUrls(article);

	return (
		<AuthenticatedLayout>
			<article className="mx-auto w-full max-w-[660px] px-4 py-8 md:py-12">
				<header>
					<p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
						Article
					</p>
					<Link
						href={`/bars/${article.bar.id}`}
						className="mb-3 inline-block text-sm text-subtext transition-colors hover:text-primary"
					>
						{article.bar.name}
					</Link>
					<h1 className="font-mincho text-3xl font-bold leading-snug text-heading md:text-4xl">
						{article.title}
					</h1>

					<div className="mt-5 flex items-center gap-5 border-b border-border pb-5">
						<ArticleLikeButton
							articleId={article.id}
							initialLikeCount={article.likeCount}
							initialIsLiked={article.isLiked}
						/>
						<ArticleShareButton title={article.title} />
						{article.publishedAt && (
							<p className="ml-auto text-sm text-subtext">
								{formatDateJst(article.publishedAt)}
							</p>
						)}
					</div>
				</header>

				{imageUrls.map((url) => (
					<div
						key={url}
						className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-surface-raised"
					>
						<Image
							src={url}
							alt={article.title}
							fill
							sizes="(min-width: 660px) 660px, 100vw"
							className="object-cover"
						/>
					</div>
				))}

				<div className="mt-8">
					<p className="whitespace-pre-wrap text-[15px] leading-[2] tracking-wide text-foreground font-mincho">
						{article.body}
					</p>
				</div>

				<div className="mt-10 border-t border-border pt-8">
					<p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-subtext">
						この記事のお店
					</p>
					<Link
						href={`/bars/${article.bar.id}`}
						className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-surface-raised"
					>
						<div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-surface-deep">
							{article.bar.previewImageUrl ? (
								<Image
									src={article.bar.previewImageUrl}
									alt={article.bar.name}
									fill
									sizes="64px"
									className="object-cover"
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center text-primary/40">
									<Beer className="h-7 w-7" aria-hidden="true" />
								</div>
							)}
						</div>
						<div className="min-w-0 flex-1">
							<p className="font-mincho text-base font-bold text-heading">
								{article.bar.name}
							</p>
							<p className="mt-0.5 text-sm text-primary">店舗を見る</p>
						</div>
						<ChevronRight
							className="h-5 w-5 flex-shrink-0 text-subtext"
							aria-hidden="true"
						/>
					</Link>
				</div>
			</article>
		</AuthenticatedLayout>
	);
}
