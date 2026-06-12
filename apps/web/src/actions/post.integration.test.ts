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

// Why not: vi.mock のホイスト後に import すると mock が効くため、import 順を明示するために動的 import 風に整理。
import { togglePostLike } from "@/actions/post";

const prisma = new PrismaClient({
	adapter: new PrismaPg(
		new Pool({ connectionString: process.env.DATABASE_URL }),
	),
});

let alice: TestAuthUser;
let bob: TestAuthUser;
let testBarId: bigint;

beforeAll(async () => {
	alice = await createTestAuthUser(prisma);
	bob = await createTestAuthUser(prisma);
	const bar = await createTestBar(prisma);
	testBarId = bar.id;
});

afterAll(async () => {
	await cleanupTestData(prisma, {
		authUserIds: [alice.authUserId, bob.authUserId],
	});
	await prisma.$disconnect();
});

describe("togglePostLike (Integration)", () => {
	it("他人の投稿にいいねを付けると post_likes が追加され、like_count が +1、通知が作成される", async () => {
		const post = await prisma.post.create({
			data: {
				userId: bob.userProfileId,
				barId: testBarId,
				body: "it-post-body-by-bob",
			},
		});

		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});

		const liked = await togglePostLike(post.id);
		expect(liked).toBe(true);

		const likeRow = await prisma.postLike.findUnique({
			where: {
				postId_userId: { postId: post.id, userId: alice.userProfileId },
			},
		});
		expect(likeRow).not.toBeNull();

		const updated = await prisma.post.findUniqueOrThrow({
			where: { id: post.id },
		});
		expect(updated.likeCount).toBe(1);

		const notifications = await prisma.notification.findMany({
			where: { userId: bob.userProfileId, type: "post_liked" },
		});
		expect(notifications).toHaveLength(1);
		expect(notifications[0].message).toContain(alice.nickname);
		expect(notifications[0].linkUrl).toBe("/timeline");
	});

	it("自分の投稿にいいねを付けても通知は作成されない", async () => {
		const post = await prisma.post.create({
			data: {
				userId: alice.userProfileId,
				barId: testBarId,
				body: "it-post-body-by-alice",
			},
		});

		const beforeNotificationCount = await prisma.notification.count({
			where: { userId: alice.userProfileId, type: "post_liked" },
		});

		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});

		const liked = await togglePostLike(post.id);
		expect(liked).toBe(true);

		const likeRow = await prisma.postLike.findUnique({
			where: {
				postId_userId: { postId: post.id, userId: alice.userProfileId },
			},
		});
		expect(likeRow).not.toBeNull();

		const afterNotificationCount = await prisma.notification.count({
			where: { userId: alice.userProfileId, type: "post_liked" },
		});
		expect(afterNotificationCount).toBe(beforeNotificationCount);
	});

	it("既にいいね済みの投稿でトグルすると post_likes が削除され、like_count が -1 される", async () => {
		const post = await prisma.post.create({
			data: {
				userId: bob.userProfileId,
				barId: testBarId,
				body: "it-post-body-for-untoggle",
				likeCount: 0,
			},
		});

		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		await togglePostLike(post.id);
		const afterCreate = await prisma.post.findUniqueOrThrow({
			where: { id: post.id },
		});
		expect(afterCreate.likeCount).toBe(1);

		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		const liked = await togglePostLike(post.id);
		expect(liked).toBe(false);

		const likeRow = await prisma.postLike.findUnique({
			where: {
				postId_userId: { postId: post.id, userId: alice.userProfileId },
			},
		});
		expect(likeRow).toBeNull();

		const afterDelete = await prisma.post.findUniqueOrThrow({
			where: { id: post.id },
		});
		expect(afterDelete.likeCount).toBe(0);
	});
});
