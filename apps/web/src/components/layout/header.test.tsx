import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./header";

vi.mock("@/actions/notification", () => ({
	getUnreadNotificationCount: vi.fn().mockResolvedValue(0),
}));

vi.mock("./header-nav", () => ({
	HeaderNav: () => <nav data-testid="header-nav" />,
}));

vi.mock("./actions", () => ({
	logout: vi.fn(),
}));

describe("Header（共通ヘッダーのロゴ）", () => {
	it("ロゴをインラインSVG(role=img, aria-label=Beer Salon)で描画する", async () => {
		render(await Header());

		// next/image の外部SVGではなくインラインSVGで描画する（フォント適用のため）
		const logo = screen.getByRole("img", { name: "Beer Salon" });
		expect(logo.tagName.toLowerCase()).toBe("svg");
	});

	it("ロゴのリンクがトップページ / を指す", async () => {
		render(await Header());

		const link = screen.getByRole("link", { name: "Beer Salon ホーム" });
		expect(link).toHaveAttribute("href", "/");
	});

	it("ワードマークは next/font の CSS 変数を font-family に参照する", async () => {
		render(await Header());

		// 外部SVG(<img>)では next/font が効かないため、CSS変数参照で確実に適用する。
		// "Beer" は明朝、"Salon"/オーバーラインは Archivo を CSS 変数で指定している。
		const logo = screen.getByRole("img", { name: "Beer Salon" });
		const texts = logo.querySelectorAll("text, tspan");
		const fontFamilies = Array.from(texts).map((t) =>
			t.getAttribute("font-family"),
		);

		expect(fontFamilies.some((f) => f?.includes("--font-mincho"))).toBe(true);
		expect(fontFamilies.some((f) => f?.includes("--font-archivo"))).toBe(true);
	});

	it("旧ロゴアセット(<img src>)を参照していない", async () => {
		render(await Header());

		// インライン化により img 要素自体が存在しない
		expect(screen.queryByRole("img")?.tagName.toLowerCase()).not.toBe("img");
		expect(document.querySelector('img[src*="beer-salon-logo"]')).toBeNull();
	});
});
