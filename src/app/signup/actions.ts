"use server";

import { createClient } from "@/lib/supabase/server";
import { signUpSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";

type FormState = {
	error?: string;
};

export async function signUp(
	prevState: FormState | undefined,
	formData: FormData,
): Promise<FormState | undefined> {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

	// バリデーション
	const result = signUpSchema.safeParse({ email, password });
	if (!result.success) {
		return {
			error: result.error.issues[0].message,
		};
	}

	const supabase = await createClient();

	// Supabase Authでユーザー登録
	const { error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/signup/profile`,
		},
	});

	if (error) {
		return {
			error: error.message,
		};
	}

	// 成功時は確認メッセージページへリダイレクト
	redirect("/signup?success=true");
}
