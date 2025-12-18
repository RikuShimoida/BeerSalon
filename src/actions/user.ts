"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

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
		id: userCoupon.id,
		title: userCoupon.coupon.title,
		description: userCoupon.coupon.description,
		conditions: userCoupon.coupon.conditions,
		barName: userCoupon.coupon.bar.name,
		validUntil: userCoupon.coupon.validUntil,
		isUsed: userCoupon.isUsed,
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
		followingCount: userProfile._count.following,
		followersCount: userProfile._count.followedBy,
		postsCount: userProfile._count.posts,
	};
}

export async function getUserPosts(userId: string) {
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
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return posts.map((post) => ({
		id: post.id,
		body: post.body,
		createdAt: post.createdAt,
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

export async function getTimelinePosts() {
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

	const followingUserIds = followingRelations.map(
		(relation) => relation.followeeId,
	);

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
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return posts.map((post) => ({
		id: post.id,
		body: post.body,
		createdAt: post.createdAt,
		user: {
			id: post.user.id,
			nickname: post.user.nickname,
		},
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
