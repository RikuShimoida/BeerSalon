import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@/generated/prisma";
import {
	cleanupTestData,
	createTestAuthUser,
	createTestBar,
	type TestAuthUser,
} from "@/test/integration-helpers";

// Why not: createClient() / createAdminClient() は cookies() に依存するため Integration では
// 直接利用できない。auth.getUser() は実認証ユーザーの id を返すように差し替え、
// Storage 操作はモックで成功扱いにして DB 挿入の正常系のみを検証する。
// (Storage ロールバックパスは UT 側で createAdminClient をモックして網羅する)
const mockGetUser = vi.fn();
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
	createClient: async () => ({
		auth: {
			getUser: mockGetUser,
		},
	}),
	createAdminClient: async () => ({
		storage: {
			from: () => ({
				upload: mockUpload,
				getPublicUrl: mockGetPublicUrl,
			}),
		},
	}),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

// Why not: createPost は成功時に redirect() を呼び throw する。Integration では
// "redirect が呼ばれたこと" だけ検知できれば良いので、throw を握り潰せる形に差し替える。
vi.mock("next/navigation", () => ({
	redirect: vi.fn((url: string) => {
		throw new Error(`NEXT_REDIRECT:${url}`);
	}),
}));

import { createPost } from "@/app/posts/new/actions";

const prisma = new PrismaClient({
	adapter: new PrismaPg(
		new Pool({ connectionString: process.env.DATABASE_URL }),
	),
});

let user: TestAuthUser;
let testBarId: bigint;

beforeAll(async () => {
	user = await createTestAuthUser(prisma);
	const bar = await createTestBar(prisma);
	testBarId = bar.id;
});

afterAll(async () => {
	await cleanupTestData(prisma, {
		authUserIds: [user.authUserId],
	});
	await prisma.$disconnect();
});

describe("createPost (Integration)", () => {
	it("本文と画像4枚を渡すと posts が 1 件、post_images が 4 件挿入される", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: { id: user.authUserId } },
		});
		mockUpload.mockResolvedValue({ data: { path: "ok" }, error: null });
		mockGetPublicUrl.mockReturnValue({
			data: { publicUrl: "https://example.test/it-image.jpg" },
		});

		const formData = new FormData();
		formData.set("barId", testBarId.toString());
		formData.set("body", "it-post-body-with-images");

		// Why not: File は Web Standard API。size>0 を満たすために 1byte 以上のデータを入れる。
		for (let i = 0; i < 4; i++) {
			const file = new File([new Uint8Array([i + 1])], `it-image-${i}.jpg`, {
				type: "image/jpeg",
			});
			formData.set(`image-${i}`, file);
		}

		// Why not: createPost は成功時 redirect() を投げるので catch して期待した URL かを確認する。
		let redirectUrl: string | null = null;
		try {
			await createPost(undefined, formData);
		} catch (error) {
			const message = error instanceof Error ? error.message : "";
			if (message.startsWith("NEXT_REDIRECT:")) {
				redirectUrl = message.replace("NEXT_REDIRECT:", "");
			} else {
				throw error;
			}
		}
		expect(redirectUrl).toBe(`/bars/${testBarId.toString()}`);

		const createdPosts = await prisma.post.findMany({
			where: {
				userId: user.userProfileId,
				body: "it-post-body-with-images",
			},
			include: {
				postImages: {
					orderBy: { sortOrder: "asc" },
				},
			},
		});
		expect(createdPosts).toHaveLength(1);
		const createdPost = createdPosts[0];
		expect(createdPost.barId).toBe(testBarId);

		// Why not: Server Action 側で sortOrder=0..3 を順に振っているので件数とソート順の両方を assert。
		expect(createdPost.postImages).toHaveLength(4);
		expect(createdPost.postImages.map((img) => img.sortOrder)).toEqual([
			0, 1, 2, 3,
		]);

		// Storage アップロード API も 4 回呼ばれていることを確認しておく。
		expect(mockUpload).toHaveBeenCalledTimes(4);
	});
});
