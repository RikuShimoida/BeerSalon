"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getBars(params?: {
	city?: string;
	category?: string;
	origin?: string;
}) {
	const where: {
		isActive: boolean;
		city?: string;
		beerMenus?: {
			some: {
				beer: {
					beerCategory?: {
						name: string;
					};
					origin?: string;
				};
			};
		};
	} = {
		isActive: true,
	};

	if (params?.city) {
		where.city = params.city;
	}

	if (params?.category || params?.origin) {
		where.beerMenus = {
			some: {
				beer: {},
			},
		};

		if (params?.category) {
			where.beerMenus.some.beer.beerCategory = {
				name: params.category,
			};
		}

		if (params?.origin) {
			where.beerMenus.some.beer.origin = params.origin;
		}
	}

	const bars = await prisma.bar.findMany({
		where,
		include: {
			barImages: {
				orderBy: {
					sortOrder: "asc",
				},
				take: 1,
			},
		},
		orderBy: {
			id: "asc",
		},
	});

	return bars.map((bar) => ({
		id: bar.id.toString(),
		name: bar.name,
		prefecture: bar.prefecture,
		city: bar.city,
		imageUrl: bar.barImages[0]?.imageUrl,
	}));
}

export async function getBarDetail(barId: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	let currentUserId: string | null = null;
	if (user) {
		const userProfile = await prisma.userProfile.findUnique({
			where: {
				userAuthId: user.id,
			},
		});
		currentUserId = userProfile?.id ?? null;
	}

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
					postLikes: currentUserId
						? {
								where: {
									userId: currentUserId,
								},
							}
						: false,
					_count: {
						select: {
							postLikes: true,
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
			likeCount: post._count.postLikes,
			isLikedByCurrentUser: post.postLikes.length > 0,
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

export async function getFavoriteBars() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return null;
	}

	const userProfile = await prisma.userProfile.findUnique({
		where: {
			userAuthId: user.id,
		},
	});

	if (!userProfile) {
		return null;
	}

	const favoriteBars = await prisma.favoriteBar.findMany({
		where: {
			userId: userProfile.id,
		},
		include: {
			bar: {
				include: {
					barImages: {
						orderBy: {
							sortOrder: "asc",
						},
						take: 4,
					},
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return favoriteBars.map((favorite) => ({
		id: favorite.id.toString(),
		createdAt: favorite.createdAt,
		bar: {
			id: favorite.bar.id.toString(),
			name: favorite.bar.name,
			prefecture: favorite.bar.prefecture,
			city: favorite.bar.city,
			images: favorite.bar.barImages.map((img) => ({
				id: img.id.toString(),
				imageUrl: img.imageUrl,
				imageType: img.imageType,
			})),
		},
	}));
}

export async function addFavoriteBar(barId: string) {
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

	await prisma.favoriteBar.create({
		data: {
			userId: userProfile.id,
			barId: BigInt(barId),
		},
	});
}

export async function removeFavoriteBar(barId: string) {
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

	await prisma.favoriteBar.delete({
		where: {
			userId_barId: {
				userId: userProfile.id,
				barId: BigInt(barId),
			},
		},
	});
}

export async function isFavoriteBar(barId: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return false;
	}

	const userProfile = await prisma.userProfile.findUnique({
		where: {
			userAuthId: user.id,
		},
	});

	if (!userProfile) {
		return false;
	}

	const favorite = await prisma.favoriteBar.findUnique({
		where: {
			userId_barId: {
				userId: userProfile.id,
				barId: BigInt(barId),
			},
		},
	});

	return favorite !== null;
}

export async function recordViewHistory(barId: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return;
	}

	const userProfile = await prisma.userProfile.findUnique({
		where: {
			userAuthId: user.id,
		},
	});

	if (!userProfile) {
		return;
	}

	await prisma.viewHistory.upsert({
		where: {
			userId_barId: {
				userId: userProfile.id,
				barId: BigInt(barId),
			},
		},
		update: {
			viewedAt: new Date(),
		},
		create: {
			userId: userProfile.id,
			barId: BigInt(barId),
		},
	});
}

export async function getViewHistories() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return null;
	}

	const userProfile = await prisma.userProfile.findUnique({
		where: {
			userAuthId: user.id,
		},
	});

	if (!userProfile) {
		return null;
	}

	const viewHistories = await prisma.viewHistory.findMany({
		where: {
			userId: userProfile.id,
		},
		include: {
			bar: {
				include: {
					barImages: {
						orderBy: {
							sortOrder: "asc",
						},
						take: 1,
					},
				},
			},
		},
		orderBy: {
			viewedAt: "desc",
		},
	});

	return viewHistories.map((history) => ({
		id: history.id.toString(),
		viewedAt: history.viewedAt,
		bar: {
			id: history.bar.id.toString(),
			name: history.bar.name,
			prefecture: history.bar.prefecture,
			city: history.bar.city,
			imageUrl: history.bar.barImages[0]?.imageUrl,
		},
	}));
}

export async function getBeerOrigins() {
	const beers = await prisma.beer.findMany({
		where: {
			isActive: true,
			origin: {
				not: null,
			},
		},
		select: {
			origin: true,
		},
		distinct: ["origin"],
		orderBy: {
			origin: "asc",
		},
	});

	const origins = beers
		.map((beer) => beer.origin)
		.filter((origin): origin is string => origin !== null);

	const grouped: Record<string, string[]> = {};

	for (const origin of origins) {
		const parts = origin.split("/");
		const country = parts[0]?.trim() || origin;
		const region = parts[1]?.trim();

		if (!grouped[country]) {
			grouped[country] = [];
		}

		if (region) {
			grouped[country].push(region);
		}
	}

	return grouped;
}
