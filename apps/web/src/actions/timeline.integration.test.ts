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

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
	createClient: async () => ({
		auth: {
			getUser: mockGetUser,
		},
	}),
}));

import { getTimelinePosts } from "@/actions/user";

const prisma = new PrismaClient({
	adapter: new PrismaPg(
		new Pool({ connectionString: process.env.DATABASE_URL }),
	),
});

let alice: TestAuthUser; // 認証ユーザー
let bob: TestAuthUser; // フォロー中
let carol: TestAuthUser; // 非フォロー
let testBarId: bigint;
let alicePostId: bigint;
let bobPostId: bigint;
let carolPostId: bigint;

beforeAll(async () => {
	alice = await createTestAuthUser(prisma);
	bob = await createTestAuthUser(prisma);
	carol = await createTestAuthUser(prisma);
	const bar = await createTestBar(prisma);
	testBarId = bar.id;

	// alice -> bob のみフォロー
	await prisma.userFollowRelation.create({
		data: {
			followerId: alice.userProfileId,
			followeeId: bob.userProfileId,
		},
	});

	const alicePost = await prisma.post.create({
		data: {
			userId: alice.userProfileId,
			barId: testBarId,
			body: "it-timeline-body-alice",
		},
	});
	alicePostId = alicePost.id;

	const bobPost = await prisma.post.create({
		data: {
			userId: bob.userProfileId,
			barId: testBarId,
			body: "it-timeline-body-bob",
		},
	});
	bobPostId = bobPost.id;

	const carolPost = await prisma.post.create({
		data: {
			userId: carol.userProfileId,
			barId: testBarId,
			body: "it-timeline-body-carol",
		},
	});
	carolPostId = carolPost.id;
});

afterAll(async () => {
	await cleanupTestData(prisma, {
		authUserIds: [alice.authUserId, bob.authUserId, carol.authUserId],
	});
	await prisma.$disconnect();
});

describe("getTimelinePosts (Integration)", () => {
	it("自分とフォロー中ユーザーの投稿は含まれ、非フォローユーザーの投稿は除外される", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});

		const posts = await getTimelinePosts();
		expect(posts).not.toBeNull();

		const ids = (posts ?? []).map((p) => p.id);
		expect(ids).toEqual(expect.arrayContaining([alicePostId, bobPostId]));
		expect(ids).not.toContain(carolPostId);
	});
});
