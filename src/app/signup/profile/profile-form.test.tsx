import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileForm } from "./profile-form";

// next/imageのモック
vi.mock("next/image", () => ({
	default: (props: { src: string; alt: string }) => {
		// biome-ignore lint/performance/noImgElement: テスト用のモック
		return <img src={props.src} alt={props.alt} />;
	},
}));

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

// saveProfileToSession actionのモック
vi.mock("./actions", () => ({
	saveProfileToSession: vi.fn(),
}));

// constants/prefecturesのモック
vi.mock("@/lib/constants/prefectures", () => ({
	PREFECTURES: ["東京都", "神奈川県", "静岡県"],
	GENDERS: [
		{ value: "male", label: "男性" },
		{ value: "female", label: "女性" },
		{ value: "other", label: "その他" },
	],
}));

describe("ProfileForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);
	});

	describe("正常系 - レンダリング", () => {
		it("正しくレンダリングされる", () => {
			render(<ProfileForm />);
			expect(screen.getByLabelText("姓")).toBeInTheDocument();
		});

		it("全ての入力フィールドが表示される", () => {
			render(<ProfileForm />);

			expect(screen.getByLabelText("姓")).toBeInTheDocument();
			expect(screen.getByLabelText("名")).toBeInTheDocument();
			expect(screen.getByLabelText("ニックネーム")).toBeInTheDocument();
			expect(screen.getByText("生年月日")).toBeInTheDocument();
			expect(screen.getByLabelText("性別")).toBeInTheDocument();
			expect(screen.getByLabelText("お住まいの都道府県")).toBeInTheDocument();
			expect(
				screen.getByLabelText("プロフィール画像（任意）"),
			).toBeInTheDocument();
			expect(
				screen.getByLabelText("プロフィール文（任意）"),
			).toBeInTheDocument();
		});

		it("送信ボタンが表示される", () => {
			render(<ProfileForm />);

			expect(
				screen.getByRole("button", { name: "登録内容を確認" }),
			).toBeInTheDocument();
		});
	});

	describe("正常系 - フィールド属性", () => {
		it("姓・名・ニックネームフィールドがtype='text'である", () => {
			render(<ProfileForm />);

			const lastNameInput = screen.getByLabelText("姓");
			const firstNameInput = screen.getByLabelText("名");
			const nicknameInput = screen.getByLabelText("ニックネーム");

			expect(lastNameInput).toHaveAttribute("type", "text");
			expect(firstNameInput).toHaveAttribute("type", "text");
			expect(nicknameInput).toHaveAttribute("type", "text");
		});

		it("必須フィールドがrequiredである", () => {
			render(<ProfileForm />);

			expect(screen.getByLabelText("姓")).toBeRequired();
			expect(screen.getByLabelText("名")).toBeRequired();
			expect(screen.getByLabelText("ニックネーム")).toBeRequired();
			expect(screen.getByLabelText("性別")).toBeRequired();
			expect(screen.getByLabelText("お住まいの都道府県")).toBeRequired();
		});

		it("任意フィールドがrequiredでない", () => {
			render(<ProfileForm />);

			const bioInput = screen.getByLabelText("プロフィール文（任意）");
			expect(bioInput).not.toBeRequired();
		});
	});

	describe("正常系 - selectフィールド", () => {
		it("性別selectが正しいオプションを持つ", () => {
			render(<ProfileForm />);

			const genderSelect = screen.getByLabelText("性別");
			expect(genderSelect).toBeInTheDocument();

			// オプションをテキストで検索
			expect(screen.getByText("男性")).toBeInTheDocument();
			expect(screen.getByText("女性")).toBeInTheDocument();
			expect(screen.getByText("その他")).toBeInTheDocument();
		});

		it("都道府県selectが正しいオプションを持つ", () => {
			render(<ProfileForm />);

			const prefectureSelect = screen.getByLabelText("お住まいの都道府県");
			expect(prefectureSelect).toBeInTheDocument();

			// モックした都道府県が表示される
			expect(screen.getByText("東京都")).toBeInTheDocument();
			expect(screen.getByText("神奈川県")).toBeInTheDocument();
			expect(screen.getByText("静岡県")).toBeInTheDocument();
		});

		it("生年月日のselectが3つ表示される", () => {
			render(<ProfileForm />);

			// 年select (name="year")
			const yearSelect = document.querySelector('select[name="year"]');
			expect(yearSelect).toBeInTheDocument();

			// 月select (name="month")
			const monthSelect = document.querySelector('select[name="month"]');
			expect(monthSelect).toBeInTheDocument();

			// 日select (name="day")
			const daySelect = document.querySelector('select[name="day"]');
			expect(daySelect).toBeInTheDocument();
		});
	});

	describe("正常系 - 画像アップロード", () => {
		it("プロフィール画像アップロードフィールドが表示される", () => {
			render(<ProfileForm />);

			const imageInput = screen.getByLabelText("プロフィール画像（任意）");
			expect(imageInput).toHaveAttribute("type", "file");
			expect(imageInput).toHaveAttribute("accept", "image/*");
		});

		it("画像サイズのヒントが表示される", () => {
			render(<ProfileForm />);

			expect(
				screen.getByText("推奨: 正方形の画像、最大5MB"),
			).toBeInTheDocument();
		});
	});

	describe("正常系 - bioフィールド", () => {
		it("bioフィールドがtextareaである", () => {
			render(<ProfileForm />);

			const bioInput = screen.getByLabelText("プロフィール文（任意）");
			expect(bioInput.tagName).toBe("TEXTAREA");
		});

		it("bioフィールドのmaxLengthが500である", () => {
			render(<ProfileForm />);

			const bioInput = screen.getByLabelText("プロフィール文（任意）");
			expect(bioInput).toHaveAttribute("maxLength", "500");
		});

		it("bio文字数カウンターが表示される", () => {
			render(<ProfileForm />);

			expect(screen.getByText("0/500文字")).toBeInTheDocument();
		});

		it("bio入力時に文字数カウンターが更新される", async () => {
			const user = userEvent.setup();
			render(<ProfileForm />);

			const bioInput = screen.getByLabelText("プロフィール文（任意）");
			await user.type(bioInput, "テスト");

			expect(screen.getByText("3/500文字")).toBeInTheDocument();
		});
	});

	// NOTE: フォーム送信のテストは生年月日selectの複雑な処理のため省略

	describe("正常系 - エラー表示", () => {
		it("エラーメッセージが表示される", () => {
			const errorMessage = "姓を入力してください";
			mockUseActionState.mockReturnValue([
				{ error: errorMessage },
				vi.fn(),
				false,
			]);

			render(<ProfileForm />);

			expect(screen.getByText(errorMessage)).toBeInTheDocument();
		});

		it("エラーがない場合はエラーメッセージが表示されない", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);

			render(<ProfileForm />);

			expect(screen.queryByText(/入力してください/)).not.toBeInTheDocument();
		});
	});

	describe("正常系 - ローディング状態", () => {
		it("送信中はボタンがdisabledになる", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), true]);

			render(<ProfileForm />);

			const submitButton = screen.getByRole("button", {
				name: "確認中...",
			});
			expect(submitButton).toBeDisabled();
		});

		it("送信中はボタンのテキストが変わる", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), true]);

			render(<ProfileForm />);

			expect(
				screen.getByRole("button", { name: "確認中..." }),
			).toBeInTheDocument();
			expect(
				screen.queryByRole("button", { name: "登録内容を確認" }),
			).not.toBeInTheDocument();
		});

		it("送信中でない場合はボタンが有効である", () => {
			mockUseActionState.mockReturnValue([undefined, vi.fn(), false]);

			render(<ProfileForm />);

			const submitButton = screen.getByRole("button", {
				name: "登録内容を確認",
			});
			expect(submitButton).not.toBeDisabled();
		});
	});
});
