"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";

type FormState = {
	error?: string;
};

export async function login(
	_prevState: FormState | undefined,
	formData: FormData,
): Promise<FormState | undefined> {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

	// バリデーション
	const result = loginSchema.safeParse({ email, password });
	if (!result.success) {
		return {
			error: result.error.issues[0].message,
		};
	}

	const supabase = await createClient();

	// Supabase Authでログイン
	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		return {
			error: "メールアドレスまたはパスワードが違います",
		};
	}

	// 成功時はトップページへリダイレクト
	redirect("/");
}
