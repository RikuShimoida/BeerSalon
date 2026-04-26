"use server";

import { prisma } from "@/lib/prisma";

export async function getArticleDetail(articleId: string) {
	const article = await prisma.article.findUnique({
		where: {
			id: BigInt(articleId),
			isPublished: true,
		},
		include: {
			bar: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});

	if (!article) {
		return null;
	}

	return {
		...article,
		id: article.id.toString(),
		barId: article.barId.toString(),
		bar: {
			...article.bar,
			id: article.bar.id.toString(),
		},
	};
}
