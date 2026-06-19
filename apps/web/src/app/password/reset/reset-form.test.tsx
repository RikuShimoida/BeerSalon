import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResetForm } from "./reset-form";

vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
	})),
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
	resetPasswordAction: vi.fn(),
}));

describe("ResetForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);
	});

	describe("正常系 - レンダリング", () => {
		it("新しいパスワード入力欄と確認用パスワード入力欄が表示される", () => {
			render(<ResetForm />);

			expect(screen.getByLabelText("新しいパスワード")).toBeInTheDocument();
			expect(
				screen.getByLabelText("新しいパスワード（確認用）"),
			).toBeInTheDocument();
		});

		it("送信ボタンが表示される", () => {
			render(<ResetForm />);

			expect(
				screen.getByRole("button", { name: "パスワードを変更する" }),
			).toBeInTheDocument();
		});

		it("パスワード強度のヒントが表示される", () => {
			render(<ResetForm />);

			expect(
				screen.getByText("8文字以上、大文字・小文字・数字を含めてください"),
			).toBeInTheDocument();
		});

		it("両入力欄がtype='password'である", () => {
			render(<ResetForm />);

			expect(screen.getByLabelText("新しいパスワード")).toHaveAttribute(
				"type",
				"password",
			);
			expect(
				screen.getByLabelText("新しいパスワード（確認用）"),
			).toHaveAttribute("type", "password");
		});

		it("両入力欄にplaceholder属性が設定されていない", () => {
			render(<ResetForm />);

			expect(screen.getByLabelText("新しいパスワード")).not.toHaveAttribute(
				"placeholder",
			);
			expect(
				screen.getByLabelText("新しいパスワード（確認用）"),
			).not.toHaveAttribute("placeholder");
		});
	});

	describe("正常系 - エラー表示", () => {
		it("バリデーションエラーが画面に表示される", () => {
			mockUseActionState.mockReturnValue([
				{ error: "パスワードが一致しません" },
				vi.fn(),
				false,
			]);

			render(<ResetForm />);

			expect(screen.getByText("パスワードが一致しません")).toBeInTheDocument();
		});
	});

	describe("正常系 - フォーム送信", () => {
		it("送信ボタン押下時にformActionが呼ばれる", async () => {
			const user = userEvent.setup();
			const mockFormAction = vi.fn();
			mockUseActionState.mockReturnValue([undefined, mockFormAction, false]);

			render(<ResetForm />);

			const passwordInput = screen.getByLabelText("新しいパスワード");
			const confirmInput = screen.getByLabelText("新しいパスワード（確認用）");
			const submitButton = screen.getByRole("button", {
				name: "パスワードを変更する",
			});

			await user.type(passwordInput, "NewPass1!");
			await user.type(confirmInput, "NewPass1!");
			await user.click(submitButton);

			expect(mockFormAction).toHaveBeenCalled();
		});
	});

	describe("正常系 - ローディング状態", () => {
		it("送信中はボタンがdisabledかつテキストが「更新中...」に変わる", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), true]);

			render(<ResetForm />);

			const submitButton = screen.getByRole("button", { name: "更新中..." });
			expect(submitButton).toBeDisabled();
		});
	});
});
