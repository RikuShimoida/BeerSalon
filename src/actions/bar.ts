"use server";

import { prisma } from "@/lib/prisma";

export async function getBarDetail(barId: string) {
	const bar = await prisma.bar.findUnique({
		where: {
			id: BigInt(barId),
			isActive: true,
		},
		include: {
			barImages: {
				orderBy: {
					sortOrder: "asc",
				},
			},
			beerMenus: {
				where: {
					isActive: true,
				},
				include: {
					beer: {
						include: {
							brewery: true,
							beerCategory: true,
						},
					},
				},
				orderBy: {
					id: "asc",
				},
			},
			foodMenus: {
				where: {
					isActive: true,
				},
				orderBy: {
					id: "asc",
				},
			},
			posts: {
				include: {
					user: true,
					postImages: {
						orderBy: {
							sortOrder: "asc",
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			},
			articles: {
				where: {
					isPublished: true,
				},
				orderBy: {
					publishedAt: "desc",
				},
			},
			coupons: {
				where: {
					isActive: true,
				},
				orderBy: {
					createdAt: "desc",
				},
			},
		},
	});

	if (!bar) {
		return null;
	}

	return {
		...bar,
		id: bar.id.toString(),
		latitude: bar.latitude?.toString(),
		longitude: bar.longitude?.toString(),
		barImages: bar.barImages.map((img) => ({
			...img,
			id: img.id.toString(),
			barId: img.barId.toString(),
		})),
		beerMenus: bar.beerMenus.map((menu) => ({
			...menu,
			id: menu.id.toString(),
			barId: menu.barId.toString(),
			beerId: menu.beerId.toString(),
			beer: {
				...menu.beer,
				id: menu.beer.id.toString(),
				beerCategoryId: menu.beer.beerCategoryId.toString(),
				breweryId: menu.beer.breweryId?.toString(),
				abv: menu.beer.abv?.toString(),
				brewery: menu.beer.brewery
					? {
							...menu.beer.brewery,
							id: menu.beer.brewery.id.toString(),
						}
					: null,
				beerCategory: {
					...menu.beer.beerCategory,
					id: menu.beer.beerCategory.id.toString(),
				},
			},
		})),
		foodMenus: bar.foodMenus.map((menu) => ({
			...menu,
			id: menu.id.toString(),
			barId: menu.barId.toString(),
		})),
		posts: bar.posts.map((post) => ({
			...post,
			id: post.id.toString(),
			barId: post.barId.toString(),
			postImages: post.postImages.map((img) => ({
				...img,
				id: img.id.toString(),
				postId: img.postId.toString(),
			})),
		})),
		articles: bar.articles.map((article) => ({
			...article,
			id: article.id.toString(),
			barId: article.barId.toString(),
		})),
		coupons: bar.coupons.map((coupon) => ({
			...coupon,
			id: coupon.id.toString(),
			barId: coupon.barId.toString(),
		})),
	};
}
