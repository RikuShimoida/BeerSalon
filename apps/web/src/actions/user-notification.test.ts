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
const mockFollowRelationCreate = vi.fn();
const mockNotificationCreate = vi.fn();
vi.mock("@/lib/prisma", () => ({
	prisma: {
		userProfile: {
			findUnique: (...args: unknown[]) => mockUserProfileFindUnique(...args),
		},
		userFollowRelation: {
			create: (...args: unknown[]) => mockFollowRelationCreate(...args),
		},
		notification: {
			create: (...args: unknown[]) => mockNotificationCreate(...args),
		},
	},
}));

import { followUser } from "./user";

describe("followUser のフォロー通知生成", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetUser.mockResolvedValue({
			data: { user: { id: "auth-follower" } },
			error: null,
		});
		mockFollowRelationCreate.mockResolvedValue({});
		mockNotificationCreate.mockResolvedValue({});
	});

	it("follower !== followee のとき followee 宛に type=followed の通知を生成する", async () => {
		mockUserProfileFindUnique.mockResolvedValue({
			id: "follower-profile-id",
			nickname: "りく",
		});

		await followUser("followee-profile-id");

		expect(mockFollowRelationCreate).toHaveBeenCalledWith({
			data: {
				followerId: "follower-profile-id",
				followeeId: "followee-profile-id",
			},
		});
		expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
		expect(mockNotificationCreate).toHaveBeenCalledWith({
			data: {
				userId: "followee-profile-id",
				type: "followed",
				title: "フォロー",
				message: "りくさんにフォローされました",
				linkUrl: "/users/follower-profile-id",
			},
		});
	});

	it("自己フォロー（follower === followee）では通知を生成しない", async () => {
		mockUserProfileFindUnique.mockResolvedValue({
			id: "same-profile-id",
			nickname: "りく",
		});

		await followUser("same-profile-id");

		expect(mockFollowRelationCreate).toHaveBeenCalledTimes(1);
		expect(mockNotificationCreate).not.toHaveBeenCalled();
	});
});
