import { beforeAll, describe, expect, it } from "vitest";

// Why not: auth.ts は import 時に JWT_SECRET の存在チェックを行うため、
//          import より前に環境変数を仕込む必要がある。
process.env.JWT_SECRET = "test-jwt-secret-for-unit-testing-purpose-only";

let authModule: typeof import("@/lib/auth");

beforeAll(async () => {
	authModule = await import("@/lib/auth");
});

describe("hashPassword / verifyPassword", () => {
	it("正しいパスワードを与えると verify が true を返す", async () => {
		const password = "Test1234!@#";
		const hash = await authModule.hashPassword(password);

		const result = await authModule.verifyPassword(password, hash);
		expect(result).toBe(true);
	});

	it("間違ったパスワードを与えると verify が false を返す", async () => {
		const password = "Test1234!@#";
		const hash = await authModule.hashPassword(password);

		const result = await authModule.verifyPassword("WrongPassword!", hash);
		expect(result).toBe(false);
	});

	it("空文字パスワードと正規のハッシュは false を返す", async () => {
		const hash = await authModule.hashPassword("Test1234!@#");
		const result = await authModule.verifyPassword("", hash);
		expect(result).toBe(false);
	});
});

describe("createToken / verifyToken", () => {
	const user = {
		id: "11111111-1111-1111-1111-111111111111",
		bar_manage_id: "test-bar",
		name: "テストオーナー",
		role: "bar_owner" as const,
		bar_id: 1,
		password_hash: "irrelevant-for-token",
		contact_email: null,
		contact_phone: null,
		approval_status: "approved" as const,
		is_active: true,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z",
	};

	it("createToken で生成したトークンが verifyToken で検証できる", async () => {
		const token = await authModule.createToken(user);
		const payload = await authModule.verifyToken(token);

		expect(payload).not.toBeNull();
		expect(payload?.id).toBe(user.id);
		expect(payload?.barManageId).toBe(user.bar_manage_id);
		expect(payload?.role).toBe(user.role);
		expect(payload?.barId).toBe(user.bar_id);
	});

	it("不正なトークン文字列を verifyToken に渡すと null が返る", async () => {
		const payload = await authModule.verifyToken("invalid.token.value");
		expect(payload).toBeNull();
	});

	it("空文字を verifyToken に渡すと null が返る", async () => {
		const payload = await authModule.verifyToken("");
		expect(payload).toBeNull();
	});
});

describe("canAccessBar", () => {
	const adminUser = {
		id: "admin-id",
		barManageId: "admin",
		name: "管理者",
		role: "admin" as const,
		barId: null,
	};

	const barOwnerUser = {
		id: "owner-id",
		barManageId: "bar-owner",
		name: "店舗オーナー",
		role: "bar_owner" as const,
		barId: 5,
	};

	it("admin はどの店舗にもアクセス可能", () => {
		expect(authModule.canAccessBar(adminUser, 1)).toBe(true);
		expect(authModule.canAccessBar(adminUser, 999)).toBe(true);
		expect(authModule.canAccessBar(adminUser, "10")).toBe(true);
	});

	it("bar_owner は自店舗（barId 一致）のみアクセス可能", () => {
		expect(authModule.canAccessBar(barOwnerUser, 5)).toBe(true);
		expect(authModule.canAccessBar(barOwnerUser, "5")).toBe(true);
	});

	it("bar_owner は他店舗（barId 不一致）にはアクセスできない", () => {
		expect(authModule.canAccessBar(barOwnerUser, 6)).toBe(false);
		expect(authModule.canAccessBar(barOwnerUser, "10")).toBe(false);
	});
});
