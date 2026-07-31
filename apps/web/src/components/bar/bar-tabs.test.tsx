import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarTabs } from "./bar-tabs";

const children = {
	top: <div>基本情報コンテンツ</div>,
	menu: <div>メニューコンテンツ</div>,
	posts: <div>投稿コンテンツ</div>,
	articles: <div>お店からの投稿コンテンツ</div>,
	coupons: <div>クーポンコンテンツ</div>,
	events: <div>イベントコンテンツ</div>,
};

describe("BarTabs のアクティブ切替", () => {
	it("初期は基本情報タブがアクティブ（aria-current=page）で該当コンテンツを表示する", () => {
		render(<BarTabs>{children}</BarTabs>);

		const topTab = screen.getByRole("button", { name: "基本情報" });
		expect(topTab).toHaveAttribute("aria-current", "page");
		expect(screen.getByText("基本情報コンテンツ")).toBeInTheDocument();
		expect(screen.queryByText("メニューコンテンツ")).not.toBeInTheDocument();
	});

	it("タブをクリックするとアクティブ（aria-current=page）が移り、コンテンツが切り替わる", () => {
		render(<BarTabs>{children}</BarTabs>);

		const menuTab = screen.getByRole("button", { name: "メニュー" });
		fireEvent.click(menuTab);

		expect(menuTab).toHaveAttribute("aria-current", "page");
		expect(
			screen.getByRole("button", { name: "基本情報" }),
		).not.toHaveAttribute("aria-current");
		expect(screen.getByText("メニューコンテンツ")).toBeInTheDocument();
		expect(screen.queryByText("基本情報コンテンツ")).not.toBeInTheDocument();
	});

	it("アクティブタブはアンバー文字クラス（text-primary）を持つ", () => {
		render(<BarTabs>{children}</BarTabs>);

		const topTab = screen.getByRole("button", { name: "基本情報" });
		expect(topTab.className).toContain("text-primary");
	});
});

describe("BarTabs のスクロールアフォーダンス（フェード）", () => {
	it("左右フェードは aria-hidden でアクセシビリティツリーから隠れる（タブ操作を汚染しない）", () => {
		const { container } = render(<BarTabs>{children}</BarTabs>);

		const fades = container.querySelectorAll('[aria-hidden="true"]');
		expect(fades).toHaveLength(2);

		// フェードは button/nav のクエリ対象を増やさない（6タブのみ取得できる）
		expect(screen.getAllByRole("button")).toHaveLength(6);
	});

	it("初期表示では左フェードは非表示（opacity-0）で描画される", () => {
		const { container } = render(<BarTabs>{children}</BarTabs>);

		// 先頭にいる初期状態では左に戻れる余地が無いため左フェードは opacity-0
		const leftFade = container.querySelector('[aria-hidden="true"].left-0');
		expect(leftFade?.className).toContain("opacity-0");
	});
});
