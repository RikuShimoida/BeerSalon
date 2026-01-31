"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type FormState = {
	error?: string;
};

export async function confirmAndSaveProfile(
	_prevState: FormState | undefined,
	_formData: FormData,
): Promise<FormState | undefined> {
	const cookieStore = await cookies();
	const profileDataCookie = cookieStore.get("profile_data");
	const profileImagePathCookie = cookieStore.get("profile_image_path");

	if (!profileDataCookie) {
		return {
			error: "プロフィールデータが見つかりません",
		};
	}

	const data = JSON.parse(profileDataCookie.value);

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
			cookieStore.delete("profile_data");
			cookieStore.delete("profile_image_path");
			redirect("/");
		}

		let profileImageUrl: string | undefined;

		if (profileImagePathCookie) {
			const tempPath = profileImagePathCookie.value;
			const fileExt = tempPath.split(".").pop();
			const permanentPath = `profiles/${user.id}/avatar.${fileExt}`;

			const { data: fileData, error: downloadError } = await supabase.storage
				.from("profile-images")
				.download(tempPath);

			if (downloadError) {
				console.error(
					"[confirmAndSaveProfile] ダウンロードエラー:",
					downloadError,
				);
				return {
					error: "画像の処理に失敗しました",
				};
			}

			const { error: uploadError } = await supabase.storage
				.from("profile-images")
				.upload(permanentPath, fileData, {
					cacheControl: "3600",
					upsert: true,
				});

			if (uploadError) {
				console.error(
					"[confirmAndSaveProfile] アップロードエラー:",
					uploadError,
				);
				return {
					error: "画像の保存に失敗しました",
				};
			}

			await supabase.storage.from("profile-images").remove([tempPath]);

			const {
				data: { publicUrl },
			} = supabase.storage.from("profile-images").getPublicUrl(permanentPath);
			profileImageUrl = publicUrl;
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

		cookieStore.delete("profile_data");
		cookieStore.delete("profile_image_path");

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
