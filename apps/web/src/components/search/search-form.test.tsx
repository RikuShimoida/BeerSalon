import { render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchForm } from "./search-form";

const mockGetBeerRegions = vi.fn();
vi.mock("@/actions/bar", () => ({
	getBeerRegions: () => mockGetBeerRegions(),
}));

// 実データ非依存の決め打ち。国×地域ペアが複数あることで「常時全展開だと縦に伸びる」構造を再現する
const SAMPLE_REGIONS = {
	日本: ["静岡", "神奈川"],
	アメリカ: ["カリフォルニア", "オレゴン"],
};

describe("SearchForm - Origin 折りたたみ", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetBeerRegions.mockResolvedValue(SAMPLE_REGIONS);
	});

	const renderAndWaitRegions = async (
		props?: Parameters<typeof SearchForm>[0],
	) => {
		const result = render(<SearchForm {...props} />);
		// getBeerRegions の解決を待つ（トグルを開いたときにチップが出せる状態にする）
		await waitFor(() => expect(mockGetBeerRegions).toHaveBeenCalled());
		return result;
	};

	describe("初期表示（折りたたみ）", () => {
		it("国見出し・地域チップが非表示で、トグルは閉じている", async () => {
			await renderAndWaitRegions();

			const toggle = screen.getByRole("button", { name: /産地で絞り込む/ });
			expect(toggle).toHaveAttribute("aria-expanded", "false");

			// 国見出しと地域チップは展開するまで描画されない
			expect(screen.queryByText("日本")).not.toBeInTheDocument();
			expect(
				screen.queryByRole("button", { name: "静岡" }),
			).not.toBeInTheDocument();
		});
	});

	describe("展開", () => {
		it("トグルクリックで aria-expanded が true になり国別グルーピングが現れる", async () => {
			const user = userEvent.setup();
			await renderAndWaitRegions();

			await user.click(screen.getByRole("button", { name: /産地で絞り込む/ }));

			const toggle = screen.getByRole("button", { name: /産地で絞り込む/ });
			expect(toggle).toHaveAttribute("aria-expanded", "true");

			// 国名見出しごとにグルーピング（wireframe.md §2-1）
			expect(screen.getByText("日本")).toBeInTheDocument();
			expect(screen.getByText("アメリカ")).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "静岡" })).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "カリフォルニア" }),
			).toBeInTheDocument();
		});

		it("展開中に地域チップを押すと onSearch が国/地域の値付きで呼ばれる", async () => {
			const user = userEvent.setup();
			const onSearch = vi.fn();
			await renderAndWaitRegions({ onSearch });

			await user.click(screen.getByRole("button", { name: /産地で絞り込む/ }));
			await user.click(screen.getByRole("button", { name: "静岡" }));

			expect(onSearch).toHaveBeenCalledWith(
				expect.objectContaining({ origins: ["日本/静岡"] }),
			);
		});
	});

	describe("折りたたみ時のサマリ", () => {
		it("initialValues.origins があると折りたたみ状態でも選択中の地域名がサマリ表示される", async () => {
			await renderAndWaitRegions({
				initialValues: { origins: ["日本/静岡"] },
			});

			const toggle = screen.getByRole("button", { name: /産地で絞り込む/ });
			expect(toggle).toHaveAttribute("aria-expanded", "false");

			// 展開せずとも「静岡」で絞っていることが見える
			expect(screen.getByRole("button", { name: "静岡" })).toBeInTheDocument();
		});

		it("サマリチップをタップすると当該産地が解除され onSearch が空配列で呼ばれる", async () => {
			const user = userEvent.setup();
			const onSearch = vi.fn();
			await renderAndWaitRegions({
				initialValues: { origins: ["日本/静岡"] },
				onSearch,
			});

			await user.click(screen.getByRole("button", { name: "静岡" }));

			expect(onSearch).toHaveBeenCalledWith(
				expect.objectContaining({ origins: [] }),
			);
		});
	});

	describe("非デグレ - 他フィールド", () => {
		it("カテゴリチップは Origin 折りたたみと独立して常時表示される", async () => {
			await renderAndWaitRegions();

			const ipa = screen.getByRole("button", { name: "IPA" });
			expect(ipa).toBeInTheDocument();
			// Category セクションのチップは折りたたみ対象外
			const categorySection = ipa.closest("div");
			expect(categorySection).not.toBeNull();
			within(categorySection as HTMLElement).getByRole("button", {
				name: "ピルスナー",
			});
		});
	});
});
