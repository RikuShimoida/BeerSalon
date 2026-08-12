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
const mockFollowRelationFindMany = vi.fn();
const mockUserCouponFindMany = vi.fn();
const mockPostFindMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
	prisma: {
		userProfile: {
			findUnique: (...args: unknown[]) => mockUserProfileFindUnique(...args),
		},
		userFollowRelation: {
			findMany: (...args: unknown[]) => mockFollowRelationFindMany(...args),
		},
		userCoupon: {
			findMany: (...args: unknown[]) => mockUserCouponFindMany(...args),
		},
		post: {
			findMany: (...args: unknown[]) => mockPostFindMany(...args),
		},
	},
}));

import {
	COUPON_LIST_LIMIT,
	FOLLOWER_LIST_LIMIT,
	FOLLOWING_LIST_LIMIT,
	USER_POST_LIST_LIMIT,
} from "./list-limits";
import {
	getFollowerUsers,
	getFollowingUsers,
	getUserCoupons,
	getUserFollowers,
	getUserFollowing,
	getUserPosts,
} from "./user";

describe("user 一覧取得の take 上限", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetUser.mockResolvedValue({
			data: { user: { id: "auth-user" } },
			error: null,
		});
		mockUserProfileFindUnique.mockResolvedValue({ id: "profile-1" });
		mockFollowRelationFindMany.mockResolvedValue([]);
		mockUserCouponFindMany.mockResolvedValue([]);
		mockPostFindMany.mockResolvedValue([]);
	});

	it("getFollowingUsers は take に上限を渡す", async () => {
		await getFollowingUsers();

		expect(mockFollowRelationFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { followerId: "profile-1" },
				take: FOLLOWING_LIST_LIMIT,
			}),
		);
	});

	it("getFollowerUsers は take に上限を渡す", async () => {
		await getFollowerUsers();

		expect(mockFollowRelationFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { followeeId: "profile-1" },
				take: FOLLOWER_LIST_LIMIT,
			}),
		);
	});

	it("getUserFollowing は take に上限を渡す", async () => {
		await getUserFollowing("target-user");

		expect(mockFollowRelationFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { followerId: "target-user" },
				take: FOLLOWING_LIST_LIMIT,
			}),
		);
	});

	it("getUserFollowers は take に上限を渡す", async () => {
		await getUserFollowers("target-user");

		expect(mockFollowRelationFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { followeeId: "target-user" },
				take: FOLLOWER_LIST_LIMIT,
			}),
		);
	});

	it("getUserCoupons は take に上限を渡す", async () => {
		await getUserCoupons();

		expect(mockUserCouponFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "profile-1" },
				take: COUPON_LIST_LIMIT,
			}),
		);
	});

	it("getUserPosts は take に上限を渡す", async () => {
		await getUserPosts("target-user");

		expect(mockPostFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "target-user" },
				take: USER_POST_LIST_LIMIT,
			}),
		);
	});

	it("上限を超えるデータでも返却件数は take で頭打ちになる", async () => {
		// Prisma の take はDBクエリ側で件数を制限するため、モックも take 件数分だけ返す挙動を再現する
		mockFollowRelationFindMany.mockImplementation(
			async (args: { take: number }) =>
				Array.from({ length: args.take }, (_, i) => ({
					followee: {
						id: `u${i}`,
						nickname: "n",
						lastName: "l",
						firstName: "f",
					},
				})),
		);

		const result = await getFollowingUsers();

		expect(result).toHaveLength(FOLLOWING_LIST_LIMIT);
	});
});
