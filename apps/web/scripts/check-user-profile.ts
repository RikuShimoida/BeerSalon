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
	// Supabase Authのユーザー取得
	const authUsers = await prisma.$queryRaw<
		Array<{ id: string; email: string }>
	>`
    SELECT id, email FROM auth.users WHERE email = 'example20@gmail.com'
  `;

	console.log("Auth user:", authUsers);

	if (authUsers.length > 0) {
		const authUserId = authUsers[0].id;

		// user_profilesの確認
		const profile = await prisma.userProfile.findUnique({
			where: { userAuthId: authUserId },
		});

		console.log("User profile:", profile);

		if (!profile) {
			console.log("⚠️ User profile does not exist for this auth user!");
		}
	}
}

main()
	.catch(console.error)
	.finally(async () => {
		await prisma.$disconnect();
		await pool.end();
	});
