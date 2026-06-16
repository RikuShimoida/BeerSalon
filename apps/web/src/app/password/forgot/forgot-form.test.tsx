import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ForgotForm } from "./forgot-form";

vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
	})),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
	toast: {
		success: (...args: unknown[]) => mockToastSuccess(...args),
		error: (...args: unknown[]) => mockToastError(...args),
	},
}));

const mockUseActionState = vi.fn();
vi.mock("react", async () => {
	const actual = await vi.importActual("react");
	return {
		...actual,
		useActionState: (...args: unknown[]) => mockUseActionState(...args),
	};
});

vi.mock("./actions", () => ({
	forgotPasswordAction: vi.fn(),
}));

describe("ForgotForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);
	});

	describe("正常系 - レンダリング", () => {
		it("メールアドレス入力欄と送信ボタンが表示される", () => {
			render(<ForgotForm />);

			expect(
				screen.getByRole("textbox", { name: "メールアドレス" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "再設定メールを送信" }),
			).toBeInTheDocument();
		});

		it("ログインに戻るリンクが/loginへ遷移する", () => {
			render(<ForgotForm />);

			const link = screen.getByRole("link", { name: "ログインに戻る" });
			expect(link).toHaveAttribute("href", "/login");
		});
	});

	describe("正常系 - フォーム送信", () => {
		it("送信ボタン押下時にformActionが呼ばれる", async () => {
			const user = userEvent.setup();
			const mockFormAction = vi.fn();
			mockUseActionState.mockReturnValue([undefined, mockFormAction, false]);

			render(<ForgotForm />);

			const emailInput = screen.getByRole("textbox", {
				name: "メールアドレス",
			});
			const submitButton = screen.getByRole("button", {
				name: "再設定メールを送信",
			});

			await user.type(emailInput, "test@example.com");
			await user.click(submitButton);

			expect(mockFormAction).toHaveBeenCalled();
		});
	});

	describe("正常系 - 成功トースト", () => {
		it("success: trueのstateが返されたときにtoast.successが呼ばれる", () => {
			mockUseActionState.mockReturnValue([
				{
					success: true,
					message: "該当アドレスが登録されていればメールを送信しました",
				},
				vi.fn(),
				false,
			]);

			render(<ForgotForm />);

			expect(mockToastSuccess).toHaveBeenCalledWith(
				"該当アドレスが登録されていればメールを送信しました",
			);
		});
	});

	describe("正常系 - エラー表示", () => {
		it("success: falseのstateが返されたときにエラーメッセージが画面に表示される", () => {
			mockUseActionState.mockReturnValue([
				{ success: false, error: "メールアドレスを入力してください" },
				vi.fn(),
				false,
			]);

			render(<ForgotForm />);

			expect(
				screen.getByText("メールアドレスを入力してください"),
			).toBeInTheDocument();
		});
	});

	describe("正常系 - initialError", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("initialError='invalid_token' のとき遅延後にtoast.errorが呼ばれる", () => {
			render(<ForgotForm initialError="invalid_token" />);

			// Why not 即時呼び出し: setTimeout(..., 100) でラップされているため、タイマー進行が必要。
			expect(mockToastError).not.toHaveBeenCalled();
			act(() => {
				vi.advanceTimersByTime(150);
			});

			expect(mockToastError).toHaveBeenCalledWith(
				expect.stringContaining("無効"),
			);
		});

		it("initialError='session_expired' のとき遅延後にtoast.errorが呼ばれる", () => {
			render(<ForgotForm initialError="session_expired" />);

			expect(mockToastError).not.toHaveBeenCalled();
			act(() => {
				vi.advanceTimersByTime(150);
			});

			expect(mockToastError).toHaveBeenCalledWith(
				expect.stringContaining("有効期限"),
			);
		});
	});

	describe("正常系 - ローディング状態", () => {
		it("送信中はボタンがdisabledになる", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), true]);

			render(<ForgotForm />);

			const submitButton = screen.getByRole("button", {
				name: "送信中...",
			});
			expect(submitButton).toBeDisabled();
		});
	});
});
