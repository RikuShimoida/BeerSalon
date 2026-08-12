import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(() => ({
		auth: {
			getUser: mockGetUser,
		},
	})),
}));

const mockUserProfileFindUnique = vi.fn();
const mockNotificationUpdateMany = vi.fn();
const mockNotificationFindMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
	prisma: {
		userProfile: {
			findUnique: (...args: unknown[]) => mockUserProfileFindUnique(...args),
		},
		notification: {
			updateMany: (...args: unknown[]) => mockNotificationUpdateMany(...args),
			findMany: (...args: unknown[]) => mockNotificationFindMany(...args),
		},
	},
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

import { NOTIFICATION_LIST_LIMIT } from "./list-limits";
import { getNotifications, markAllNotificationsAsRead } from "./notification";

describe("markAllNotificationsAsRead", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetUser.mockResolvedValue({
			data: { user: { id: "auth-user" } },
			error: null,
		});
		mockNotificationUpdateMany.mockResolvedValue({ count: 3 });
	});

	it("本人の未読通知のみを一括で既読化する", async () => {
		mockUserProfileFindUnique.mockResolvedValue({ id: "profile-1" });

		await markAllNotificationsAsRead();

		expect(mockNotificationUpdateMany).toHaveBeenCalledTimes(1);
		expect(mockNotificationUpdateMany).toHaveBeenCalledWith({
			where: {
				userId: "profile-1",
				isRead: false,
			},
			data: {
				isRead: true,
			},
		});
	});

	it("未認証のときは更新せず例外を投げる", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

		await expect(markAllNotificationsAsRead()).rejects.toThrow(
			"Not authenticated",
		);
		expect(mockNotificationUpdateMany).not.toHaveBeenCalled();
	});

	it("プロフィールが無いときは更新せず例外を投げる", async () => {
		mockUserProfileFindUnique.mockResolvedValue(null);

		await expect(markAllNotificationsAsRead()).rejects.toThrow(
			"User profile not found",
		);
		expect(mockNotificationUpdateMany).not.toHaveBeenCalled();
	});
});

describe("getNotifications", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetUser.mockResolvedValue({
			data: { user: { id: "auth-user" } },
			error: null,
		});
		mockUserProfileFindUnique.mockResolvedValue({ id: "profile-1" });
		mockNotificationFindMany.mockResolvedValue([]);
	});

	it("上限件数を take として Prisma に渡す", async () => {
		await getNotifications();

		expect(mockNotificationFindMany).toHaveBeenCalledTimes(1);
		expect(mockNotificationFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "profile-1" },
				orderBy: { createdAt: "desc" },
				take: NOTIFICATION_LIST_LIMIT,
			}),
		);
	});

	it("上限を超えるデータでも返却件数は take で頭打ちになる", async () => {
		// Prisma の take はDBクエリ側で件数を制限するため、モックも take 件数分だけ返す挙動を再現する
		mockNotificationFindMany.mockImplementation(
			async (args: { take: number }) =>
				Array.from({ length: args.take }, (_, i) => ({
					id: BigInt(i + 1),
					type: "followed",
					title: "t",
					message: "m",
					linkUrl: null,
					isRead: false,
					createdAt: new Date(),
				})),
		);

		const result = await getNotifications();

		expect(result).toHaveLength(NOTIFICATION_LIST_LIMIT);
	});
});
