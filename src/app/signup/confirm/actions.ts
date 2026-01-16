"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type FormState = {
	error?: string;
};

export async function confirmAndSaveProfile(
	_prevState: FormState | undefined,
	formData: FormData,
): Promise<FormState | undefined> {
	const data = JSON.parse(formData.get("profileData") as string);

	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		console.error("[confirmAndSaveProfile] ユーザー認証失敗");
		return {
			error: "認証が必要です",
		};
	}

	try {
		const existingProfile = await prisma.userProfile.findUnique({
			where: { userAuthId: user.id },
		});

		if (existingProfile) {
			redirect("/");
		}

		const birthdayDate = new Date(data.birthday);
		if (Number.isNaN(birthdayDate.getTime())) {
			console.error(
				`[confirmAndSaveProfile] 生年月日の形式が不正です: ${data.birthday}`,
			);
			return {
				error: "生年月日の形式が不正です",
			};
		}

		await prisma.userProfile.create({
			data: {
				userAuthId: user.id,
				lastName: data.lastName,
				firstName: data.firstName,
				nickname: data.nickname,
				birthday: birthdayDate,
				gender: data.gender,
				prefecture: data.prefecture,
				profileImageUrl: data.profileImageUrl || null,
				bio: data.bio,
			},
		});

		redirect("/");
	} catch (error) {
		if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
			throw error;
		}

		console.error("[confirmAndSaveProfile] エラー発生:", error);

		if (error instanceof Error) {
			return {
				error: `プロフィールの保存に失敗しました: ${error.message}`,
			};
		}

		return {
			error: "プロフィールの保存に失敗しました",
		};
	}
}
