import "server-only";
import { createClient } from "@supabase/supabase-js";
import { decodeJwtRole } from "./jwt-role";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client (サーバーサイドのみで使用)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

// Why not: service_role 以外のキー（例: anon キーの貼り間違い）を渡すと Storage 書き込みが
//          RLS で 403 失敗する（#392）。JWT形式の場合のみ role を検証し、不一致なら起動時に警告する
const serviceRoleKeyRole = decodeJwtRole(serviceRoleKey);
if (
	serviceRoleKey &&
	serviceRoleKeyRole &&
	serviceRoleKeyRole !== "service_role"
) {
	console.error(
		`[supabase] SUPABASE_SERVICE_ROLE_KEY is not a service_role key (role="${serviceRoleKeyRole}"). Admin writes such as Storage uploads will fail with RLS violations. Check the environment variable.`,
	);
}
