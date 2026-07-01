import { faker } from "@faker-js/faker";
import { createClient } from "@supabase/supabase-js";
import type { PrismaClient } from "@/generated/prisma";

// Why not: 衝突回避のため UUID にすると人間が grep しづらいので、固定接頭辞 + faker のランダム要素を使う。
// クリーンアップは「`it-` 接頭辞の付いたものだけ消す」ポリシーで担保。
export const INTEGRATION_TEST_PREFIX = "it-";

export type TestAuthUser = {
	authUserId: string;
	email: string;
	userProfileId: string;
	nickname: string;
};

function buildSupabaseAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !serviceRoleKey) {
		throw new Error(
			"Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
		);
	}
	return createClient(url, serviceRoleKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});
}

export async function createTestAuthUser(
	prisma: PrismaClient,
): Promise<TestAuthUser> {
	const admin = buildSupabaseAdmin();
	const suffix = faker.string.alphanumeric(8).toLowerCase();
	const email = `${INTEGRATION_TEST_PREFIX}${suffix}@example.test`;
	const nickname = `${INTEGRATION_TEST_PREFIX}${suffix}`;

	const { data, error } = await admin.auth.admin.createUser({
		email,
		password: faker.internet.password({ length: 16 }),
		email_confirm: true,
	});
	if (error || !data.user) {
		throw new Error(
			`Failed to create test auth user: ${error?.message ?? "unknown"}`,
		);
	}

	const profile = await prisma.userProfile.create({
		data: {
			userAuthId: data.user.id,
			lastName: `${INTEGRATION_TEST_PREFIX}last`,
			firstName: `${INTEGRATION_TEST_PREFIX}first`,
			nickname,
			birthday: new Date("1990-01-01"),
			gender: "other",
			prefecture: "東京都",
		},
	});

	return {
		authUserId: data.user.id,
		email,
		userProfileId: profile.id,
		nickname,
	};
}

export async function createTestBar(
	prisma: PrismaClient,
	overrides: {
		name?: string;
		city?: string;
		prefecture?: string;
		latitude?: number | null;
		longitude?: number | null;
	} = {},
): Promise<{ id: bigint; name: string }> {
	const suffix = faker.string.alphanumeric(8).toLowerCase();
	const name = overrides.name ?? `${INTEGRATION_TEST_PREFIX}bar-${suffix}`;
	const bar = await prisma.bar.create({
		data: {
			name,
			prefecture: overrides.prefecture ?? "東京都",
			city: overrides.city ?? "渋谷区",
			addressLine1: `${INTEGRATION_TEST_PREFIX}address-${suffix}`,
			description: `${INTEGRATION_TEST_PREFIX}description`,
			latitude: overrides.latitude ?? null,
			longitude: overrides.longitude ?? null,
		},
	});
	return { id: bar.id, name: bar.name };
}

export async function createTestCoupon(
	prisma: PrismaClient,
	barId: bigint,
	overrides: {
		title?: string;
		description?: string | null;
		validUntil?: Date | null;
	} = {},
): Promise<{ id: bigint }> {
	const suffix = faker.string.alphanumeric(8).toLowerCase();
	const coupon = await prisma.barCoupon.create({
		data: {
			barId,
			title: overrides.title ?? `${INTEGRATION_TEST_PREFIX}coupon-${suffix}`,
			description:
				overrides.description === undefined
					? `${INTEGRATION_TEST_PREFIX}coupon-desc`
					: overrides.description,
			discountType: "percentage",
			discountValue: 10,
			validUntil: overrides.validUntil ?? null,
		},
	});
	return { id: coupon.id };
}

export type CleanupOptions = {
	authUserIds?: string[];
};

// Why not: 個別 ID 指定削除を基本にする (グローバル DELETE WHERE name LIKE 'it-%' は、
// 並列実行や seed データ侵食の事故が起きるため)。
// 呼び出し側で作成順の逆順で個別に消すのが安全だが、本ヘルパでは
// 「it- 接頭辞の付いた user / bar / それらに紐づく派生」のみ責任範囲とする。
export async function cleanupTestData(
	prisma: PrismaClient,
	options: CleanupOptions = {},
): Promise<void> {
	const admin = buildSupabaseAdmin();

	// it- 接頭辞の付いた user_profiles に紐づく派生をまとめて消す。
	const profiles = await prisma.userProfile.findMany({
		where: {
			nickname: { startsWith: INTEGRATION_TEST_PREFIX },
		},
		select: { id: true, userAuthId: true },
	});
	const profileIds = profiles.map((p) => p.id);

	if (profileIds.length > 0) {
		await prisma.notification.deleteMany({
			where: { userId: { in: profileIds } },
		});
		await prisma.postLike.deleteMany({
			where: { userId: { in: profileIds } },
		});
		await prisma.articleLike.deleteMany({
			where: { userId: { in: profileIds } },
		});
		await prisma.userCoupon.deleteMany({
			where: { userId: { in: profileIds } },
		});
		await prisma.favoriteBar.deleteMany({
			where: { userId: { in: profileIds } },
		});
		await prisma.viewHistory.deleteMany({
			where: { userId: { in: profileIds } },
		});
		await prisma.userFollowRelation.deleteMany({
			where: {
				OR: [
					{ followerId: { in: profileIds } },
					{ followeeId: { in: profileIds } },
				],
			},
		});
		await prisma.post.deleteMany({
			where: { userId: { in: profileIds } },
		});
		await prisma.userProfile.deleteMany({
			where: { id: { in: profileIds } },
		});
	}

	// Why not: bars の CASCADE で bar_coupons / bar_beer_menus / bar_food_menus / articles / posts /
	// bar_payment_methods / bar_events / favorite_bars / view_histories などは自動で消える。
	// it- 接頭辞の bar だけを対象に絞ることで seed.e2e.sql の固定店舗を侵さない。
	await prisma.bar.deleteMany({
		where: { name: { startsWith: INTEGRATION_TEST_PREFIX } },
	});

	const targetAuthIds =
		options.authUserIds ?? profiles.map((p) => p.userAuthId);
	for (const authUserId of targetAuthIds) {
		// Why not: 失敗を無視して進める。auth.users が既に削除済みでも、後続テストには影響しない。
		await admin.auth.admin.deleteUser(authUserId).catch(() => undefined);
	}
}
