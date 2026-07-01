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

// Why not: createClient() は cookies() に依存しブラウザ context が必要。
// Integration では「Cookie context」だけ差し替え、DB I/O は実 Supabase にそのまま流す。
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
	createClient: async () => ({
		auth: {
			getUser: mockGetUser,
		},
	}),
}));

// Why not: revalidatePath は Next.js のキャッシュ機構に依存し、テスト環境ではエラーになるため no-op 化。
vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

// Why not: vi.mock のホイスト後に import すると mock が効くため、import 順を明示するために整理。
import { toggleArticleLike } from "@/actions/article";

const prisma = new PrismaClient({
	adapter: new PrismaPg(
		new Pool({ connectionString: process.env.DATABASE_URL }),
	),
});

let alice: TestAuthUser;
let testBarId: bigint;

async function createTestArticle(barId: bigint): Promise<bigint> {
	const article = await prisma.article.create({
		data: {
			barId,
			title: "it-article-title",
			body: "it-article-body",
			status: "published",
			publishedAt: new Date(),
		},
	});
	return article.id;
}

beforeAll(async () => {
	alice = await createTestAuthUser(prisma);
	const bar = await createTestBar(prisma);
	testBarId = bar.id;
});

afterAll(async () => {
	await cleanupTestData(prisma, {
		authUserIds: [alice.authUserId],
	});
	await prisma.$disconnect();
});

describe("toggleArticleLike (Integration)", () => {
	it("未いいねの記事にトグルすると article_likes が追加され、count が +1 される", async () => {
		const articleId = await createTestArticle(testBarId);

		const beforeCount = await prisma.articleLike.count({
			where: { articleId },
		});
		expect(beforeCount).toBe(0);

		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});

		const liked = await toggleArticleLike(articleId);
		expect(liked).toBe(true);

		const likeRow = await prisma.articleLike.findUnique({
			where: {
				articleId_userId: { articleId, userId: alice.userProfileId },
			},
		});
		expect(likeRow).not.toBeNull();

		const afterCount = await prisma.articleLike.count({
			where: { articleId },
		});
		expect(afterCount).toBe(1);
	});

	it("いいね済みの記事にトグルすると article_likes が削除され、count が -1 される", async () => {
		const articleId = await createTestArticle(testBarId);

		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		await toggleArticleLike(articleId);
		const afterCreate = await prisma.articleLike.count({
			where: { articleId },
		});
		expect(afterCreate).toBe(1);

		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		const liked = await toggleArticleLike(articleId);
		expect(liked).toBe(false);

		const likeRow = await prisma.articleLike.findUnique({
			where: {
				articleId_userId: { articleId, userId: alice.userProfileId },
			},
		});
		expect(likeRow).toBeNull();

		const afterDelete = await prisma.articleLike.count({
			where: { articleId },
		});
		expect(afterDelete).toBe(0);
	});

	it("記事いいねでは通知を生成しない", async () => {
		const articleId = await createTestArticle(testBarId);

		const beforeNotifications = await prisma.notification.count({
			where: { userId: alice.userProfileId },
		});

		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		await toggleArticleLike(articleId);

		const afterNotifications = await prisma.notification.count({
			where: { userId: alice.userProfileId },
		});
		expect(afterNotifications).toBe(beforeNotifications);
	});

	it("未認証ユーザーがトグルすると例外を投げる", async () => {
		const articleId = await createTestArticle(testBarId);

		mockGetUser.mockResolvedValueOnce({
			data: { user: null },
		});

		await expect(toggleArticleLike(articleId)).rejects.toThrow(
			"Not authenticated",
		);
	});
});
