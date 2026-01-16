"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations/auth";

type FormState = {
	error?: string;
};

export async function saveProfileToSession(
	_prevState: FormState | undefined,
	formData: FormData,
): Promise<FormState | undefined> {
	try {
		const supabase = await createClient();

		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError) {
			console.error("[saveProfileToSession] Auth error:", authError);
			return {
				error: `認証エラーが発生しました: ${authError.message}`,
			};
		}

		if (!user) {
			console.warn("[saveProfileToSession] No user found");
			return {
				error: "認証が必要です",
			};
		}

		let profileImageUrl: string | undefined;
		const profileImage = formData.get("profileImage") as File | null;

		if (profileImage && profileImage.size > 0) {
			const arrayBuffer = await profileImage.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			const fileName = `${user.id}-${Date.now()}.${profileImage.type.split("/")[1]}`;

			const { data: uploadData, error: uploadError } = await supabase.storage
				.from("profile-images")
				.upload(fileName, buffer, {
					contentType: profileImage.type,
					cacheControl: "3600",
					upsert: false,
				});

			if (uploadError) {
				console.error(
					"[saveProfileToSession] 画像アップロードエラー:",
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

		const data = {
			lastName: formData.get("lastName") as string,
			firstName: formData.get("firstName") as string,
			nickname: formData.get("nickname") as string,
			birthday: formData.get("birthday") as string,
			gender: formData.get("gender") as string,
			prefecture: formData.get("prefecture") as string,
			profileImageUrl: profileImageUrl,
			bio: formData.get("bio") as string | undefined,
		};

		console.log("[saveProfileToSession] Validating profile data:", {
			...data,
			profileImageUrl: data.profileImageUrl ? "[REDACTED]" : undefined,
		});

		const result = profileSchema.safeParse(data);
		if (!result.success) {
			console.error("[saveProfileToSession] Validation error:", result.error);
			return {
				error: result.error.issues[0].message,
			};
		}

		console.log("[saveProfileToSession] Redirecting to confirm page");

		const profileData = encodeURIComponent(JSON.stringify(data));
		redirect(`/signup/confirm?data=${profileData}`);
	} catch (error) {
		console.error("[saveProfileToSession] Unexpected error:", error);

		if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
			throw error;
		}

		return {
			error: "予期しないエラーが発生しました。もう一度お試しください。",
		};
	}
}
