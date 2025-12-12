"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

type FormState = {
	error?: string;
};

export async function confirmAndSaveProfile(
	prevState: FormState | undefined,
	formData: FormData,
): Promise<FormState | undefined> {
	const data = JSON.parse(formData.get("profileData") as string);

	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return {
			error: "認証が必要です",
		};
	}

	try {
		await prisma.userProfile.create({
			data: {
				userAuthId: user.id,
				lastName: data.lastName,
				firstName: data.firstName,
				nickname: data.nickname,
				birthday: new Date(data.birthday),
				gender: data.gender,
				prefecture: data.prefecture,
			},
		});

		redirect("/");
	} catch (error) {
		return {
			error: "プロフィールの保存に失敗しました",
		};
	}
}
