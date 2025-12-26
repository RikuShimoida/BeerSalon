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

const mockBars = [
	{
		id: BigInt(1),
		name: "テストバー1",
		prefecture: "東京都",
		city: "渋谷区",
	},
	{
		id: BigInt(2),
		name: "テストバー2",
		prefecture: "神奈川県",
		city: "横浜市",
	},
];

describe("PostForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseActionState.mockReturnValue([undefined, vi.fn()]);
		mockUseTransition.mockReturnValue([false, vi.fn()]);
	});

	describe("正常系 - レンダリング", () => {
		it("正しくレンダリングされる", () => {
			render(<PostForm bars={mockBars} />);
			expect(screen.getByLabelText(/店舗選択/)).toBeInTheDocument();
		});

		it("全ての入力フィールドが表示される", () => {
			render(<PostForm bars={mockBars} />);

			expect(screen.getByLabelText(/店舗選択/)).toBeInTheDocument();
			expect(screen.getByLabelText(/投稿本文/)).toBeInTheDocument();
			expect(screen.getByText(/写真を追加（最大4枚）/)).toBeInTheDocument();
		});

		it("送信ボタンとキャンセルボタンが表示される", () => {
			render(<PostForm bars={mockBars} />);

			expect(
				screen.getByRole("button", { name: "投稿する" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "キャンセル" }),
			).toBeInTheDocument();
		});
	});

	describe("正常系 - フィールド属性", () => {
		it("投稿本文フィールドがtextareaである", () => {
			render(<PostForm bars={mockBars} />);

			const bodyInput = screen.getByLabelText(/投稿本文/);
			expect(bodyInput.tagName).toBe("TEXTAREA");
		});

		it("必須フィールドがrequiredである", () => {
			render(<PostForm bars={mockBars} />);

			expect(screen.getByLabelText(/店舗選択/)).toBeRequired();
			expect(screen.getByLabelText(/投稿本文/)).toBeRequired();
		});

		it("写真アップロードフィールドが表示される", () => {
			render(<PostForm bars={mockBars} />);

			const imageInput = screen.getByLabelText("+ 写真を追加");
			expect(imageInput).toHaveAttribute("type", "file");
			expect(imageInput).toHaveAttribute("accept", "image/*");
			expect(imageInput).toHaveAttribute("multiple");
		});
	});

	describe("正常系 - selectフィールド", () => {
		it("店舗selectが正しいオプションを持つ", () => {
			render(<PostForm bars={mockBars} />);

			const barSelect = screen.getByLabelText(/店舗選択/);
			expect(barSelect).toBeInTheDocument();

			expect(screen.getByText("店舗を選択してください")).toBeInTheDocument();
			expect(
				screen.getByText("テストバー1 (東京都 渋谷区)"),
			).toBeInTheDocument();
			expect(
				screen.getByText("テストバー2 (神奈川県 横浜市)"),
			).toBeInTheDocument();
		});

		it("selectedBarIdが指定された場合、デフォルト値が設定される", () => {
			render(<PostForm bars={mockBars} selectedBarId="1" />);

			const barSelect = screen.getByLabelText(/店舗選択/) as HTMLSelectElement;
			expect(barSelect.value).toBe("1");
		});
	});

	describe("正常系 - キャンセルボタン", () => {
		it("キャンセルボタンをクリックするとrouter.back()が呼ばれる", async () => {
			const user = userEvent.setup();
			render(<PostForm bars={mockBars} />);

			const cancelButton = screen.getByRole("button", { name: "キャンセル" });
			await user.click(cancelButton);

			expect(mockBack).toHaveBeenCalled();
		});
	});

	describe("正常系 - エラー表示", () => {
		it("エラーメッセージが表示される", () => {
			const errorMessage = "投稿の作成に失敗しました";
			mockUseActionState.mockReturnValue([{ error: errorMessage }, vi.fn()]);

			render(<PostForm bars={mockBars} />);

			expect(screen.getByText(errorMessage)).toBeInTheDocument();
		});

		it("エラーがない場合はエラーメッセージが表示されない", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn()]);

			render(<PostForm bars={mockBars} />);

			expect(screen.queryByText(/失敗しました/)).not.toBeInTheDocument();
		});
	});

	describe("正常系 - ローディング状態", () => {
		it("送信中はボタンがdisabledになる", () => {
			mockUseTransition.mockReturnValue([true, vi.fn()]);

			render(<PostForm bars={mockBars} />);

			const submitButton = screen.getByRole("button", { name: "投稿中..." });
			expect(submitButton).toBeDisabled();
		});

		it("送信中はボタンのテキストが変わる", () => {
			mockUseTransition.mockReturnValue([true, vi.fn()]);

			render(<PostForm bars={mockBars} />);

			expect(
				screen.getByRole("button", { name: "投稿中..." }),
			).toBeInTheDocument();
			expect(
				screen.queryByRole("button", { name: "投稿する" }),
			).not.toBeInTheDocument();
		});

		it("送信中でない場合はボタンが有効である", () => {
			mockUseTransition.mockReturnValue([false, vi.fn()]);

			render(<PostForm bars={mockBars} />);

			const submitButton = screen.getByRole("button", { name: "投稿する" });
			expect(submitButton).not.toBeDisabled();
		});
	});
});
