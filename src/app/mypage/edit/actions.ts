"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type FormState = {
	error?: string;
};

export async function updateProfile(
	_prevState: FormState | undefined,
	formData: FormData,
): Promise<FormState | undefined> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return {
			error: "認証が必要です",
		};
	}

	const bio = formData.get("bio") as string | null;
	const profileImageUrl = formData.get("profileImageUrl") as string | null;

	if (bio && bio.length > 500) {
		return {
			error: "プロフィール文は500文字以内で入力してください",
		};
	}

	try {
		let imageUrl: string | null = null;

		if (profileImageUrl?.startsWith("data:image")) {
			const base64Data = profileImageUrl.split(",")[1];
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
				console.error("画像アップロードエラー:", uploadError);
			} else if (uploadData) {
				const {
					data: { publicUrl },
				} = supabase.storage.from("profile-images").getPublicUrl(fileName);
				imageUrl = publicUrl;
			}
		}

		const updateData: {
			profileImageUrl?: string | null;
			bio: string | null;
		} = {
			bio: bio || null,
		};

		if (profileImageUrl?.startsWith("data:image") && imageUrl) {
			updateData.profileImageUrl = imageUrl;
		}

		await prisma.userProfile.update({
			where: {
				userAuthId: user.id,
			},
			data: updateData,
		});
	} catch (error) {
		console.error("プロフィール更新エラー:", error);
		if (error instanceof Error) {
			console.error("エラーメッセージ:", error.message);
			console.error("エラースタック:", error.stack);
		}
		return {
			error: "プロフィールの更新に失敗しました",
		};
	}

	redirect("/mypage");
}
