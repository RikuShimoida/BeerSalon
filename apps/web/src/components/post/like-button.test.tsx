import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LikeButton } from "./like-button";

const mockTogglePostLike = vi.fn();
vi.mock("@/actions/post", () => ({
	togglePostLike: (...args: unknown[]) => mockTogglePostLike(...args),
}));

describe("LikeButton", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockTogglePostLike.mockResolvedValue(undefined);
	});

	// Why not className に text-[#e0483a] を含むかで判定: 未いいね時も hover:text-[#e0483a] を
	// 持つため部分一致では誤検出する。塗りの本質は SVG の fill 属性（none / currentColor）と
	// aria-pressed で判定する。
	const getHeartFill = (container: HTMLElement) =>
		container.querySelector("svg")?.getAttribute("fill");

	describe("正常系 - 初期表示", () => {
		it("未いいね時は塗られず（fill=none）、カウントを表示する", () => {
			const { container } = render(
				<LikeButton
					postId={BigInt(1)}
					initialLikeCount={3}
					initialIsLiked={false}
				/>,
			);

			const button = screen.getByRole("button", { name: "いいね" });
			expect(button).toHaveAttribute("aria-pressed", "false");
			expect(getHeartFill(container)).toBe("none");
			expect(screen.getByText("3")).toBeInTheDocument();
		});

		it("いいね済み時は赤で塗られる（fill=currentColor + 赤文字色）", () => {
			const { container } = render(
				<LikeButton
					postId={BigInt(1)}
					initialLikeCount={5}
					initialIsLiked={true}
				/>,
			);

			const button = screen.getByRole("button", {
				name: "いいねを取り消す",
			});
			expect(button).toHaveAttribute("aria-pressed", "true");
			expect(getHeartFill(container)).toBe("currentColor");
			expect(button.className).toContain("text-[#e0483a]");
		});
	});

	describe("正常系 - トグル（楽観更新）", () => {
		it("未いいねから押すと赤塗りになりカウントが+1される", async () => {
			const user = userEvent.setup();
			const { container } = render(
				<LikeButton
					postId={BigInt(1)}
					initialLikeCount={3}
					initialIsLiked={false}
				/>,
			);

			await user.click(screen.getByRole("button", { name: "いいね" }));

			const button = screen.getByRole("button", {
				name: "いいねを取り消す",
			});
			expect(button).toHaveAttribute("aria-pressed", "true");
			expect(getHeartFill(container)).toBe("currentColor");
			expect(button.className).toContain("text-[#e0483a]");
			expect(screen.getByText("4")).toBeInTheDocument();
			expect(mockTogglePostLike).toHaveBeenCalledWith(BigInt(1));
		});

		it("いいね済みから押すと赤塗りが外れカウントが-1される", async () => {
			const user = userEvent.setup();
			const { container } = render(
				<LikeButton
					postId={BigInt(2)}
					initialLikeCount={5}
					initialIsLiked={true}
				/>,
			);

			await user.click(
				screen.getByRole("button", { name: "いいねを取り消す" }),
			);

			const button = screen.getByRole("button", { name: "いいね" });
			expect(button).toHaveAttribute("aria-pressed", "false");
			expect(getHeartFill(container)).toBe("none");
			expect(screen.getByText("4")).toBeInTheDocument();
		});
	});

	describe("異常系 - サーバーエラー時のロールバック", () => {
		it("トグルが失敗したら元の状態に戻す", async () => {
			const consoleError = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			mockTogglePostLike.mockRejectedValue(new Error("failed"));
			const user = userEvent.setup();

			render(
				<LikeButton
					postId={BigInt(3)}
					initialLikeCount={3}
					initialIsLiked={false}
				/>,
			);

			await user.click(screen.getByRole("button", { name: "いいね" }));

			const button = await screen.findByRole("button", { name: "いいね" });
			expect(button).toHaveAttribute("aria-pressed", "false");
			expect(screen.getByText("3")).toBeInTheDocument();

			consoleError.mockRestore();
		});
	});
});
