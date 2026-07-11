"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getArticleDetail(articleId: string) {
	const article = await prisma.article.findUnique({
		where: {
			id: BigInt(articleId),
			status: "published",
			deletedAt: null,
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

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const userProfile = user
		? await prisma.userProfile.findUnique({
				where: {
					userAuthId: user.id,
				},
			})
		: null;

	// Why not: articles にカウンタカラムが無いため、count による集計でいいね総数を取得する。
	// likeCount と isLiked は相互依存が無いため Promise.all で並列取得し DB 往復を削減する。
	const [likeCount, likedRow] = await Promise.all([
		prisma.articleLike.count({
			where: { articleId: article.id },
		}),
		userProfile
			? prisma.articleLike.findUnique({
					where: {
						articleId_userId: {
							articleId: article.id,
							userId: userProfile.id,
						},
					},
				})
			: Promise.resolve(null),
	]);

	const isLiked = likedRow !== null;

	return {
		...article,
		id: article.id.toString(),
		barId: article.barId.toString(),
		bar: {
			...article.bar,
			id: article.bar.id.toString(),
		},
		likeCount,
		isLiked,
	};
}

export async function toggleArticleLike(articleId: bigint) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("Not authenticated");
	}

	const userProfile = await prisma.userProfile.findUnique({
		where: {
			userAuthId: user.id,
		},
	});

	if (!userProfile) {
		throw new Error("User profile not found");
	}

	const existingLike = await prisma.articleLike.findUnique({
		where: {
			articleId_userId: {
				articleId,
				userId: userProfile.id,
			},
		},
	});

	if (existingLike) {
		await prisma.articleLike.delete({
			where: {
				articleId_userId: {
					articleId,
					userId: userProfile.id,
				},
			},
		});
	} else {
		const article = await prisma.article.findUnique({
			where: {
				id: articleId,
			},
		});

		if (!article) {
			throw new Error("Article not found");
		}

		await prisma.articleLike.create({
			data: {
				articleId,
				userId: userProfile.id,
			},
		});
	}

	// Why not: Issue #336 に通知要件は無く、database.md の notifications でも記事いいねに
	// 対応する type が未定義のため、togglePostLike と異なり通知は生成しない。
	revalidatePath("/articles/[articleId]", "page");

	return !existingLike;
}
