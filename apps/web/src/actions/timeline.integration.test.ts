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

import { TIMELINE_PAGE_SIZE } from "@/actions/timeline-types";
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

		const result = await getTimelinePosts();
		expect(result).not.toBeNull();

		const ids = (result?.posts ?? []).map((p) => p.id);
		expect(ids).toEqual(expect.arrayContaining([alicePostId, bobPostId]));
		expect(ids).not.toContain(carolPostId);
	});
});

describe("getTimelinePosts ページング境界 (Integration)", () => {
	let pager: TestAuthUser; // ページング検証専用ユーザー（自分の投稿だけを対象にする）
	let pagerBarId: bigint;

	afterAll(async () => {
		await cleanupTestData(prisma, { authUserIds: [pager.authUserId] });
	});

	async function seedPosts(count: number): Promise<bigint[]> {
		const ids: bigint[] = [];
		// createdAt の重複でカーソル境界が揺れないよう、1件ずつ時刻をずらして作成する。
		for (let i = 0; i < count; i++) {
			const post = await prisma.post.create({
				data: {
					userId: pager.userProfileId,
					barId: pagerBarId,
					body: `it-pager-body-${i}`,
					createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)),
				},
			});
			ids.push(post.id);
		}
		// createdAt desc, id desc の並び（新しい順）に合わせて期待順序を返す。
		return ids.reverse();
	}

	it("上限ちょうど（20件）なら全件返り nextCursor は null（続きなし）", async () => {
		pager = await createTestAuthUser(prisma);
		const bar = await createTestBar(prisma);
		pagerBarId = bar.id;
		await seedPosts(TIMELINE_PAGE_SIZE);

		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: pager.authUserId } },
		});

		const result = await getTimelinePosts();
		expect(result).not.toBeNull();
		expect(result?.posts).toHaveLength(TIMELINE_PAGE_SIZE);
		expect(result?.nextCursor).toBeNull();
	});
});

describe("getTimelinePosts ページング連結 (Integration)", () => {
	let pager: TestAuthUser;
	let pagerBarId: bigint;
	let expectedOrder: bigint[]; // 新しい順の投稿id（21件）

	beforeAll(async () => {
		pager = await createTestAuthUser(prisma);
		const bar = await createTestBar(prisma);
		pagerBarId = bar.id;

		const ids: bigint[] = [];
		for (let i = 0; i < TIMELINE_PAGE_SIZE + 1; i++) {
			const post = await prisma.post.create({
				data: {
					userId: pager.userProfileId,
					barId: pagerBarId,
					body: `it-pager2-body-${i}`,
					createdAt: new Date(Date.UTC(2026, 0, 2, 0, 0, i)),
				},
			});
			ids.push(post.id);
		}
		expectedOrder = ids.reverse();
	});

	afterAll(async () => {
		await cleanupTestData(prisma, { authUserIds: [pager.authUserId] });
	});

	it("上限+1（21件）で初回20件+nextCursor、2ページ目に残り1件（重複・欠落なし）", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: pager.authUserId } },
		});

		const first = await getTimelinePosts();
		expect(first).not.toBeNull();
		expect(first?.posts).toHaveLength(TIMELINE_PAGE_SIZE);
		expect(first?.nextCursor).not.toBeNull();
		expect(first?.posts.map((p) => p.id)).toEqual(
			expectedOrder.slice(0, TIMELINE_PAGE_SIZE),
		);

		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: pager.authUserId } },
		});

		const second = await getTimelinePosts(first?.nextCursor ?? undefined);
		expect(second).not.toBeNull();
		expect(second?.posts).toHaveLength(1);
		expect(second?.nextCursor).toBeNull();
		expect(second?.posts[0].id).toBe(expectedOrder[TIMELINE_PAGE_SIZE]);

		// 重複・欠落がないこと（2ページ合算で 21 件・全 id 一致）
		const merged = [...(first?.posts ?? []), ...(second?.posts ?? [])].map(
			(p) => p.id,
		);
		expect(merged).toEqual(expectedOrder);
		expect(new Set(merged).size).toBe(TIMELINE_PAGE_SIZE + 1);
	});
});
