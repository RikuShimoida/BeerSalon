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
vi.mock("@/lib/prisma", () => ({
	prisma: {
		userProfile: {
			findUnique: (...args: unknown[]) => mockUserProfileFindUnique(...args),
		},
		notification: {
			updateMany: (...args: unknown[]) => mockNotificationUpdateMany(...args),
		},
	},
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

import { markAllNotificationsAsRead } from "./notification";

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
