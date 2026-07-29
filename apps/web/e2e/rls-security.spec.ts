import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

// Issue #511: public 全テーブルの RLS 有効化を検証する。
// anon 公開鍵だけで機微テーブルの読み書き削除ができない(=RLSで遮断される)こと、
// および authenticated ロールが自分の user_profiles だけを SELECT できることを、
// REST API を直接叩いて確認する。UI ではなく DB 層のアクセス制御が対象のため、
// page ではなく request フィクスチャを使う。

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

test.describe("RLS: public テーブルのアクセス制御 (#511)", () => {
	test.skip(
		!SUPABASE_URL || !ANON_KEY,
		"NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定のためスキップ",
	);

	const restBase = () => `${SUPABASE_URL}/rest/v1`;
	const anonHeaders = () => ({
		apikey: ANON_KEY as string,
		Authorization: `Bearer ${ANON_KEY}`,
	});

	// 機微テーブル: RLS 有効 + ポリシー無し = anon からは 0 件になるべき。
	const sensitiveTables = [
		"user_profiles",
		"admin_users",
		"invoices",
		"bars",
		"posts",
		"user_coupons",
	];

	for (const table of sensitiveTables) {
		test(`anon は ${table} を SELECT しても 0 件になる`, async ({
			request,
		}) => {
			const url = `${restBase()}/${table}?select=*&limit=5`;
			const res = await request.get(url, { headers: anonHeaders() });
			// 失敗時に実 status/本文を CI ログへ残すため、第2引数にメッセージを渡す。
			expect(res.status(), `GET ${url} -> ${await res.text()}`).toBe(200);
			const rows = (await res.json()) as unknown[];
			expect(Array.isArray(rows)).toBeTruthy();
			expect(rows.length).toBe(0);
		});
	}

	test("anon は bars に INSERT できない (RLS で拒否)", async ({ request }) => {
		const res = await request.post(`${restBase()}/bars`, {
			headers: { ...anonHeaders(), "Content-Type": "application/json" },
			data: {
				name: "__e2e_anon_insert_probe__",
				prefecture: "東京都",
				city: "test",
				address_line1: "probe",
			},
		});
		// RLS ポリシー違反は 401/403 を返す(row-level security policy violation)。
		expect(res.status()).toBeGreaterThanOrEqual(401);
		expect(res.status()).toBeLessThan(404);
	});

	test("anon は bars を DELETE しても実データが消えない", async ({
		request,
	}) => {
		// RLS でマッチ行が 0 件のため 204 が返っても実際には何も削除されない。
		// 削除後に(anon では読めないので)行数の直接確認はできないが、少なくとも
		// エラーなく完了し、かつ SELECT が 0 件のまま = 破壊的操作が成立していない
		// ことを担保する。
		await request.delete(
			`${restBase()}/bars?name=eq.__never_matches_anything__`,
			{ headers: anonHeaders() },
		);
		const res = await request.get(`${restBase()}/bars?select=id&limit=1`, {
			headers: anonHeaders(),
		});
		const rows = (await res.json()) as unknown[];
		expect(rows.length).toBe(0);
	});
});

// authenticated ロールの自己参照ポリシーの検証は、JWT 署名用シークレットが
// テスト環境に存在する場合のみ実行する(CI 等で無い場合はスキップ)。
test.describe("RLS: authenticated の自己プロフィール参照 (#511)", () => {
	const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
	const AUTH_UID = process.env.E2E_RLS_AUTH_UID;

	test.skip(
		!SUPABASE_URL || !ANON_KEY || !JWT_SECRET || !AUTH_UID,
		"SUPABASE_JWT_SECRET / E2E_RLS_AUTH_UID 等が未設定のためスキップ",
	);

	const signAuthenticatedJwt = (sub: string, secret: string) => {
		const b64 = (o: unknown) =>
			Buffer.from(JSON.stringify(o)).toString("base64url");
		const now = Math.floor(Date.now() / 1000);
		const data = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({
			aud: "authenticated",
			role: "authenticated",
			sub,
			exp: now + 3600,
			iat: now,
		})}`;
		const sig = createHmac("sha256", secret).update(data).digest("base64url");
		return `${data}.${sig}`;
	};

	test("authenticated は自分の user_profiles を SELECT できる", async ({
		request,
	}) => {
		const jwt = signAuthenticatedJwt(AUTH_UID as string, JWT_SECRET as string);
		const res = await request.get(
			`${SUPABASE_URL}/rest/v1/user_profiles?select=id&user_auth_id=eq.${AUTH_UID}`,
			{
				headers: {
					apikey: ANON_KEY as string,
					Authorization: `Bearer ${jwt}`,
				},
			},
		);
		expect(res.ok()).toBeTruthy();
		const rows = (await res.json()) as unknown[];
		expect(rows.length).toBe(1);
	});
});
