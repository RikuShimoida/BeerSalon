import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@/generated/prisma";
import {
	cleanupTestData,
	createTestAuthUser,
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

import { followUser, getCurrentUser, unfollowUser } from "@/actions/user";

const prisma = new PrismaClient({
	adapter: new PrismaPg(
		new Pool({ connectionString: process.env.DATABASE_URL }),
	),
});

let alice: TestAuthUser;
let bob: TestAuthUser;

beforeAll(async () => {
	alice = await createTestAuthUser(prisma);
	bob = await createTestAuthUser(prisma);
});

afterAll(async () => {
	await cleanupTestData(prisma, {
		authUserIds: [alice.authUserId, bob.authUserId],
	});
	await prisma.$disconnect();
});

describe("followUser / unfollowUser (Integration)", () => {
	it("followUser でフォロー関係が1件作成される", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});

		await followUser(bob.userProfileId);

		const relation = await prisma.userFollowRelation.findUnique({
			where: {
				followerId_followeeId: {
					followerId: alice.userProfileId,
					followeeId: bob.userProfileId,
				},
			},
		});
		expect(relation).not.toBeNull();
		expect(relation?.followerId).toBe(alice.userProfileId);
		expect(relation?.followeeId).toBe(bob.userProfileId);
	});

	it("同じ相手を再度 followUser すると UNIQUE 制約で失敗する", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});

		// Why not: 1 度目で行を作っているので 2 度目は @@unique([followerId, followeeId]) に
		// 違反する。実装は try/catch していないため Prisma の例外がそのまま伝播する想定。
		await expect(followUser(bob.userProfileId)).rejects.toThrow();

		const relations = await prisma.userFollowRelation.findMany({
			where: {
				followerId: alice.userProfileId,
				followeeId: bob.userProfileId,
			},
		});
		expect(relations).toHaveLength(1);
	});

	it("unfollowUser でフォロー関係が削除される", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});

		await unfollowUser(bob.userProfileId);

		const relation = await prisma.userFollowRelation.findUnique({
			where: {
				followerId_followeeId: {
					followerId: alice.userProfileId,
					followeeId: bob.userProfileId,
				},
			},
		});
		expect(relation).toBeNull();
	});
});

// #558 の回帰防止。
// schema.prisma の @relation 名が逆に割り当てられており、following に「フォロワー数」が、
// followedBy に「フォロー数」が入っていた。カウントの取り違えはリレーション名を辿らないと
// 気づけないため、実DBで「A が B をフォローした」状態を作って両者の数を突き合わせる。
describe("フォロー数 / フォロワー数のカウント (Integration)", () => {
	it("A が B をフォローしたとき、A はフォロー1・フォロワー0、B はフォロー0・フォロワー1になる", async () => {
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		await followUser(bob.userProfileId);

		// フォローした側（A）
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		const aliceProfile = await getCurrentUser();

		expect(aliceProfile?.followingCount).toBe(1);
		expect(aliceProfile?.followersCount).toBe(0);

		// フォローされた側（B）
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: bob.authUserId } },
		});
		const bobProfile = await getCurrentUser();

		expect(bobProfile?.followingCount).toBe(0);
		expect(bobProfile?.followersCount).toBe(1);

		// 後片付け
		mockGetUser.mockResolvedValueOnce({
			data: { user: { id: alice.authUserId } },
		});
		await unfollowUser(bob.userProfileId);
	});
});
