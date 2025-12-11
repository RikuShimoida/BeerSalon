import { z } from "zod";

// サインアップフォームのバリデーションスキーマ
export const signUpSchema = z.object({
	email: z
		.string()
		.min(1, { message: "メールアドレスを入力してください" })
		.email({ message: "有効なメールアドレスを入力してください" }),
	password: z
		.string()
		.min(8, { message: "パスワードは8文字以上で入力してください" })
		.regex(/[a-z]/, {
			message: "パスワードには小文字を含めてください",
		})
		.regex(/[A-Z]/, {
			message: "パスワードには大文字を含めてください",
		})
		.regex(/[0-9]/, { message: "パスワードには数字を含めてください" })
		.regex(/[^a-zA-Z0-9]/, {
			message: "パスワードには記号を含めてください",
		}),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

// ログインフォームのバリデーションスキーマ
export const loginSchema = z.object({
	email: z
		.string()
		.min(1, { message: "メールアドレスを入力してください" })
		.email({ message: "有効なメールアドレスを入力してください" }),
	password: z.string().min(1, { message: "パスワードを入力してください" }),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// プロフィール入力フォームのバリデーションスキーマ
export const profileSchema = z.object({
	lastName: z.string().min(1, { message: "姓を入力してください" }),
	firstName: z.string().min(1, { message: "名を入力してください" }),
	nickname: z.string().min(1, { message: "ニックネームを入力してください" }),
	birthday: z.string().min(1, { message: "生年月日を選択してください" }),
	gender: z.string().min(1, { message: "性別を選択してください" }),
	prefecture: z.string().min(1, { message: "都道府県を選択してください" }),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
