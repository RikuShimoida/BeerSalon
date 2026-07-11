"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/validations/auth";

export type ResetPasswordState = { error?: string } | undefined;

export async function resetPasswordAction(
	_prevState: ResetPasswordState,
	formData: FormData,
): Promise<ResetPasswordState> {
	const password = formData.get("password") as string;
	const confirmPassword = formData.get("confirmPassword") as string;

	const result = resetPasswordSchema.safeParse({ password, confirmPassword });
	if (!result.success) {
		return {
			error: result.error.issues[0].message,
		};
	}

	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/password/forgot?error=session_expired");
		// Why not: テスト時の redirect モックは throw しないため、ここで明示的に return しないと
		// updateUser が誤って呼ばれてしまう。実環境では redirect が throw するため到達しない。
		return;
	}

	const { error } = await supabase.auth.updateUser({ password });

	if (error) {
		return {
			error: "パスワードの更新に失敗しました。もう一度お試しください。",
		};
	}

	await supabase.auth.signOut();

	redirect("/login?reset=success");
}
