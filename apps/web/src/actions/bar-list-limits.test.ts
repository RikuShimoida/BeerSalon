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
const mockBarFindMany = vi.fn();
const mockFavoriteBarFindMany = vi.fn();
const mockViewHistoryFindMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
	prisma: {
		userProfile: {
			findUnique: (...args: unknown[]) => mockUserProfileFindUnique(...args),
		},
		bar: {
			findMany: (...args: unknown[]) => mockBarFindMany(...args),
		},
		favoriteBar: {
			findMany: (...args: unknown[]) => mockFavoriteBarFindMany(...args),
		},
		viewHistory: {
			findMany: (...args: unknown[]) => mockViewHistoryFindMany(...args),
		},
	},
}));

import { getBars, getFavoriteBars, getViewHistories } from "./bar";
import {
	BAR_LIST_LIMIT,
	FAVORITE_BAR_LIST_LIMIT,
	VIEW_HISTORY_LIST_LIMIT,
} from "./list-limits";

describe("bar 一覧取得の take 上限", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetUser.mockResolvedValue({
			data: { user: { id: "auth-user" } },
			error: null,
		});
		mockUserProfileFindUnique.mockResolvedValue({ id: "profile-1" });
		mockBarFindMany.mockResolvedValue([]);
		mockFavoriteBarFindMany.mockResolvedValue([]);
		mockViewHistoryFindMany.mockResolvedValue([]);
	});

	it("getBars は take に上限を渡す", async () => {
		await getBars();

		expect(mockBarFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				take: BAR_LIST_LIMIT,
			}),
		);
	});

	it("getFavoriteBars は take に上限を渡す", async () => {
		await getFavoriteBars();

		expect(mockFavoriteBarFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "profile-1" },
				take: FAVORITE_BAR_LIST_LIMIT,
			}),
		);
	});

	it("getViewHistories は take に上限を渡す", async () => {
		await getViewHistories();

		expect(mockViewHistoryFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "profile-1" },
				take: VIEW_HISTORY_LIST_LIMIT,
			}),
		);
	});

	it("上限を超えるデータでも getBars の返却件数は take で頭打ちになる", async () => {
		// Prisma の take はDBクエリ側で件数を制限するため、モックも take 件数分だけ返す挙動を再現する
		mockBarFindMany.mockImplementation(async (args: { take: number }) =>
			Array.from({ length: args.take }, (_, i) => ({
				id: BigInt(i + 1),
				name: "bar",
				prefecture: "東京都",
				city: "渋谷区",
				previewImageUrl: null,
				barImages: [],
				latitude: null,
				longitude: null,
			})),
		);

		const result = await getBars();

		expect(result).toHaveLength(BAR_LIST_LIMIT);
	});
});
