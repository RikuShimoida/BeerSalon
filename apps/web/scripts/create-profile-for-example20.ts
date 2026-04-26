import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma";

const pool = new Pool({
	connectionString:
		process.env.DATABASE_URL ||
		"postgresql://postgres:postgres@127.0.0.1:54322/postgres",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
	const email = "example20@gmail.com";

	// Supabase Authのユーザー取得
	const authUsers = await prisma.$queryRaw<
		Array<{ id: string; email: string }>
	>`
    SELECT id, email FROM auth.users WHERE email = ${email}
  `;

	if (authUsers.length === 0) {
		console.log(`❌ Auth user not found: ${email}`);
		return;
	}

	const authUserId = authUsers[0].id;
	console.log(`Found auth user: ${authUserId}`);

	// 既存プロフィールの確認
	const existingProfile = await prisma.userProfile.findUnique({
		where: { userAuthId: authUserId },
	});

	if (existingProfile) {
		console.log("Profile already exists:", existingProfile);
		return;
	}

	// プロフィール作成
	const profile = await prisma.userProfile.create({
		data: {
			userAuthId: authUserId,
			lastName: "下井田",
			firstName: "陸",
			nickname: "りく",
			birthday: new Date("1994-05-13"),
			gender: "male",
			prefecture: "静岡県",
		},
	});

	console.log("✅ Profile created successfully:", profile);
}

main()
	.catch(console.error)
	.finally(async () => {
		await prisma.$disconnect();
		await pool.end();
	});
