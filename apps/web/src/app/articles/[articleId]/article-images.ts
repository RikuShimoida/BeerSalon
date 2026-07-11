export function getArticleImageUrls(article: {
	imageUrl: string | null;
	imageUrl2: string | null;
	imageUrl3: string | null;
}): string[] {
	return [article.imageUrl, article.imageUrl2, article.imageUrl3]
		.filter((url): url is string => Boolean(url))
		.slice(0, 3);
}
