import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileEditForm } from "./profile-edit-form";

// next/imageのモック
vi.mock("next/image", () => ({
	default: (props: { src: string; alt: string }) => {
		// biome-ignore lint/performance/noImgElement: テスト用のモック
		return <img src={props.src} alt={props.alt} />;
	},
}));

// next/navigationのモック
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({
		push: mockPush,
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

// updateProfile actionのモック
vi.mock("./actions", () => ({
	updateProfile: vi.fn(),
}));

const mockCurrentProfile = {
	profileImageUrl: "https://example.com/image.jpg",
	bio: "テストbio",
	nickname: "テストユーザー",
	lastName: "下井田",
	firstName: "陸",
	email: "test@example.com",
	birthday: "1994-05-13",
	gender: "男性",
	prefecture: "静岡県",
};

describe("ProfileEditForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);
	});

	describe("正常系 - レンダリング", () => {
		it("正しくレンダリングされる", () => {
			render(<ProfileEditForm currentProfile={mockCurrentProfile} />);
			expect(screen.getByLabelText("プロフィール画像")).toBeInTheDocument();
		});

		it("編集可能なフィールドが表示される", () => {
			render(<ProfileEditForm currentProfile={mockCurrentProfile} />);

			expect(screen.getByLabelText("プロフィール画像")).toBeInTheDocument();
			expect(screen.getByLabelText("プロフィール文")).toBeInTheDocument();
		});

		it("編集不可の基本情報が表示される", () => {
			render(<ProfileEditForm currentProfile={mockCurrentProfile} />);

			expect(screen.getByText("基本情報（編集不可）")).toBeInTheDocument();
			expect(screen.getByText("テストユーザー")).toBeInTheDocument();
			expect(screen.getByText("下井田")).toBeInTheDocument();
			expect(screen.getByText("陸")).toBeInTheDocument();
			expect(screen.getByText("test@example.com")).toBeInTheDocument();
			expect(screen.getByText("1994-05-13")).toBeInTheDocument();
			expect(screen.getByText("男性")).toBeInTheDocument();
			expect(screen.getByText("静岡県")).toBeInTheDocument();
		});

		it("送信ボタンとキャンセルボタンが表示される", () => {
			render(<ProfileEditForm currentProfile={mockCurrentProfile} />);

			expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "キャンセル" }),
			).toBeInTheDocument();
		});
	});

	describe("正常系 - フィールド属性", () => {
		it("プロフィール画像フィールドがtype='file'である", () => {
			render(<ProfileEditForm currentProfile={mockCurrentProfile} />);

			const imageInput = screen.getByLabelText("プロフィール画像");
			expect(imageInput).toHaveAttribute("type", "file");
			expect(imageInput).toHaveAttribute("accept", "image/*");
		});

		it("bioフィールドがtextareaである", () => {
			render(<ProfileEditForm currentProfile={mockCurrentProfile} />);

			const bioInput = screen.getByLabelText("プロフィール文");
			expect(bioInput.tagName).toBe("TEXTAREA");
		});

		it("bioフィールドのmaxLengthが500である", () => {
			render(<ProfileEditForm currentProfile={mockCurrentProfile} />);

			const bioInput = screen.getByLabelText("プロフィール文");
			expect(bioInput).toHaveAttribute("maxLength", "500");
		});

		it("bioフィールドに既存値が表示される", () => {
			render(<ProfileEditForm currentProfile={mockCurrentProfile} />);

			const bioInput = screen.getByLabelText(
				"プロフィール文",
			) as HTMLTextAreaElement;
			expect(bioInput.value).toBe("テストbio");
		});
	});

	describe("正常系 - bio文字数カウンター", () => {
		it("bio文字数カウンターが表示される", () => {
			render(<ProfileEditForm currentProfile={mockCurrentProfile} />);

			expect(screen.getByText("6/500文字")).toBeInTheDocument();
		});

		it("bio入力時に文字数カウンターが更新される", async () => {
			const user = userEvent.setup();
			render(
				<ProfileEditForm currentProfile={{ ...mockCurrentProfile, bio: "" }} />,
			);

			const bioInput = screen.getByLabelText("プロフィール文");
			await user.type(bioInput, "新しいbio");

			expect(screen.getByText("6/500文字")).toBeInTheDocument();
		});
	});

	describe("正常系 - キャンセルボタン", () => {
		it("キャンセルボタンをクリックするとrouter.push('/mypage')が呼ばれる", async () => {
			const user = userEvent.setup();
			render(<ProfileEditForm currentProfile={mockCurrentProfile} />);

			const cancelButton = screen.getByRole("button", {
				name: "キャンセル",
			});
			await user.click(cancelButton);

			expect(mockPush).toHaveBeenCalledWith("/mypage");
		});
	});

	describe("正常系 - エラー表示", () => {
		it("エラーメッセージが表示される", () => {
			const errorMessage = "プロフィールの更新に失敗しました";
			mockUseActionState.mockReturnValue([
				{ error: errorMessage },
				vi.fn(),
				false,
			]);

			render(<ProfileEditForm currentProfile={mockCurrentProfile} />);

			expect(screen.getByText(errorMessage)).toBeInTheDocument();
		});

		it("エラーがない場合はエラーメッセージが表示されない", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);

			render(<ProfileEditForm currentProfile={mockCurrentProfile} />);

			expect(screen.queryByText(/失敗しました/)).not.toBeInTheDocument();
		});
	});

	describe("正常系 - ローディング状態", () => {
		it("送信中はボタンがdisabledになる", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), true]);

			render(<ProfileEditForm currentProfile={mockCurrentProfile} />);

			const submitButton = screen.getByRole("button", { name: "保存中..." });
			expect(submitButton).toBeDisabled();
		});

		it("送信中はボタンのテキストが変わる", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), true]);

			render(<ProfileEditForm currentProfile={mockCurrentProfile} />);

			expect(
				screen.getByRole("button", { name: "保存中..." }),
			).toBeInTheDocument();
			expect(
				screen.queryByRole("button", { name: "保存" }),
			).not.toBeInTheDocument();
		});

		it("送信中でない場合はボタンが有効である", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);

			render(<ProfileEditForm currentProfile={mockCurrentProfile} />);

			const submitButton = screen.getByRole("button", { name: "保存" });
			expect(submitButton).not.toBeDisabled();
		});
	});
});
