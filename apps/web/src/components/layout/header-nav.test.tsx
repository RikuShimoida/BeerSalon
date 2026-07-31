import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeaderNav } from "./header-nav";

const usePathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
	usePathname: () => usePathnameMock(),
}));

describe("HeaderNav（PC 横ナビ）", () => {
	beforeEach(() => {
		usePathnameMock.mockReset();
	});

	it("横ナビにお気に入り/タイムライン/閲覧履歴のリンクが定義された href で並ぶ", () => {
		usePathnameMock.mockReturnValue("/");
		render(<HeaderNav />);

		expect(screen.getByRole("link", { name: "お気に入り" })).toHaveAttribute(
			"href",
			"/favorites/bars",
		);
		expect(screen.getByRole("link", { name: "タイムライン" })).toHaveAttribute(
			"href",
			"/timeline",
		);
		expect(screen.getByRole("link", { name: "閲覧履歴" })).toHaveAttribute(
			"href",
			"/history/bars",
		);
	});

	it("「投稿する」プライマリボタンが /posts/new へのリンクとして描画される", () => {
		usePathnameMock.mockReturnValue("/");
		render(<HeaderNav />);

		const postLink = screen.getByRole("link", { name: /投稿する/ });
		expect(postLink).toHaveAttribute("href", "/posts/new");
		expect(postLink.className).toContain("from-primary");
	});

	it("現在のパスに一致する横ナビ項目に aria-current=page とアンバー下線が付く", () => {
		usePathnameMock.mockReturnValue("/favorites/bars");
		render(<HeaderNav />);

		const active = screen.getByRole("link", { name: "お気に入り" });
		expect(active).toHaveAttribute("aria-current", "page");
		expect(active.className).toContain("text-primary");
		expect(active.className).toContain("border-primary");

		const inactive = screen.getByRole("link", { name: "タイムライン" });
		expect(inactive).not.toHaveAttribute("aria-current");
	});
});
