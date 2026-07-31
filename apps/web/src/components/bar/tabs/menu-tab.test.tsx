import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MenuTab } from "./menu-tab";

const baseBeerMenu = {
	id: "1",
	sizes: [],
	description: null as string | null,
	imageUrl: null as string | null,
	beer: {
		name: "静岡セッションIPA",
		description: "柑橘系ホップが香る一杯",
		origin: "静岡",
		abv: "5.50",
		brewery: { name: "ベアードブルーイング" },
		beerCategory: { name: "IPA" },
	},
};

const baseFoodMenu = {
	id: "10",
	name: "フィッシュ&チップス",
	price: 980,
	description: "サクサクの衣",
	imageUrl: null as string | null,
};

describe("MenuTab Beers セクションの表示", () => {
	it("見出し Beers 配下にビール名・スタイル・ABV・醸造所・産地を表示する", () => {
		render(<MenuTab beerMenus={[baseBeerMenu]} foodMenus={[]} />);

		expect(screen.getByText("Beers")).toBeInTheDocument();
		expect(screen.getByText("静岡セッションIPA")).toBeInTheDocument();
		expect(screen.getByText("IPA")).toBeInTheDocument();
		expect(screen.getByText("ABV 5.50%")).toBeInTheDocument();
		// 醸造所・産地は「醸造所名 / 産地」で併記
		expect(screen.getByText("ベアードブルーイング / 静岡")).toBeInTheDocument();
	});

	it("abv が未設定のときは ABV 表示を出さない", () => {
		render(
			<MenuTab
				beerMenus={[
					{ ...baseBeerMenu, beer: { ...baseBeerMenu.beer, abv: undefined } },
				]}
				foodMenus={[]}
			/>,
		);

		expect(screen.queryByText(/^ABV /)).not.toBeInTheDocument();
	});

	it("ビールメニューが0件のとき空メッセージを表示する", () => {
		render(<MenuTab beerMenus={[]} foodMenus={[]} />);

		expect(
			screen.getByText("ビールメニューはまだ登録されていません。"),
		).toBeInTheDocument();
	});

	it("画像未設定でも Unsplash 等の外部画像に依存せず描画される（img を出さない）", () => {
		const { container } = render(
			<MenuTab beerMenus={[baseBeerMenu]} foodMenus={[]} />,
		);

		// 画像未設定時はフォールバックのアイコン表示で、img 要素は生成されない
		expect(container.querySelector("img")).toBeNull();
	});
});

describe("MenuTab Meals セクションの表示", () => {
	it("見出し Meals 配下に料理名・価格・説明を表示する", () => {
		render(<MenuTab beerMenus={[]} foodMenus={[baseFoodMenu]} />);

		expect(screen.getByText("Meals")).toBeInTheDocument();
		expect(screen.getByText("フィッシュ&チップス")).toBeInTheDocument();
		expect(screen.getByText("¥980")).toBeInTheDocument();
		expect(screen.getByText("サクサクの衣")).toBeInTheDocument();
	});

	it("料理メニューが0件のとき空メッセージを表示する", () => {
		render(<MenuTab beerMenus={[]} foodMenus={[]} />);

		expect(
			screen.getByText("料理メニューはまだ登録されていません。"),
		).toBeInTheDocument();
	});
});
