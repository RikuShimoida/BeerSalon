import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
	const cookieStore = await cookies();

	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !anonKey) {
		throw new Error("Missing Supabase environment variables");
	}

	return createServerClient(url, anonKey, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(cookiesToSet) {
				try {
					for (const { name, value, options } of cookiesToSet) {
						cookieStore.set(name, value, options);
					}
				} catch {
					// Server Componentから呼ばれた場合はcookieの設定ができない
					// ミドルウェアやServer Actionから呼ぶ必要がある
				}
			},
		},
	});
}

export async function createAdminClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !serviceRoleKey) {
		throw new Error("Missing Supabase admin environment variables");
	}

	return createServerClient(url, serviceRoleKey, {
		cookies: {
			getAll() {
				return [];
			},
			setAll() {},
		},
	});
}
