import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignUpForm } from "./signup-form";

// next/navigationのモック
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
	})),
}));

// useActionStateのモック
const mockUseActionState = vi.fn();
vi.mock("react", async () => {
	const actual = await vi.importActual("react");
	return {
		...actual,
		useActionState: (...args: unknown[]) => mockUseActionState(...args),
	};
});

// signUp actionのモック
vi.mock("./actions", () => ({
	signUp: vi.fn(),
}));

describe("SignUpForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);
	});

	describe("正常系 - レンダリング", () => {
		it("正しくレンダリングされる", () => {
			render(<SignUpForm />);
			expect(
				screen.getByRole("textbox", { name: "メールアドレス" }),
			).toBeInTheDocument();
		});

		it("全ての入力フィールドが表示される", () => {
			render(<SignUpForm />);

			expect(
				screen.getByRole("textbox", { name: "メールアドレス" }),
			).toBeInTheDocument();
			expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
		});

		it("ラベルが正しく関連付けられている", () => {
			render(<SignUpForm />);

			const emailInput = screen.getByRole("textbox", {
				name: "メールアドレス",
			});
			const passwordInput = screen.getByLabelText("パスワード");

			expect(emailInput).toHaveAttribute("id", "email");
			expect(passwordInput).toHaveAttribute("id", "password");
		});

		it("プレースホルダーが正しく表示される", () => {
			render(<SignUpForm />);

			expect(
				screen.getByPlaceholderText("example@mail.com"),
			).toBeInTheDocument();
			expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
		});

		it("送信ボタンが表示される", () => {
			render(<SignUpForm />);

			expect(screen.getByRole("button", { name: "登録" })).toBeInTheDocument();
		});

		it("パスワード強度のヒントが表示される", () => {
			render(<SignUpForm />);

			expect(
				screen.getByText(
					"8文字以上、大文字・小文字・数字・記号を含めてください",
				),
			).toBeInTheDocument();
		});
	});

	describe("正常系 - フィールド属性", () => {
		it("メールアドレスフィールドがtype='email'である", () => {
			render(<SignUpForm />);

			const emailInput = screen.getByRole("textbox", {
				name: "メールアドレス",
			});
			expect(emailInput).toHaveAttribute("type", "email");
		});

		it("パスワードフィールドがtype='password'である", () => {
			render(<SignUpForm />);

			const passwordInput = screen.getByLabelText("パスワード");
			expect(passwordInput).toHaveAttribute("type", "password");
		});

		it("両フィールドがrequiredである", () => {
			render(<SignUpForm />);

			const emailInput = screen.getByRole("textbox", {
				name: "メールアドレス",
			});
			const passwordInput = screen.getByLabelText("パスワード");

			expect(emailInput).toBeRequired();
			expect(passwordInput).toBeRequired();
		});
	});

	describe("正常系 - リンク", () => {
		it("「ログインはこちら」リンクが/loginへ遷移する", () => {
			render(<SignUpForm />);

			const loginLink = screen.getByRole("link", {
				name: "ログインはこちら",
			});
			expect(loginLink).toHaveAttribute("href", "/login");
		});
	});

	describe("正常系 - フォーム送信", () => {
		it("フォームsubmit時にactionが呼ばれる", async () => {
			const user = userEvent.setup();
			const mockFormAction = vi.fn();
			mockUseActionState.mockReturnValue([undefined, mockFormAction, false]);

			render(<SignUpForm />);

			const emailInput = screen.getByRole("textbox", {
				name: "メールアドレス",
			});
			const passwordInput = screen.getByLabelText("パスワード");
			const submitButton = screen.getByRole("button", { name: "登録" });

			await user.type(emailInput, "test@example.com");
			await user.type(passwordInput, "Password123!");
			await user.click(submitButton);

			expect(mockFormAction).toHaveBeenCalled();
		});
	});

	describe("正常系 - エラー表示", () => {
		it("エラーメッセージが表示される", () => {
			const errorMessage = "このメールアドレスは既に使用されています";
			mockUseActionState.mockReturnValue([
				{ error: errorMessage },
				vi.fn(),
				false,
			]);

			render(<SignUpForm />);

			expect(screen.getByText(errorMessage)).toBeInTheDocument();
		});

		it("エラーがない場合はエラーメッセージが表示されない", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);

			render(<SignUpForm />);

			expect(screen.queryByText(/このメールアドレス/)).not.toBeInTheDocument();
		});
	});

	describe("正常系 - ローディング状態", () => {
		it("送信中はボタンがdisabledになる", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), true]);

			render(<SignUpForm />);

			const submitButton = screen.getByRole("button", {
				name: "登録中...",
			});
			expect(submitButton).toBeDisabled();
		});

		it("送信中はボタンのテキストが変わる", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), true]);

			render(<SignUpForm />);

			expect(
				screen.getByRole("button", { name: "登録中..." }),
			).toBeInTheDocument();
			expect(
				screen.queryByRole("button", { name: "登録" }),
			).not.toBeInTheDocument();
		});

		it("送信中でない場合はボタンが有効である", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);

			render(<SignUpForm />);

			const submitButton = screen.getByRole("button", { name: "登録" });
			expect(submitButton).not.toBeDisabled();
		});
	});
});
