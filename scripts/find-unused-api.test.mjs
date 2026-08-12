// biome-ignore-all lint/suspicious/noTemplateCurlyInString: テスト入力として `${barId}` 等を含む呼び出しソース行を「文字列そのもの」として与える必要がある。ここでテンプレートリテラル化すると変数展開されテストの意図（未展開の呼び出しコードに対する grep 挙動の検証）が壊れる。
import { describe, expect, it } from "vitest";
import {
	collectTrailingVariablePrefixMatchers,
	deriveUrlPath,
	EXTERNAL_ENTRYPOINT_ALLOWLIST,
	hasDynamicSegment,
	isHeldByTrailingVariable,
	isReferenced,
	urlPathToCallRegExp,
} from "./find-unused-api.lib.mjs";

describe("deriveUrlPath", () => {
	it("admin の静的ルートから URL パスを導出する", () => {
		expect(
			deriveUrlPath("apps/admin/src/app/api/master/beer-categories/route.ts"),
		).toBe("/api/master/beer-categories");
	});

	it("web の非 /api ルート（auth コールバック）も導出する", () => {
		expect(deriveUrlPath("apps/web/src/app/auth/callback/route.ts")).toBe(
			"/auth/callback",
		);
	});

	it("動的セグメント [barId] は角括弧付きのまま保持する", () => {
		expect(
			deriveUrlPath("apps/admin/src/app/api/bars/[barId]/coupons/route.ts"),
		).toBe("/api/bars/[barId]/coupons");
	});

	it("複数の動的セグメントを保持する", () => {
		expect(
			deriveUrlPath(
				"apps/admin/src/app/api/bars/[barId]/coupons/[couponId]/route.ts",
			),
		).toBe("/api/bars/[barId]/coupons/[couponId]");
	});

	it("ルートグループ (group) は URL に含めない", () => {
		expect(
			deriveUrlPath("apps/web/src/app/(marketing)/api/health/route.ts"),
		).toBe("/api/health");
	});

	it("並行ルート @slot は URL に含めない", () => {
		expect(deriveUrlPath("apps/web/src/app/@modal/api/preview/route.ts")).toBe(
			"/api/preview",
		);
	});

	it("route.tsx（拡張子 tsx）も扱える", () => {
		expect(deriveUrlPath("apps/web/src/app/api/foo/route.tsx")).toBe(
			"/api/foo",
		);
	});

	it("app ルートを特定できないパスは null を返す", () => {
		expect(deriveUrlPath("packages/shared/src/index.ts")).toBeNull();
	});
});

describe("hasDynamicSegment", () => {
	it("動的セグメントを含む URL は true", () => {
		expect(hasDynamicSegment("/api/bars/[barId]")).toBe(true);
	});

	it("静的 URL は false", () => {
		expect(hasDynamicSegment("/api/master/beer-categories")).toBe(false);
	});
});

describe("urlPathToCallRegExp", () => {
	it("静的 URL に完全一致する", () => {
		const re = urlPathToCallRegExp("/api/master/beer-categories");
		expect(re.test('fetch("/api/master/beer-categories")')).toBe(true);
	});

	it("静的 URL の前方一致だけでは誤検出しない（別ルートに反応しない）", () => {
		// /api/master/beers は削除済み。/api/master/beer-categories の正規表現が
		// /api/master/beers に反応してはいけない（その逆も）。
		const re = urlPathToCallRegExp("/api/master/beers");
		expect(re.test('fetch("/api/master/beer-categories")')).toBe(false);
	});

	it("動的セグメントをテンプレートリテラル呼び出しに一致させる", () => {
		const re = urlPathToCallRegExp("/api/bars/[barId]/coupons");
		expect(re.test("fetch(`/api/bars/${barId}/coupons`)")).toBe(true);
	});

	it("動的セグメントを静的に組んだ文字列にも一致させる", () => {
		const re = urlPathToCallRegExp("/api/bars/[barId]/coupons");
		expect(re.test('fetch("/api/bars/abc123/coupons")')).toBe(true);
	});

	it("末尾に別セグメントが続く場合、短い URL は途中一致しない", () => {
		// /api/bars/[barId] の正規表現が /api/bars/${barId}/coupons に対して
		// "coupons" まで含む長い URL を短い URL の一致とみなさないこと。
		const re = urlPathToCallRegExp("/api/bars/[barId]");
		expect(re.test("fetch(`/api/bars/${barId}/coupons`)")).toBe(false);
	});

	it("末尾 URL の直後がバッククォートでも一致する", () => {
		const re = urlPathToCallRegExp("/api/bars/[barId]");
		expect(re.test("fetch(`/api/bars/${barId}`)")).toBe(true);
	});

	it("クエリ文字列が続く URL に一致する", () => {
		const re = urlPathToCallRegExp("/api/bars");
		expect(re.test('fetch("/api/bars?status=pending")')).toBe(true);
	});
});

describe("isReferenced", () => {
	const callSites = [
		'fetch("/api/bars")',
		"fetch(`/api/bars/${barId}/coupons`)",
		'fetch("/api/payment-methods")',
	];

	it("呼び出されている静的ルートは true", () => {
		expect(isReferenced("/api/payment-methods", callSites)).toBe(true);
	});

	it("呼び出されている動的ルートは true", () => {
		expect(isReferenced("/api/bars/[barId]/coupons", callSites)).toBe(true);
	});

	it("どこからも呼ばれないルートは false", () => {
		expect(isReferenced("/api/master/beers", callSites)).toBe(false);
	});

	it("呼び出しソースが空なら常に false", () => {
		expect(isReferenced("/api/bars", [])).toBe(false);
	});
});

describe("collectTrailingVariablePrefixMatchers / isHeldByTrailingVariable", () => {
	it("末尾が実行時変数の呼び出しがあると、そのプレフィックス直下のルートを保留にする", () => {
		const callSites = [
			"const response = await fetch(`/api/bars/${barId}/${endpoint}`, { method: 'POST' })",
		];
		const matchers = collectTrailingVariablePrefixMatchers(callSites);
		expect(matchers.length).toBeGreaterThan(0);
		// プレフィックス /api/bars/[barId] の直下 1 階層は保留対象
		expect(
			isHeldByTrailingVariable("/api/bars/[barId]/invoices", matchers),
		).toBe(true);
		expect(isHeldByTrailingVariable("/api/bars/[barId]/portal", matchers)).toBe(
			true,
		);
	});

	it("プレフィックスより深い階層のルートは保留にしない（末尾変数では叩けない）", () => {
		const callSites = ["fetch(`/api/bars/${barId}/${endpoint}`)"];
		const matchers = collectTrailingVariablePrefixMatchers(callSites);
		expect(
			isHeldByTrailingVariable(
				"/api/bars/[barId]/coupons/[couponId]",
				matchers,
			),
		).toBe(false);
	});

	it("プレフィックス外のルートは保留にしない", () => {
		const callSites = ["fetch(`/api/bars/${barId}/${endpoint}`)"];
		const matchers = collectTrailingVariablePrefixMatchers(callSites);
		expect(
			isHeldByTrailingVariable("/api/master/beer-categories", matchers),
		).toBe(false);
	});

	it("末尾が固定セグメントの動的呼び出しからはプレフィックスを抽出しない", () => {
		const callSites = ["fetch(`/api/bars/${barId}/coupons`)"];
		expect(collectTrailingVariablePrefixMatchers(callSites)).toHaveLength(0);
	});

	it("単一変数（末尾が /${barId}）の呼び出しはプレフィックス抽出対象だが、親自身は直下1階層に該当しない", () => {
		const callSites = ["fetch(`/api/bars/${barId}`)"];
		const matchers = collectTrailingVariablePrefixMatchers(callSites);
		// /api/bars/${barId} は「/api/bars 直下 1 階層」の呼び出し。
		// よって /api/bars/[barId] 自身が保留対象になる（末尾変数でそのルートが叩かれ得る）。
		expect(isHeldByTrailingVariable("/api/bars/[barId]", matchers)).toBe(true);
		// ただし 2 階層下は該当しない。
		expect(
			isHeldByTrailingVariable("/api/bars/[barId]/coupons", matchers),
		).toBe(false);
	});
});

describe("EXTERNAL_ENTRYPOINT_ALLOWLIST", () => {
	it("Supabase Auth コールバックと Stripe Webhook を除外対象に含む", () => {
		expect(EXTERNAL_ENTRYPOINT_ALLOWLIST).toContain("/auth/callback");
		expect(EXTERNAL_ENTRYPOINT_ALLOWLIST).toContain("/api/webhooks/stripe");
	});
});
