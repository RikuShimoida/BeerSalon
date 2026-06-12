import { faker } from "@faker-js/faker";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { PrismaClient } from "@/generated/prisma";
import {
	cleanupTestData,
	createTestAuthUser,
	INTEGRATION_TEST_PREFIX,
	type TestAuthUser,
} from "@/test/integration-helpers";

// Why not: createClient() は cookies() に依存するため、Integration では auth.getUser() だけ差し替える。
// Storage 経路 (profile_image_path 付き) は UT で網羅済みなので、ここでは Cookie に画像パスを入れず
// 「DB に user_profiles が INSERT される」副作用だけを検証する。
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
	createClient: async () => ({
		auth: {
			getUser: mockGetUser,
		},
		storage: {
			from: () => ({
				download: vi.fn(),
				upload: vi.fn(),
				remove: vi.fn(),
				getPublicUrl: vi.fn(),
			}),
		},
	}),
}));

// Why not: next/headers の cookies() はリクエストコンテキストに依存し Integration では直接呼べない。
// テストごとに mockCookieStore.get の戻り値を切り替える形に差し替える。
const mockCookieStore = {
	get: vi.fn(),
	delete: vi.fn(),
};
vi.mock("next/headers", () => ({
	cookies: async () => mockCookieStore,
}));

// Why not: 成功時 redirect() は throw する。Integration では throw を握り潰しつつ呼び出し URL を検知できれば良い。
vi.mock("next/navigation", () => ({
	redirect: vi.fn((url: string) => {
		throw new Error(`NEXT_REDIRECT:${url}`);
	}),
}));

import { confirmAndSaveProfile } from "@/app/signup/confirm/actions";

const prisma = new PrismaClient({
	adapter: new PrismaPg(
		new Pool({ connectionString: process.env.DATABASE_URL }),
	),
});

function buildSupabaseAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !serviceRoleKey) {
		throw new Error(
			"Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
		);
	}
	return createSupabaseClient(url, serviceRoleKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});
}

// Why not: createTestAuthUser は user_profile も一緒に作るが、本テストでは
// 「user_profile が無い状態」から confirmAndSaveProfile で INSERT されることを検証したいので
// auth.users だけを作るヘルパをローカルに定義する。
async function createAuthOnlyUser(): Promise<{
	authUserId: string;
	email: string;
}> {
	const admin = buildSupabaseAdmin();
	const suffix = faker.string.alphanumeric(8).toLowerCase();
	const email = `${INTEGRATION_TEST_PREFIX}${suffix}@example.test`;
	const { data, error } = await admin.auth.admin.createUser({
		email,
		password: faker.internet.password({ length: 16 }),
		email_confirm: true,
	});
	if (error || !data.user) {
		throw new Error(
			`Failed to create auth-only test user: ${error?.message ?? "unknown"}`,
		);
	}
	return { authUserId: data.user.id, email };
}

let existingProfileUser: TestAuthUser;
const authOnlyUsers: { authUserId: string }[] = [];

beforeAll(async () => {
	// 既存プロフィール持ちユーザー (重複検出テスト用)
	existingProfileUser = await createTestAuthUser(prisma);
});

afterAll(async () => {
	const authIds = [
		existingProfileUser.authUserId,
		...authOnlyUsers.map((u) => u.authUserId),
	];
	await cleanupTestData(prisma, { authUserIds: authIds });
	await prisma.$disconnect();
});

beforeEach(() => {
	mockCookieStore.get.mockReset();
	mockCookieStore.delete.mockReset();
	mockGetUser.mockReset();
});

function setProfileDataCookie(data: Record<string, string>) {
	mockCookieStore.get.mockImplementation((name: string) => {
		if (name === "profile_data") {
			return { value: JSON.stringify(data) };
		}
		return undefined;
	});
}

describe("confirmAndSaveProfile (Integration)", () => {
	it("新規ユーザーのプロフィールが user_profiles に INSERT され、/ に redirect される", async () => {
		const authUser = await createAuthOnlyUser();
		authOnlyUsers.push({ authUserId: authUser.authUserId });

		const suffix = faker.string.alphanumeric(6).toLowerCase();
		const profileInput = {
			lastName: `${INTEGRATION_TEST_PREFIX}last`,
			firstName: `${INTEGRATION_TEST_PREFIX}first`,
			nickname: `${INTEGRATION_TEST_PREFIX}nick-${suffix}`,
			birthday: "1995-04-01",
			gender: "male",
			prefecture: "静岡県",
			bio: "",
		};
		setProfileDataCookie(profileInput);
		mockGetUser.mockResolvedValue({
			data: { user: { id: authUser.authUserId } },
		});

		let redirectUrl: string | null = null;
		try {
			await confirmAndSaveProfile(undefined, new FormData());
		} catch (error) {
			const message = error instanceof Error ? error.message : "";
			if (message.startsWith("NEXT_REDIRECT:")) {
				redirectUrl = message.replace("NEXT_REDIRECT:", "");
			} else {
				throw error;
			}
		}
		expect(redirectUrl).toBe("/");

		const created = await prisma.userProfile.findUnique({
			where: { userAuthId: authUser.authUserId },
		});
		expect(created).not.toBeNull();
		expect(created?.nickname).toBe(profileInput.nickname);
		expect(created?.lastName).toBe(profileInput.lastName);
		expect(created?.firstName).toBe(profileInput.firstName);
		expect(created?.prefecture).toBe(profileInput.prefecture);
		expect(created?.gender).toBe(profileInput.gender);
		expect(created?.birthday.toISOString()).toBe(
			new Date(profileInput.birthday).toISOString(),
		);

		// Cookie 削除が実行されたことを確認 (副作用の網羅)
		expect(mockCookieStore.delete).toHaveBeenCalledWith("profile_data");
		expect(mockCookieStore.delete).toHaveBeenCalledWith("profile_image_path");
	});

	it("既に user_profiles が存在するユーザーは新規 INSERT されず / に redirect される", async () => {
		const before = await prisma.userProfile.count({
			where: { userAuthId: existingProfileUser.authUserId },
		});
		expect(before).toBe(1);

		setProfileDataCookie({
			lastName: "上書き姓",
			firstName: "上書き名",
			nickname: `${INTEGRATION_TEST_PREFIX}should-not-be-saved`,
			birthday: "2000-01-01",
			gender: "male",
			prefecture: "東京都",
			bio: "",
		});
		mockGetUser.mockResolvedValue({
			data: { user: { id: existingProfileUser.authUserId } },
		});

		let redirectUrl: string | null = null;
		try {
			await confirmAndSaveProfile(undefined, new FormData());
		} catch (error) {
			const message = error instanceof Error ? error.message : "";
			if (message.startsWith("NEXT_REDIRECT:")) {
				redirectUrl = message.replace("NEXT_REDIRECT:", "");
			} else {
				throw error;
			}
		}
		expect(redirectUrl).toBe("/");

		// Why not: ユニーク制約 (userAuthId) に依存せず、件数自体が増えていないことを確認する。
		const after = await prisma.userProfile.count({
			where: { userAuthId: existingProfileUser.authUserId },
		});
		expect(after).toBe(1);

		// 既存プロフィールの内容が上書きされていない (新規 INSERT 経路を通っていない) ことも確認
		const profile = await prisma.userProfile.findUniqueOrThrow({
			where: { userAuthId: existingProfileUser.authUserId },
		});
		expect(profile.nickname).toBe(existingProfileUser.nickname);
	});
});
