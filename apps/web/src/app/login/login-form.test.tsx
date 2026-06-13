import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

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

// login actionのモック
vi.mock("./actions", () => ({
	login: vi.fn(),
}));

describe("LoginForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// デフォルトのuseActionStateの戻り値
		mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);
	});

	describe("正常系 - レンダリング", () => {
		it("正しくレンダリングされる", () => {
			render(<LoginForm />);
			expect(
				screen.getByRole("textbox", { name: "メールアドレス" }),
			).toBeInTheDocument();
		});

		it("全ての入力フィールドが表示される", () => {
			render(<LoginForm />);

			expect(
				screen.getByRole("textbox", { name: "メールアドレス" }),
			).toBeInTheDocument();
			expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
		});

		it("ラベルが正しく関連付けられている", () => {
			render(<LoginForm />);

			const emailInput = screen.getByRole("textbox", {
				name: "メールアドレス",
			});
			const passwordInput = screen.getByLabelText("パスワード");

			expect(emailInput).toHaveAttribute("id", "email");
			expect(passwordInput).toHaveAttribute("id", "password");
		});

		it("プレースホルダーが正しく表示される", () => {
			render(<LoginForm />);

			expect(
				screen.getByPlaceholderText("example@mail.com"),
			).toBeInTheDocument();
			expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
		});

		it("送信ボタンが表示される", () => {
			render(<LoginForm />);

			expect(
				screen.getByRole("button", { name: "ログイン" }),
			).toBeInTheDocument();
		});
	});

	describe("正常系 - フィールド属性", () => {
		it("メールアドレスフィールドがtype='email'である", () => {
			render(<LoginForm />);

			const emailInput = screen.getByRole("textbox", {
				name: "メールアドレス",
			});
			expect(emailInput).toHaveAttribute("type", "email");
		});

		it("パスワードフィールドがtype='password'である", () => {
			render(<LoginForm />);

			const passwordInput = screen.getByLabelText("パスワード");
			expect(passwordInput).toHaveAttribute("type", "password");
		});

		it("両フィールドがrequiredである", () => {
			render(<LoginForm />);

			const emailInput = screen.getByRole("textbox", {
				name: "メールアドレス",
			});
			const passwordInput = screen.getByLabelText("パスワード");

			expect(emailInput).toBeRequired();
			expect(passwordInput).toBeRequired();
		});
	});

	describe("正常系 - リンク", () => {
		it("「新規登録はこちら」リンクが/signupへ遷移する", () => {
			render(<LoginForm />);

			const signupLink = screen.getByRole("link", {
				name: "新規登録はこちら",
			});
			expect(signupLink).toHaveAttribute("href", "/signup");
		});

		it("「パスワードをお忘れの方」リンクが/password/resetへ遷移する", () => {
			render(<LoginForm />);

			const resetLink = screen.getByRole("link", {
				name: "パスワードをお忘れの方",
			});
			expect(resetLink).toHaveAttribute("href", "/password/reset");
		});
	});

	describe("正常系 - フォーム送信", () => {
		it("フォームsubmit時にactionが呼ばれる", async () => {
			const user = userEvent.setup();
			const mockFormAction = vi.fn();
			mockUseActionState.mockReturnValue([undefined, mockFormAction, false]);

			render(<LoginForm />);

			const emailInput = screen.getByRole("textbox", {
				name: "メールアドレス",
			});
			const passwordInput = screen.getByLabelText("パスワード");
			const submitButton = screen.getByRole("button", {
				name: "ログイン",
			});

			await user.type(emailInput, "test@example.com");
			await user.type(passwordInput, "password123");
			await user.click(submitButton);

			expect(mockFormAction).toHaveBeenCalled();
		});
	});

	describe("正常系 - エラー表示", () => {
		it("エラーメッセージが表示される", () => {
			const errorMessage = "メールアドレスまたはパスワードが違います";
			mockUseActionState.mockReturnValue([
				{ error: errorMessage },
				vi.fn(),
				false,
			]);

			render(<LoginForm />);

			expect(screen.getByText(errorMessage)).toBeInTheDocument();
		});

		it("エラーがない場合はエラーメッセージが表示されない", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);

			render(<LoginForm />);

			expect(
				screen.queryByText(/メールアドレスまたはパスワード/),
			).not.toBeInTheDocument();
		});
	});

	describe("正常系 - ローディング状態", () => {
		it("送信中はボタンがdisabledになる", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), true]);

			render(<LoginForm />);

			const submitButton = screen.getByRole("button", {
				name: "ログイン中...",
			});
			expect(submitButton).toBeDisabled();
		});

		it("送信中はボタンのテキストが変わる", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), true]);

			render(<LoginForm />);

			expect(
				screen.getByRole("button", { name: "ログイン中..." }),
			).toBeInTheDocument();
			expect(
				screen.queryByRole("button", { name: "ログイン" }),
			).not.toBeInTheDocument();
		});

		it("送信中でない場合はボタンが有効である", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);

			render(<LoginForm />);

			const submitButton = screen.getByRole("button", {
				name: "ログイン",
			});
			expect(submitButton).not.toBeDisabled();
		});
	});
});
