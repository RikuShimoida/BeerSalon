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

		it("メールアドレス・パスワード欄にプレースホルダーが表示されない", () => {
			render(<SignUpForm />);

			const emailInput = screen.getByRole("textbox", {
				name: "メールアドレス",
			});
			const passwordInput = screen.getByLabelText("パスワード");

			expect(emailInput).not.toHaveAttribute("placeholder");
			expect(passwordInput).not.toHaveAttribute("placeholder");
		});

		it("送信ボタンが表示される", () => {
			render(<SignUpForm />);

			expect(screen.getByRole("button", { name: "登録" })).toBeInTheDocument();
		});

		it("パスワード強度のヒントが表示される", () => {
			render(<SignUpForm />);

			expect(
				screen.getByText("8文字以上、大文字・小文字・数字を含めてください"),
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
		it("「すでにアカウントをお持ちの方」リンクが/loginへ遷移する", () => {
			render(<SignUpForm />);

			const loginLink = screen.getByRole("link", {
				name: "すでにアカウントをお持ちの方",
			});
			expect(loginLink).toHaveAttribute("href", "/login");
		});
	});

	describe("正常系 - パスワード表示トグル", () => {
		it("トグル押下でtype='text'に切り替わり、再押下でpasswordに戻る", async () => {
			const user = userEvent.setup();
			render(<SignUpForm />);

			const passwordInput = screen.getByLabelText("パスワード");
			expect(passwordInput).toHaveAttribute("type", "password");

			await user.click(
				screen.getByRole("button", { name: "パスワードを表示" }),
			);
			expect(passwordInput).toHaveAttribute("type", "text");

			await user.click(
				screen.getByRole("button", { name: "パスワードを隠す" }),
			);
			expect(passwordInput).toHaveAttribute("type", "password");
		});
	});

	describe("正常系 - パスワード強度メーター", () => {
		it("入力に応じて塗り段数(data-strength)が増える", async () => {
			const user = userEvent.setup();
			render(<SignUpForm />);

			const meter = screen.getByTestId("password-strength");
			expect(meter).toHaveAttribute("data-strength", "0");

			const passwordInput = screen.getByLabelText("パスワード");
			// 8文字以上 + 小文字のみ = 2条件
			await user.type(passwordInput, "abcdefgh");
			expect(meter).toHaveAttribute("data-strength", "2");

			// 8文字以上 + 小文字 + 大文字 + 数字 = 4条件
			await user.clear(passwordInput);
			await user.type(passwordInput, "Password123");
			expect(meter).toHaveAttribute("data-strength", "4");
		});
	});

	describe("正常系 - OAuth登録ボタン(配置のみ)", () => {
		it("Google/Xで登録ボタンは表示されるが非活性である", () => {
			render(<SignUpForm />);

			const google = screen.getByRole("button", { name: /Googleで登録/ });
			const x = screen.getByRole("button", { name: /Xで登録/ });
			expect(google).toBeDisabled();
			expect(x).toBeDisabled();
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
