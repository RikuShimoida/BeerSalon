import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(() => ({
		auth: {
			getUser: mockGetUser,
		},
	})),
}));

const mockBarFindUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({
	prisma: {
		userProfile: {
			findUnique: vi.fn(),
		},
		bar: {
			findUnique: (...args: unknown[]) => mockBarFindUnique(...args),
		},
	},
}));

import { getBarDetail } from "./bar";
import { USER_POST_LIST_LIMIT } from "./list-limits";

// 整形処理が map する全 relation を最小構成で満たす bar オブジェクトを組む。
// posts 以外の件数はここでは検証対象外なので空配列で埋め、posts の take 検証にノイズを持ち込まない。
function buildBar(posts: unknown[]) {
	return {
		id: BigInt(1),
		latitude: null,
		longitude: null,
		barImages: [],
		openingHours: [],
		barPaymentMethods: [],
		beerMenus: [],
		foodMenus: [],
		posts,
		articles: [],
		coupons: [],
		barEvents: [],
	};
}

function buildPost(index: number) {
	return {
		id: BigInt(index + 1),
		barId: BigInt(1),
		_count: { postLikes: 0 },
		postLikes: [],
		postImages: [],
	};
}

describe("getBarDetail の投稿 take 上限", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetUser.mockResolvedValue({
			data: { user: null },
			error: null,
		});
		mockBarFindUnique.mockResolvedValue(buildBar([]));
	});

	it("include.posts に take 上限を渡す", async () => {
		await getBarDetail("1");

		expect(mockBarFindUnique).toHaveBeenCalledWith(
			expect.objectContaining({
				include: expect.objectContaining({
					posts: expect.objectContaining({
						take: USER_POST_LIST_LIMIT,
					}),
				}),
			}),
		);
	});

	it("投稿は新しい順（createdAt 降順）で頭打ちにする", async () => {
		// take で切り捨てる際に直近投稿が残るよう、降順を維持していることを検証する
		await getBarDetail("1");

		expect(mockBarFindUnique).toHaveBeenCalledWith(
			expect.objectContaining({
				include: expect.objectContaining({
					posts: expect.objectContaining({
						orderBy: { createdAt: "desc" },
					}),
				}),
			}),
		);
	});

	it("上限を超える投稿があっても返却件数は take で頭打ちになる", async () => {
		// Prisma のネスト take はサブクエリ側で件数を制限するため、モックも take 件数分だけ返す挙動を再現する
		mockBarFindUnique.mockImplementation(
			async (args: { include: { posts: { take: number } } }) =>
				buildBar(
					Array.from({ length: args.include.posts.take }, (_, i) =>
						buildPost(i),
					),
				),
		);

		const result = await getBarDetail("1");

		expect(result?.posts).toHaveLength(USER_POST_LIST_LIMIT);
	});
});
