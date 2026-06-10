/**
 * seed-e2e.ts で使われる純粋ロジック。
 * pg / supabase-js への依存を持たないユーティリティのみをここに集約することで、
 * apps/web の vitest からも単体テスト可能にする。
 */

interface AuthUser {
	id: string;
	email?: string | null | undefined;
}

interface SupabaseAdminLike {
	auth: {
		admin: {
			listUsers: (params: { page: number; perPage: number }) => Promise<{
				data: { users: AuthUser[] };
				error: { message: string } | null;
			}>;
		};
	};
}

/**
 * 指定メールアドレスのユーザーが Supabase Auth に存在するか確認する
 * @returns 存在すれば user.id を返す。なければ null
 */
export async function findExistingUserId(
	supabase: SupabaseAdminLike,
	email: string,
): Promise<string | null> {
	const { data, error } = await supabase.auth.admin.listUsers({
		page: 1,
		perPage: 1000,
	});
	if (error) {
		throw new Error(`Failed to list users: ${error.message}`);
	}
	const existing = data.users.find((u) => u.email === email);
	return existing?.id ?? null;
}
