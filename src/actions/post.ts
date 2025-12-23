"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function togglePostLike(postId: bigint) {
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

	const existingLike = await prisma.postLike.findUnique({
		where: {
			postId_userId: {
				postId,
				userId: userProfile.id,
			},
		},
	});

	if (existingLike) {
		await prisma.$transaction([
			prisma.postLike.delete({
				where: {
					postId_userId: {
						postId,
						userId: userProfile.id,
					},
				},
			}),
			prisma.post.update({
				where: {
					id: postId,
				},
				data: {
					likeCount: {
						decrement: 1,
					},
				},
			}),
		]);
	} else {
		await prisma.$transaction([
			prisma.postLike.create({
				data: {
					postId,
					userId: userProfile.id,
				},
			}),
			prisma.post.update({
				where: {
					id: postId,
				},
				data: {
					likeCount: {
						increment: 1,
					},
				},
			}),
		]);
	}

	revalidatePath("/timeline");
	revalidatePath("/users/[userId]", "page");

	return !existingLike;
}

export async function checkIfUserLikedPost(postId: bigint) {
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

	const like = await prisma.postLike.findUnique({
		where: {
			postId_userId: {
				postId,
				userId: userProfile.id,
			},
		},
	});

	return like !== null;
}
