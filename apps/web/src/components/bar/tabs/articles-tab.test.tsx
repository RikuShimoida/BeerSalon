import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArticlesTab } from "./articles-tab";

vi.mock("next/image", () => ({
	default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
		// biome-ignore lint/performance/noImgElement: テスト用next/imageモック
		<img {...props} alt={props.alt} />
	),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

const baseArticle = {
	id: "1",
	title: "夏の限定IPAが登場しました",
	body: "今年も季節限定のIPAをご用意しました。ぜひお越しください。",
	imageUrl: "/images/article1.jpg",
	publishedAt: new Date("2026-06-15T10:00:00+09:00"),
};

describe("ArticlesTab", () => {
	describe("記事が0件の場合", () => {
		it("空状態メッセージが表示される", () => {
			render(<ArticlesTab articles={[]} />);
			expect(
				screen.getByText("記事はまだ投稿されていません。"),
			).toBeInTheDocument();
		});
	});

	describe("記事が存在する場合", () => {
		it("記事タイトルが表示される", () => {
			render(<ArticlesTab articles={[baseArticle]} />);
			expect(screen.getByText("夏の限定IPAが登場しました")).toBeInTheDocument();
		});

		it("記事本文の冒頭が表示される", () => {
			render(<ArticlesTab articles={[baseArticle]} />);
			expect(
				screen.getByText(
					"今年も季節限定のIPAをご用意しました。ぜひお越しください。",
				),
			).toBeInTheDocument();
		});

		// Why not 期待値に toLocaleDateString を再利用しないか: 実装と期待値の両辺が
		// 同時に変わる自己参照アサーションになり、TZ 指定漏れのようなバグを検出できないため。
		it("投稿日が JST の日付で表示される", () => {
			render(<ArticlesTab articles={[baseArticle]} />);
			expect(screen.getByText("2026/6/15")).toBeInTheDocument();
		});

		it("記事リンクが /articles/[articleId] を指す", () => {
			render(<ArticlesTab articles={[baseArticle]} />);
			const link = screen.getByRole("link", {
				name: /夏の限定IPAが登場しました/,
			});
			expect(link).toHaveAttribute("href", "/articles/1");
		});

		it("画像が表示される", () => {
			render(<ArticlesTab articles={[baseArticle]} />);
			expect(
				screen.getByAltText("夏の限定IPAが登場しました"),
			).toBeInTheDocument();
		});

		it("imageUrlがnullの場合は画像が表示されない", () => {
			const article = { ...baseArticle, imageUrl: null };
			render(<ArticlesTab articles={[article]} />);
			expect(
				screen.queryByAltText("夏の限定IPAが登場しました"),
			).not.toBeInTheDocument();
		});

		it("publishedAtがnullの場合は投稿日が表示されない", () => {
			const article = { ...baseArticle, publishedAt: null };
			render(<ArticlesTab articles={[article]} />);
			expect(screen.queryByText("2026/6/15")).not.toBeInTheDocument();
		});

		it("複数記事が表示される", () => {
			const articles = [
				baseArticle,
				{
					...baseArticle,
					id: "2",
					title: "新メニュー入荷のお知らせ",
				},
			];
			render(<ArticlesTab articles={articles} />);
			expect(screen.getByText("夏の限定IPAが登場しました")).toBeInTheDocument();
			expect(screen.getByText("新メニュー入荷のお知らせ")).toBeInTheDocument();
		});
	});
});
