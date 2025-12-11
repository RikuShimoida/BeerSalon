"use server";

import { createClient } from "@/lib/supabase/server";
import { signUpSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";

type FormState = {
	error?: string;
};

/**
 * ユーザー新規登録アクション
 *
 * 【動作フロー】
 * 1. フォームデータのバリデーション
 * 2. Supabase Authでユーザー登録（この時点ではログインしない）
 * 3. Supabaseが確認メールを自動送信
 * 4. 成功メッセージページへリダイレクト
 * 5. ユーザーがメール内のリンクをクリックして初めてアカウントが有効化される
 *
 * 【重要】
 * - supabase/config.toml の auth.email.enable_confirmations が true である必要がある
 * - enable_confirmations = false の場合、即座にログイン状態になってしまう
 * - この関数内では signIn を呼ばず、メール確認を待つ
 */
export async function signUp(
	prevState: FormState | undefined,
	formData: FormData,
): Promise<FormState | undefined> {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

	// 1. バリデーション
	const result = signUpSchema.safeParse({ email, password });
	if (!result.success) {
		return {
			error: result.error.issues[0].message,
		};
	}

	const supabase = await createClient();

	// 2. Supabase Authでユーザー登録
	// emailRedirectTo: メール内リンククリック後のリダイレクト先
	// enable_confirmations が true の場合、ここではセッションは発行されない
	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/signup/profile`,
		},
	});

	// デバッグ用: 戻り値を詳細にログ出力
	console.log("=== signUp() Debug Info ===");
	console.log("Session:", data.session ? "EXISTS (問題あり)" : "NULL (正常)");
	console.log("User ID:", data.user?.id);
	console.log("User Email:", data.user?.email);
	console.log("Email Confirmed:", data.user?.email_confirmed_at);
	console.log("User Role:", data.user?.role);
	console.log("=========================");

	if (error) {
		return {
			error: error.message,
		};
	}

	// enable_confirmations = true の場合、session は null であるべき
	if (data.session) {
		console.error(
			"警告: セッションが発行されています。config.toml の enable_confirmations が false の可能性があります。",
		);
	}

	// 3. 成功時は確認メッセージページへリダイレクト
	// ?success=true をつけることで、page.tsx で成功メッセージを表示
	redirect("/signup?success=true");
}
