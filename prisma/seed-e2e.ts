/**
 * Beer Salon - E2E Test User Seed
 *
 * Supabase Auth に E2E 用テストユーザーを作成する。
 * - auth.users 経由でユーザー作成（メールリンクバイパス）
 * - 続けて user_profiles に INSERT
 * - 冪等性: 既に存在する場合はスキップ
 *
 * 必要な環境変数:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - E2E_TEST_USER_PASSWORD
 *   - DATABASE_URL
 *
 * 実行: tsx prisma/seed-e2e.ts
 */

import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";
import { findExistingUserId } from "./seed-e2e-utils";

const E2E_TEST_USER_EMAIL = "smoke-user@example.test";
const E2E_TEST_USER_PROFILE = {
	last_name: "スモーク",
	first_name: "テスト",
	nickname: "smoke-user",
	birthday: "1990-01-01",
	gender: "male",
	prefecture: "東京都",
};

async function main() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	const testUserPassword = process.env.E2E_TEST_USER_PASSWORD;
	const databaseUrl = process.env.DATABASE_URL;

	if (!supabaseUrl || !serviceRoleKey || !testUserPassword || !databaseUrl) {
		console.error(
			"[seed-e2e] Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, E2E_TEST_USER_PASSWORD, DATABASE_URL",
		);
		process.exit(1);
	}

	const supabase = createClient(supabaseUrl, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	const pg = new Client({ connectionString: databaseUrl });
	await pg.connect();

	try {
		const existingUserId = await findExistingUserId(
			supabase,
			E2E_TEST_USER_EMAIL,
		);

		let authUserId: string;
		if (existingUserId) {
			authUserId = existingUserId;
			console.log(
				`[seed-e2e] auth user already exists for ${E2E_TEST_USER_EMAIL}, skipping`,
			);
		} else {
			const { data, error } = await supabase.auth.admin.createUser({
				email: E2E_TEST_USER_EMAIL,
				password: testUserPassword,
				email_confirm: true,
			});
			if (error || !data.user) {
				throw new Error(
					`Failed to create E2E test user: ${error?.message ?? "unknown"}`,
				);
			}
			authUserId = data.user.id;
			console.log(`[seed-e2e] created auth user for ${E2E_TEST_USER_EMAIL}`);
		}

		const existing = await pg.query(
			"SELECT 1 FROM user_profiles WHERE user_auth_id = $1",
			[authUserId],
		);
		if (existing.rowCount && existing.rowCount > 0) {
			console.log(
				`[seed-e2e] user_profiles already exists for ${E2E_TEST_USER_EMAIL}, skipping`,
			);
		} else {
			await pg.query(
				`INSERT INTO user_profiles
				(user_auth_id, last_name, first_name, nickname, birthday, gender, prefecture)
				VALUES ($1, $2, $3, $4, $5, $6, $7)`,
				[
					authUserId,
					E2E_TEST_USER_PROFILE.last_name,
					E2E_TEST_USER_PROFILE.first_name,
					E2E_TEST_USER_PROFILE.nickname,
					E2E_TEST_USER_PROFILE.birthday,
					E2E_TEST_USER_PROFILE.gender,
					E2E_TEST_USER_PROFILE.prefecture,
				],
			);
			console.log(
				`[seed-e2e] created user_profiles for ${E2E_TEST_USER_EMAIL}`,
			);
		}
	} finally {
		await pg.end();
	}
}

main().catch((err) => {
	console.error("[seed-e2e] failed:", err);
	process.exit(1);
});
