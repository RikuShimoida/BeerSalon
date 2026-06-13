"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getNotifications() {
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

	const notifications = await prisma.notification.findMany({
		where: {
			userId: userProfile.id,
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return notifications.map((notification) => ({
		id: notification.id.toString(),
		type: notification.type,
		title: notification.title,
		message: notification.message,
		linkUrl: notification.linkUrl,
		isRead: notification.isRead,
		createdAt: notification.createdAt,
	}));
}

export async function getUnreadNotificationCount() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return 0;
	}

	const userProfile = await prisma.userProfile.findUnique({
		where: {
			userAuthId: user.id,
		},
	});

	if (!userProfile) {
		return 0;
	}

	const count = await prisma.notification.count({
		where: {
			userId: userProfile.id,
			isRead: false,
		},
	});

	return count;
}

export async function markNotificationAsRead(notificationId: string) {
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

	const notification = await prisma.notification.findUnique({
		where: {
			id: BigInt(notificationId),
		},
	});

	if (!notification || notification.userId !== userProfile.id) {
		throw new Error("Notification not found or unauthorized");
	}

	await prisma.notification.update({
		where: {
			id: BigInt(notificationId),
		},
		data: {
			isRead: true,
		},
	});
}
