"use server";

import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { signUpSchema } from "@/lib/validations/auth";

type FormState = {
	error?: string;
};

export async function signUp(
	_prevState: FormState | undefined,
	formData: FormData,
): Promise<FormState | undefined> {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

	const result = signUpSchema.safeParse({ email, password });
	if (!result.success) {
		return {
			error: result.error.issues[0].message,
		};
	}

	const supabase = await createClient();
	const siteUrl = await getSiteUrl();

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: `${siteUrl}/auth/callback?next=/signup/profile`,
		},
	});

	if (error) {
		return {
			error: error.message,
		};
	}

	if (data.session) {
		console.error(
			"警告: セッションが発行されています。config.toml の enable_confirmations が false の可能性があります。",
		);
	}

	redirect("/signup?success=true");
}
