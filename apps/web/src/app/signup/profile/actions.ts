"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations/auth";

type FormState = {
	error?: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function saveProfileToSession(
	_prevState: FormState | undefined,
	formData: FormData,
): Promise<FormState | undefined> {
	try {
		const profileImage = formData.get("profileImage") as File | null;

		if (profileImage && profileImage.size > 0) {
			if (profileImage.size > MAX_FILE_SIZE) {
				return {
					error: "画像ファイルは5MB以下にしてください",
				};
			}

			if (!ALLOWED_FILE_TYPES.includes(profileImage.type)) {
				return {
					error: "画像形式はJPEG、PNG、WebPのみ対応しています",
				};
			}
		}

		const data = {
			lastName: formData.get("lastName") as string,
			firstName: formData.get("firstName") as string,
			nickname: formData.get("nickname") as string,
			birthday: formData.get("birthday") as string,
			gender: formData.get("gender") as string,
			prefecture: formData.get("prefecture") as string,
			profileImageUrl: undefined as string | undefined,
			bio: formData.get("bio") as string | undefined,
		};

		console.log("[saveProfileToSession] Validating profile data");

		const result = profileSchema.safeParse(data);
		if (!result.success) {
			console.error("[saveProfileToSession] Validation error:", result.error);
			return {
				error: result.error.issues[0].message,
			};
		}

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

		let imagePath: string | undefined;
		if (profileImage && profileImage.size > 0) {
			const fileExt = profileImage.name.split(".").pop();
			const fileName = `${Date.now()}.${fileExt}`;
			const filePath = `temp/${user.id}/${fileName}`;

			const { error: uploadError } = await supabase.storage
				.from("profile-images")
				.upload(filePath, profileImage, {
					cacheControl: "3600",
					upsert: false,
				});

			if (uploadError) {
				console.error("[saveProfileToSession] Upload error:", uploadError);
				return {
					error: "画像のアップロードに失敗しました。もう一度お試しください。",
				};
			}

			imagePath = filePath;
			console.log("[saveProfileToSession] Image uploaded:", filePath);
		}

		const cookieStore = await cookies();

		if (imagePath) {
			cookieStore.set("profile_image_path", imagePath, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: 60 * 10, // 10分
				path: "/",
			});
		}

		const profileDataWithoutImage = { ...data };
		cookieStore.set("profile_data", JSON.stringify(profileDataWithoutImage), {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 10, // 10分
			path: "/",
		});

		console.log("[saveProfileToSession] Redirecting to confirm page");
		redirect("/signup/confirm");
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
