const REQUIRED_ENV_VARS = [
	"DATABASE_URL",
	"NEXT_PUBLIC_SUPABASE_URL",
	"NEXT_PUBLIC_SUPABASE_ANON_KEY",
	"SUPABASE_SERVICE_ROLE_KEY",
] as const;

const SETUP_HINT = [
	"",
	"[integration-setup] Supabase ローカルへの疎通確認に失敗しました。",
	"以下を順に実行してから再試行してください:",
	"  1. supabase start",
	"  2. pnpm e2e:setup",
	"  3. pnpm test:integration",
	"",
].join("\n");

// Why not: admin 側は Prisma を直接使う Server Action がまだ無いため、最小限の HTTP 疎通のみ確認。
// PR2 以降で admin の Integration テストが必要になったら、web の integration-setup.ts と同等の
// Prisma 疎通確認を追加する。
export async function setup(): Promise<void> {
	const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
	if (missing.length > 0) {
		throw new Error(
			`${SETUP_HINT}\n環境変数が未設定です: ${missing.join(", ")}`,
		);
	}

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
	try {
		const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
			headers: {
				apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
			},
		});
		if (!res.ok) {
			throw new Error(`Supabase health check failed: HTTP ${res.status}`);
		}
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(`${SETUP_HINT}\nSupabase health check error: ${reason}`);
	}
}
