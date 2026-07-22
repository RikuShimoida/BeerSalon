import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./header";

vi.mock("next/image", () => ({
	default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
		// biome-ignore lint/performance/noImgElement: テスト用next/imageモック
		<img {...props} alt={props.alt} />
	),
}));

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
	it("ロゴが新アセット beer-salon-logo-a.svg を src に表示する", async () => {
		render(await Header());

		const logo = screen.getByAltText("Beer Salon");
		expect(logo).toHaveAttribute("src", "/beer-salon-logo-a.svg");
	});

	it("ロゴのリンクがトップページ / を指す", async () => {
		render(await Header());

		const link = screen.getByRole("link", { name: "Beer Salon ホーム" });
		expect(link).toHaveAttribute("href", "/");
	});

	it("旧ロゴ beer-salon-logo.svg を参照していない", async () => {
		render(await Header());

		const logo = screen.getByAltText("Beer Salon");
		expect(logo.getAttribute("src")).not.toBe("/beer-salon-logo.svg");
	});
});
