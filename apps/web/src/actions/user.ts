"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
	TIMELINE_PAGE_SIZE,
	type TimelineCursor,
	type TimelinePostsResult,
} from "./timeline-types";

export async function getCurrentUser() {
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
		include: {
			_count: {
				select: {
					following: true,
					followedBy: true,
					posts: true,
					userCoupons: true,
				},
			},
		},
	});

	if (!userProfile) {
		return null;
	}

	return {
		id: userProfile.id,
		nickname: userProfile.nickname,
		profileImageUrl: userProfile.profileImageUrl,
		bio: userProfile.bio,
		followingCount: userProfile._count.following,
		followersCount: userProfile._count.followedBy,
		postsCount: userProfile._count.posts,
		couponsCount: userProfile._count.userCoupons,
	};
}

export async function getFollowingUsers() {
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

	const followingRelations = await prisma.userFollowRelation.findMany({
		where: {
			followerId: userProfile.id,
		},
		include: {
			followee: true,
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return followingRelations.map((relation) => ({
		id: relation.followee.id,
		nickname: relation.followee.nickname,
		lastName: relation.followee.lastName,
		firstName: relation.followee.firstName,
	}));
}

export async function getFollowerUsers() {
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

	const followerRelations = await prisma.userFollowRelation.findMany({
		where: {
			followeeId: userProfile.id,
		},
		include: {
			follower: true,
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return followerRelations.map((relation) => ({
		id: relation.follower.id,
		nickname: relation.follower.nickname,
		lastName: relation.follower.lastName,
		firstName: relation.follower.firstName,
	}));
}

export async function getUserCoupons() {
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

	const userCoupons = await prisma.userCoupon.findMany({
		where: {
			userId: userProfile.id,
		},
		include: {
			coupon: {
				include: {
					bar: true,
				},
			},
		},
		orderBy: {
			obtainedAt: "desc",
		},
	});

	return userCoupons.map((userCoupon) => ({
		id: userCoupon.id.toString(),
		couponId: userCoupon.couponId.toString(),
		title: userCoupon.coupon.title,
		description: userCoupon.coupon.description ?? "",
		barName: userCoupon.coupon.bar.name,
		validFrom: userCoupon.coupon.validFrom,
		validUntil: userCoupon.coupon.validUntil,
		usageLimit: userCoupon.coupon.usageLimit,
		usedCount: userCoupon.coupon.usedCount,
		isUsed: userCoupon.isUsed,
		usedAt: userCoupon.usedAt,
		obtainedAt: userCoupon.obtainedAt,
	}));
}

export async function getUserById(userId: string) {
	const userProfile = await prisma.userProfile.findUnique({
		where: {
			id: userId,
		},
		include: {
			_count: {
				select: {
					following: true,
					followedBy: true,
					posts: true,
				},
			},
		},
	});

	if (!userProfile) {
		return null;
	}

	return {
		id: userProfile.id,
		nickname: userProfile.nickname,
		lastName: userProfile.lastName,
		firstName: userProfile.firstName,
		profileImageUrl: userProfile.profileImageUrl,
		bio: userProfile.bio,
		followingCount: userProfile._count.following,
		followersCount: userProfile._count.followedBy,
		postsCount: userProfile._count.posts,
	};
}

export async function getUserPosts(userId: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	let currentUserProfileId: string | null = null;

	if (user) {
		const currentUserProfile = await prisma.userProfile.findUnique({
			where: {
				userAuthId: user.id,
			},
		});
		currentUserProfileId = currentUserProfile?.id ?? null;
	}

	const posts = await prisma.post.findMany({
		where: {
			userId: userId,
		},
		include: {
			postImages: {
				orderBy: {
					sortOrder: "asc",
				},
			},
			bar: {
				select: {
					id: true,
					name: true,
				},
			},
			postLikes: currentUserProfileId
				? {
						where: {
							userId: currentUserProfileId,
						},
					}
				: false,
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return posts.map((post) => ({
		id: post.id,
		body: post.body,
		createdAt: post.createdAt,
		likeCount: post.likeCount,
		isLikedByCurrentUser:
			currentUserProfileId && Array.isArray(post.postLikes)
				? post.postLikes.length > 0
				: false,
		images: post.postImages.map((img) => ({
			id: img.id,
			url: img.imageUrl,
		})),
		bar: {
			id: post.bar.id,
			name: post.bar.name,
		},
	}));
}

export async function isFollowing(targetUserId: string) {
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

	const followRelation = await prisma.userFollowRelation.findUnique({
		where: {
			followerId_followeeId: {
				followerId: userProfile.id,
				followeeId: targetUserId,
			},
		},
	});

	return followRelation !== null;
}

export async function followUser(targetUserId: string) {
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

	await prisma.userFollowRelation.create({
		data: {
			followerId: userProfile.id,
			followeeId: targetUserId,
		},
	});

	// 自己フォローは UI 上発生しないが、post_liked が自分の投稿を除外しているのと同様に防御する
	if (targetUserId !== userProfile.id) {
		await prisma.notification.create({
			data: {
				userId: targetUserId,
				type: "followed",
				title: "フォロー",
				message: `${userProfile.nickname}さんにフォローされました`,
				linkUrl: `/users/${userProfile.id}`,
			},
		});
	}
}

export async function unfollowUser(targetUserId: string) {
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

	await prisma.userFollowRelation.delete({
		where: {
			followerId_followeeId: {
				followerId: userProfile.id,
				followeeId: targetUserId,
			},
		},
	});
}

export async function getUserFollowing(userId: string) {
	const followingRelations = await prisma.userFollowRelation.findMany({
		where: {
			followerId: userId,
		},
		include: {
			followee: true,
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return followingRelations.map((relation) => ({
		id: relation.followee.id,
		nickname: relation.followee.nickname,
		lastName: relation.followee.lastName,
		firstName: relation.followee.firstName,
	}));
}

export async function getUserFollowers(userId: string) {
	const followerRelations = await prisma.userFollowRelation.findMany({
		where: {
			followeeId: userId,
		},
		include: {
			follower: true,
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return followerRelations.map((relation) => ({
		id: relation.follower.id,
		nickname: relation.follower.nickname,
		lastName: relation.follower.lastName,
		firstName: relation.follower.firstName,
	}));
}

export async function getTimelinePosts(
	cursor?: TimelineCursor,
): Promise<TimelinePostsResult | null> {
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

	const followingRelations = await prisma.userFollowRelation.findMany({
		where: {
			followerId: userProfile.id,
		},
		select: {
			followeeId: true,
		},
	});

	const followingUserIds = [
		userProfile.id,
		...followingRelations.map((relation) => relation.followeeId),
	];

	const posts = await prisma.post.findMany({
		where: {
			userId: {
				in: followingUserIds,
			},
		},
		include: {
			user: {
				select: {
					id: true,
					nickname: true,
					profileImageUrl: true,
				},
			},
			postImages: {
				orderBy: {
					sortOrder: "asc",
				},
			},
			bar: {
				select: {
					id: true,
					name: true,
					prefecture: true,
					city: true,
				},
			},
			postLikes: {
				where: {
					userId: userProfile.id,
				},
			},
		},
		// Why not createdAt 単独の orderBy: 同一 createdAt の投稿でカーソル境界が不安定になり
		// ページ跨ぎで重複/欠落が起きるため、主キー id を第2キーに加えた複合順序で安定させる。
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		// Why not offset ページング: 投稿追加時に境界がズレて重複/欠落するため、
		// 主キー id を基点にしたカーソルで安定ページングする（skip:1 でカーソル行自身を除外）。
		...(cursor
			? {
					cursor: { id: BigInt(cursor.id) },
					skip: 1,
				}
			: {}),
		// +1 件多く取得し、超過分の有無で次ページの存在を判定する。
		take: TIMELINE_PAGE_SIZE + 1,
	});

	const hasNext = posts.length > TIMELINE_PAGE_SIZE;
	const pagePosts = hasNext ? posts.slice(0, TIMELINE_PAGE_SIZE) : posts;
	const lastPost = pagePosts.at(-1);
	const nextCursor =
		hasNext && lastPost ? { id: lastPost.id.toString() } : null;

	return {
		posts: pagePosts.map((post) => ({
			id: post.id,
			body: post.body,
			createdAt: post.createdAt,
			likeCount: post.likeCount,
			isLikedByCurrentUser: post.postLikes.length > 0,
			user: {
				id: post.user.id,
				nickname: post.user.nickname,
				profileImageUrl: post.user.profileImageUrl,
			},
			images: post.postImages.map((img) => ({
				id: img.id,
				url: img.imageUrl,
			})),
			bar: {
				id: post.bar.id,
				name: post.bar.name,
				prefecture: post.bar.prefecture,
				city: post.bar.city,
			},
		})),
		nextCursor,
	};
}
