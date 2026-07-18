import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Footer } from "./footer";
import { NAV_ITEMS } from "./nav-items";

const usePathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
	usePathname: () => usePathnameMock(),
}));

describe("Footer（モバイルボトムナビ）", () => {
	beforeEach(() => {
		usePathnameMock.mockReset();
	});

	it("nav-items の全項目を定義された href でレンダリングする", () => {
		usePathnameMock.mockReturnValue("/");
		render(<Footer />);

		for (const item of NAV_ITEMS) {
			const link = screen.getByRole("link", { name: item.label });
			expect(link).toHaveAttribute("href", item.href);
		}
	});

	it("現在のパスに一致する項目に aria-current=page が付く", () => {
		usePathnameMock.mockReturnValue("/timeline");
		render(<Footer />);

		expect(screen.getByRole("link", { name: "タイムライン" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		expect(
			screen.getByRole("link", { name: "お気に入り" }),
		).not.toHaveAttribute("aria-current");
	});

	it("PC 幅で非表示にする md:hidden が付いている", () => {
		usePathnameMock.mockReturnValue("/");
		const { container } = render(<Footer />);
		const footer = container.querySelector("footer");
		expect(footer?.className).toContain("md:hidden");
	});

	it("中央の投稿 FAB がアンバーグラデ丸で描画される", () => {
		usePathnameMock.mockReturnValue("/");
		render(<Footer />);

		const postLink = screen.getByRole("link", { name: "投稿" });
		const fab = postLink.querySelector("span");
		expect(fab?.className).toContain("rounded-full");
		expect(fab?.className).toContain("from-primary");
		expect(fab?.className).toContain("to-primary-strong");
	});
});
