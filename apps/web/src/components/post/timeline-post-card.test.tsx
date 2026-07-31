import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TimelinePostCard } from "./timeline-post-card";

vi.mock("@/actions/post", () => ({
	togglePostLike: vi.fn(),
}));

const basePost = {
	id: BigInt(1),
	body: "美味しいIPAでした",
	createdAt: new Date(),
	likeCount: 2,
	isLikedByCurrentUser: false,
	user: {
		id: "user-1",
		nickname: "たろう",
		profileImageUrl: null,
	},
	images: [],
	bar: {
		id: BigInt(10),
		name: "テストビアバー",
		prefecture: "静岡県",
		city: "静岡市",
	},
};

describe("TimelinePostCard", () => {
	describe("正常系 - 基本表示", () => {
		it("ニックネーム・本文・店舗名を表示する", () => {
			render(<TimelinePostCard post={basePost} />);

			expect(screen.getByText("たろう")).toBeInTheDocument();
			expect(screen.getByText("美味しいIPAでした")).toBeInTheDocument();
			expect(screen.getByText("テストビアバー")).toBeInTheDocument();
		});

		it("投稿者リンクとお店リンクが正しい遷移先を持つ", () => {
			render(<TimelinePostCard post={basePost} />);

			expect(
				screen.getByRole("link", { name: "たろうのプロフィール" }),
			).toHaveAttribute("href", "/users/user-1");
			expect(
				screen.getByRole("link", { name: /テストビアバー/ }),
			).toHaveAttribute("href", "/bars/10");
		});
	});

	describe("正常系 - アバター", () => {
		it("プロフィール画像が無い場合はニックネーム頭文字を表示する", () => {
			render(<TimelinePostCard post={basePost} />);

			expect(screen.getByText("た")).toBeInTheDocument();
		});

		it("プロフィール画像がある場合は画像を表示する", () => {
			// Why not getByRole("img"): 装飾画像は alt="" のため jsdom で role="img" を持たない。
			// DOM 上の <img> を直接数えて描画有無を判定する。
			const { container } = render(
				<TimelinePostCard
					post={{
						...basePost,
						user: {
							...basePost.user,
							profileImageUrl: "https://example.com/avatar.jpg",
						},
					}}
				/>,
			);

			expect(container.querySelectorAll("img")).toHaveLength(1);
			expect(screen.queryByText("た")).not.toBeInTheDocument();
		});
	});

	describe("正常系 - 写真グリッド", () => {
		it("画像が無い場合は画像を描画しない", () => {
			const { container } = render(<TimelinePostCard post={basePost} />);

			expect(container.querySelectorAll("img")).toHaveLength(0);
		});

		it("画像が4枚を超えても先頭4枚のみ描画する", () => {
			const images = Array.from({ length: 6 }, (_, i) => ({
				id: BigInt(i + 1),
				url: `https://example.com/${i + 1}.jpg`,
			}));

			const { container } = render(
				<TimelinePostCard post={{ ...basePost, images }} />,
			);

			expect(container.querySelectorAll("img")).toHaveLength(4);
		});
	});
});
