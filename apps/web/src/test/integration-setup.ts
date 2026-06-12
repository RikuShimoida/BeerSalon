import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma";

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
	"  2. pnpm e2e:setup   # seed.e2e.sql 投入 + Auth テストユーザー作成",
	"  3. pnpm test:integration",
	"",
].join("\n");

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

	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	const adapter = new PrismaPg(pool);
	const prisma = new PrismaClient({ adapter });
	try {
		await prisma.$queryRaw`SELECT 1`;
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(`${SETUP_HINT}\nPrisma connectivity error: ${reason}`);
	} finally {
		await prisma.$disconnect();
		await pool.end();
	}
}
