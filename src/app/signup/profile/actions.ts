"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations/auth";

type FormState = {
	error?: string;
};

const PROFILE_COOKIE_NAME = "signup_profile_data";
const PROFILE_COOKIE_MAX_AGE = 60 * 10;

export async function saveProfileToSession(
	_prevState: FormState | undefined,
	formData: FormData,
): Promise<FormState | undefined> {
	try {
		const data = {
			lastName: formData.get("lastName") as string,
			firstName: formData.get("firstName") as string,
			nickname: formData.get("nickname") as string,
			birthday: formData.get("birthday") as string,
			gender: formData.get("gender") as string,
			prefecture: formData.get("prefecture") as string,
			profileImageUrl: formData.get("profileImageUrl") as string | undefined,
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

		console.log("[saveProfileToSession] Saving to cookie and redirecting");

		const cookieStore = await cookies();
		cookieStore.set(PROFILE_COOKIE_NAME, JSON.stringify(data), {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: PROFILE_COOKIE_MAX_AGE,
			path: "/signup",
		});

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

export async function getProfileFromCookie() {
	const cookieStore = await cookies();
	const profileCookie = cookieStore.get(PROFILE_COOKIE_NAME);

	if (!profileCookie) {
		return null;
	}

	try {
		return JSON.parse(profileCookie.value);
	} catch (error) {
		console.error("[getProfileFromCookie] Failed to parse cookie:", error);
		return null;
	}
}

export async function clearProfileCookie() {
	const cookieStore = await cookies();
	cookieStore.delete(PROFILE_COOKIE_NAME);
}
