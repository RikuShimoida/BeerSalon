"use server";

import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";

type FormState = {
	error?: string;
};

export async function saveProfileToSession(
	prevState: FormState | undefined,
	formData: FormData,
): Promise<FormState | undefined> {
	const data = {
		lastName: formData.get("lastName") as string,
		firstName: formData.get("firstName") as string,
		nickname: formData.get("nickname") as string,
		birthday: formData.get("birthday") as string,
		gender: formData.get("gender") as string,
		prefecture: formData.get("prefecture") as string,
	};

	const result = profileSchema.safeParse(data);
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
		return {
			error: "認証が必要です",
		};
	}

	// プロフィールデータを一時的にセッションに保存
	// （実際のセッションストレージの代わりにクッキーやローカルストレージを使う場合もあります）
	// ここでは次のページに渡すために、リダイレクトURLにエンコードして渡します

	const profileData = encodeURIComponent(JSON.stringify(data));
	redirect(`/signup/confirm?data=${profileData}`);
}
