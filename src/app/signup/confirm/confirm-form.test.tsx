import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmForm } from "./confirm-form";

// useActionStateのモック
const mockUseActionState = vi.fn();
vi.mock("react", async () => {
	const actual = await vi.importActual("react");
	return {
		...actual,
		useActionState: (...args: unknown[]) => mockUseActionState(...args),
	};
});

// confirmAndSaveProfile actionのモック
vi.mock("./actions", () => ({
	confirmAndSaveProfile: vi.fn(),
}));

const mockProfileData = {
	lastName: "下井田",
	firstName: "陸",
	nickname: "りく",
	birthday: "1994-05-13",
	gender: "male",
	prefecture: "静岡県",
};

const mockBackUrl = "/signup/profile";

describe("ConfirmForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);
	});

	describe("正常系 - レンダリング", () => {
		it("正しくレンダリングされる", () => {
			render(
				<ConfirmForm profileData={mockProfileData} backUrl={mockBackUrl} />,
			);
			expect(
				screen.getByRole("button", { name: "この内容で登録する" }),
			).toBeInTheDocument();
		});

		it("登録ボタンと修正リンクが表示される", () => {
			render(
				<ConfirmForm profileData={mockProfileData} backUrl={mockBackUrl} />,
			);

			expect(
				screen.getByRole("button", { name: "この内容で登録する" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("link", { name: "修正する" }),
			).toBeInTheDocument();
		});
	});

	describe("正常系 - hidden input", () => {
		it("profileDataがJSONとしてhidden inputに設定される", () => {
			render(
				<ConfirmForm profileData={mockProfileData} backUrl={mockBackUrl} />,
			);

			const hiddenInput = document.querySelector(
				'input[name="profileData"]',
			) as HTMLInputElement;
			expect(hiddenInput).toBeInTheDocument();
			expect(hiddenInput.type).toBe("hidden");
			expect(JSON.parse(hiddenInput.value)).toEqual(mockProfileData);
		});
	});

	describe("正常系 - 修正リンク", () => {
		it("修正リンクが正しいURLを持つ", () => {
			render(
				<ConfirmForm profileData={mockProfileData} backUrl={mockBackUrl} />,
			);

			const backLink = screen.getByRole("link", { name: "修正する" });
			expect(backLink).toHaveAttribute("href", mockBackUrl);
		});
	});

	describe("正常系 - エラー表示", () => {
		it("エラーメッセージが表示される", () => {
			const errorMessage = "登録に失敗しました";
			mockUseActionState.mockReturnValue([
				{ error: errorMessage },
				vi.fn(),
				false,
			]);

			render(
				<ConfirmForm profileData={mockProfileData} backUrl={mockBackUrl} />,
			);

			expect(screen.getByText(errorMessage)).toBeInTheDocument();
		});

		it("エラーがない場合はエラーメッセージが表示されない", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);

			render(
				<ConfirmForm profileData={mockProfileData} backUrl={mockBackUrl} />,
			);

			expect(screen.queryByText(/失敗しました/)).not.toBeInTheDocument();
		});
	});

	describe("正常系 - ローディング状態", () => {
		it("送信中はボタンがdisabledになる", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), true]);

			render(
				<ConfirmForm profileData={mockProfileData} backUrl={mockBackUrl} />,
			);

			const submitButton = screen.getByRole("button", { name: "登録中..." });
			expect(submitButton).toBeDisabled();
		});

		it("送信中はボタンのテキストが変わる", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), true]);

			render(
				<ConfirmForm profileData={mockProfileData} backUrl={mockBackUrl} />,
			);

			expect(
				screen.getByRole("button", { name: "登録中..." }),
			).toBeInTheDocument();
			expect(
				screen.queryByRole("button", { name: "この内容で登録する" }),
			).not.toBeInTheDocument();
		});

		it("送信中でない場合はボタンが有効である", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);

			render(
				<ConfirmForm profileData={mockProfileData} backUrl={mockBackUrl} />,
			);

			const submitButton = screen.getByRole("button", {
				name: "この内容で登録する",
			});
			expect(submitButton).not.toBeDisabled();
		});
	});
});
