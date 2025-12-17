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
