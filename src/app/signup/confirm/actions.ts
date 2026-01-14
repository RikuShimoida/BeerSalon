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

		let profileImageUrl: string | undefined;

		if (data.profileImageUrl) {
			const base64Data = data.profileImageUrl.split(",")[1];
			const buffer = Buffer.from(base64Data, "base64");
			const fileName = `${user.id}-${Date.now()}.png`;

			const { data: uploadData, error: uploadError } = await supabase.storage
				.from("profile-images")
				.upload(fileName, buffer, {
					contentType: "image/png",
					cacheControl: "3600",
					upsert: false,
				});

			if (uploadError) {
				console.error(
					"[confirmAndSaveProfile] 画像アップロードエラー:",
					uploadError,
				);
				return {
					error: `画像のアップロードに失敗しました: ${uploadError.message}`,
				};
			}

			if (uploadData) {
				const {
					data: { publicUrl },
				} = supabase.storage.from("profile-images").getPublicUrl(fileName);
				profileImageUrl = publicUrl;
			}
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
				profileImageUrl: profileImageUrl,
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
