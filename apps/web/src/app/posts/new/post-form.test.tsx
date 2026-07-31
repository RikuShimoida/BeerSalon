import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PostForm } from "./post-form";

// next/navigationのモック
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({
		back: mockBack,
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
	})),
}));

// useActionStateとuseTransitionのモック
const mockUseActionState = vi.fn();
const mockUseTransition = vi.fn();
vi.mock("react", async () => {
	const actual = await vi.importActual("react");
	return {
		...actual,
		useActionState: (...args: unknown[]) => mockUseActionState(...args),
		useTransition: () => mockUseTransition(),
	};
});

// createPost actionのモック
vi.mock("./actions", () => ({
	createPost: vi.fn(),
}));

const mockBar = {
	id: BigInt(1),
	name: "テストバー1",
	prefecture: "東京都",
	city: "渋谷区",
};

describe("PostForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseActionState.mockReturnValue([undefined, vi.fn()]);
		mockUseTransition.mockReturnValue([false, vi.fn()]);
	});

	describe("正常系 - レンダリング", () => {
		it("正しくレンダリングされる", () => {
			render(<PostForm bar={mockBar} />);
			expect(screen.getByText("投稿する店舗")).toBeInTheDocument();
		});

		it("全ての入力フィールドが表示される", () => {
			render(<PostForm bar={mockBar} />);

			expect(screen.getByText("投稿する店舗")).toBeInTheDocument();
			expect(screen.getByLabelText(/投稿本文/)).toBeInTheDocument();
			expect(screen.getByText(/写真（最大4枚）/)).toBeInTheDocument();
		});

		it("送信ボタンと閉じるボタンが表示される", () => {
			render(<PostForm bar={mockBar} />);

			expect(
				screen.getByRole("button", { name: "投稿する" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "閉じる" }),
			).toBeInTheDocument();
		});
	});

	describe("正常系 - フィールド属性", () => {
		it("投稿本文フィールドがtextareaである", () => {
			render(<PostForm bar={mockBar} />);

			const bodyInput = screen.getByLabelText(/投稿本文/);
			expect(bodyInput.tagName).toBe("TEXTAREA");
		});

		it("投稿本文フィールドがrequiredである", () => {
			render(<PostForm bar={mockBar} />);

			expect(screen.getByLabelText(/投稿本文/)).toBeRequired();
		});

		it("写真アップロードフィールドが表示される", () => {
			render(<PostForm bar={mockBar} />);

			const imageInput = screen.getByLabelText("写真を追加");
			expect(imageInput).toHaveAttribute("type", "file");
			expect(imageInput).toHaveAttribute("accept", "image/*");
			expect(imageInput).toHaveAttribute("multiple");
		});
	});

	describe("正常系 - 店舗の固定表示", () => {
		it("店舗選択のプルダウン(select)が存在しない", () => {
			const { container } = render(<PostForm bar={mockBar} />);

			expect(container.querySelector("select")).not.toBeInTheDocument();
			expect(
				screen.queryByText("店舗を選択してください"),
			).not.toBeInTheDocument();
		});

		it("投稿対象の店舗名と所在地が表示される", () => {
			render(<PostForm bar={mockBar} />);

			expect(screen.getByText("テストバー1")).toBeInTheDocument();
			expect(screen.getByText("東京都 渋谷区")).toBeInTheDocument();
		});

		it("barIdがhidden inputとして正しい値で送信される", () => {
			const { container } = render(<PostForm bar={mockBar} />);

			const hiddenInput = container.querySelector(
				'input[type="hidden"][name="barId"]',
			) as HTMLInputElement;
			expect(hiddenInput).toBeInTheDocument();
			expect(hiddenInput.value).toBe("1");
		});
	});

	describe("正常系 - 閉じるボタン", () => {
		it("閉じるボタンをクリックするとrouter.back()が呼ばれる", async () => {
			const user = userEvent.setup();
			render(<PostForm bar={mockBar} />);

			const closeButton = screen.getByRole("button", { name: "閉じる" });
			await user.click(closeButton);

			expect(mockBack).toHaveBeenCalled();
		});
	});

	describe("正常系 - エラー表示", () => {
		it("エラーメッセージが表示される", () => {
			const errorMessage = "投稿の作成に失敗しました";
			mockUseActionState.mockReturnValue([{ error: errorMessage }, vi.fn()]);

			render(<PostForm bar={mockBar} />);

			expect(screen.getByText(errorMessage)).toBeInTheDocument();
		});

		it("エラーがない場合はエラーメッセージが表示されない", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn()]);

			render(<PostForm bar={mockBar} />);

			expect(screen.queryByText(/失敗しました/)).not.toBeInTheDocument();
		});
	});

	describe("正常系 - ローディング状態", () => {
		it("送信中はボタンがdisabledになる", () => {
			mockUseTransition.mockReturnValue([true, vi.fn()]);

			render(<PostForm bar={mockBar} />);

			const submitButton = screen.getByRole("button", { name: "投稿中..." });
			expect(submitButton).toBeDisabled();
		});

		it("送信中はボタンのテキストが変わる", () => {
			mockUseTransition.mockReturnValue([true, vi.fn()]);

			render(<PostForm bar={mockBar} />);

			expect(
				screen.getByRole("button", { name: "投稿中..." }),
			).toBeInTheDocument();
			expect(
				screen.queryByRole("button", { name: "投稿する" }),
			).not.toBeInTheDocument();
		});

		it("送信中でない場合はボタンが有効である", () => {
			mockUseTransition.mockReturnValue([false, vi.fn()]);

			render(<PostForm bar={mockBar} />);

			const submitButton = screen.getByRole("button", { name: "投稿する" });
			expect(submitButton).not.toBeDisabled();
		});
	});
});
