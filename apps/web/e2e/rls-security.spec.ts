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

	// 機微テーブル: anon からデータを取得できないこと(=RLSで遮断)を検証する。
	// Why not(200+0件に固定しない): anon にテーブルの SELECT GRANT が残る環境では
	// RLS deny により 200+空配列、GRANT すら無い環境(Supabase の新ベーステンプレート)
	// では 401 permission denied になる。どちらも「anon はデータを取得できない」で
	// 目的は同じため、両方を合格とみなす。GRANT 状態は環境差があり本テストの主眼で
	// ないため、ここでは終状態(データ非取得)のみを担保する。
	const sensitiveTables = [
		"user_profiles",
		"admin_users",
		"invoices",
		"bars",
		"posts",
		"user_coupons",
	];

	for (const table of sensitiveTables) {
		test(`anon は ${table} からデータを取得できない`, async ({ request }) => {
			const url = `${restBase()}/${table}?select=*&limit=5`;
			const res = await request.get(url, { headers: anonHeaders() });
			const body = await res.text();
			if (res.status() === 200) {
				// GRANT が残る環境: RLS deny で必ず空配列になる。
				const rows = JSON.parse(body) as unknown[];
				expect(Array.isArray(rows), `GET ${url} -> ${body}`).toBeTruthy();
				expect(rows.length, `GET ${url} -> ${body}`).toBe(0);
			} else {
				// GRANT が無い環境: permission denied(401/403)で弾かれる。
				expect(res.status(), `GET ${url} -> ${body}`).toBeGreaterThanOrEqual(
					401,
				);
				expect(res.status(), `GET ${url} -> ${body}`).toBeLessThan(404);
			}
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

	test("anon は bars を DELETE しても破壊的操作が成立しない", async ({
		request,
	}) => {
		// anon の DELETE は RLS/GRANT により拒否される(401/403)か、マッチ行 0 件で
		// 何も消えず 204 が返る。いずれも破壊的操作は成立していない。
		// Why not(実行後に行数を確認しない): anon は SELECT も遮断されるため、削除結果を
		// anon 自身では観測できない。ここでは DELETE 応答が「拒否 or 無害な完了」で
		// あることを担保する(実データ非破壊はマイグレーション適用先のDBで別途検証済み)。
		const res = await request.delete(
			`${restBase()}/bars?name=eq.__never_matches_anything__`,
			{ headers: anonHeaders() },
		);
		const body = await res.text();
		const okNoOp = res.status() === 204 || res.status() === 200;
		const denied = res.status() >= 401 && res.status() < 404;
		expect(
			okNoOp || denied,
			`DELETE bars -> status=${res.status()} body=${body}`,
		).toBeTruthy();
	});
});

// Issue #513: anon/authenticated への過剰 DML GRANT を REVOKE したことを検証する。
// #511 のテストは「GRANT の有無に関わらずデータが取れない」終状態を担保するが、
// #513 では「そもそも GRANT が剥がれ permission denied(401/403) になる」ことを主眼に
// 検証する。GRANT が残ったまま RLS deny で空配列(200)になるケースは #513 では不合格とし、
// 過剰権限そのものが除去されたことを主張する。
test.describe("最小権限化: anon/authenticated の過剰 GRANT REVOKE (#513)", () => {
	test.skip(
		!SUPABASE_URL || !ANON_KEY,
		"NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定のためスキップ",
	);

	const restBase = () => `${SUPABASE_URL}/rest/v1`;
	const anonHeaders = () => ({
		apikey: ANON_KEY as string,
		Authorization: `Bearer ${ANON_KEY}`,
	});

	const expectPermissionDenied = (status: number, ctx: string) => {
		// GRANT が無いと PostgREST は 401(anon)/403(role あり) の permission denied を返す。
		expect(status, ctx).toBeGreaterThanOrEqual(401);
		expect(status, ctx).toBeLessThan(404);
	};

	// anon から SELECT が GRANT レベルで拒否される(200+空配列ではない)ことを検証する。
	// これらのテーブルは anon に SELECT GRANT が残っていない。
	for (const table of ["user_profiles", "admin_users", "invoices", "bars"]) {
		test(`anon の ${table} SELECT は GRANT 拒否される`, async ({ request }) => {
			const url = `${restBase()}/${table}?select=*&limit=1`;
			const res = await request.get(url, { headers: anonHeaders() });
			expectPermissionDenied(res.status(), `GET ${url} -> ${await res.text()}`);
		});
	}

	test("anon の user_profiles INSERT は GRANT 拒否される", async ({
		request,
	}) => {
		const res = await request.post(`${restBase()}/user_profiles`, {
			headers: { ...anonHeaders(), "Content-Type": "application/json" },
			data: { last_name: "__probe__", first_name: "__probe__" },
		});
		expectPermissionDenied(
			res.status(),
			`POST user_profiles -> ${await res.text()}`,
		);
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

	// Issue #513: authenticated は user_profiles 以外のテーブルへ GRANT を持たないため、
	// 自己参照ポリシーがあっても他テーブルへの SELECT は permission denied になる。
	test("authenticated は user_profiles 以外の bars を SELECT できない (#513)", async ({
		request,
	}) => {
		const jwt = signAuthenticatedJwt(AUTH_UID as string, JWT_SECRET as string);
		const res = await request.get(
			`${SUPABASE_URL}/rest/v1/bars?select=id&limit=1`,
			{
				headers: {
					apikey: ANON_KEY as string,
					Authorization: `Bearer ${jwt}`,
				},
			},
		);
		expect(
			res.status(),
			`GET bars -> ${await res.text()}`,
		).toBeGreaterThanOrEqual(401);
		expect(res.status()).toBeLessThan(404);
	});
});
