import { createClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const pool = new Pool({
	connectionString:
		process.env.DATABASE_URL ||
		"postgresql://postgres:postgres@127.0.0.1:54322/postgres",
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
	adapter,
});

async function main() {
	console.log("Adding test user profile...");

	const {
		data: { users },
		error,
	} = await supabase.auth.admin.listUsers();

	if (error) {
		console.error("Error fetching users:", error);
		return;
	}

	const testUser = users?.find((u) => u.email === "test@example.com");

	if (!testUser) {
		console.error("Test user not found");
		return;
	}

	console.log(`Found test user with ID: ${testUser.id}`);

	const existingProfile = await prisma.userProfile.findUnique({
		where: {
			userAuthId: testUser.id,
		},
	});

	if (existingProfile) {
		console.log("Profile already exists");
		return;
	}

	await prisma.userProfile.create({
		data: {
			userAuthId: testUser.id,
			lastName: "テスト",
			firstName: "太郎",
			nickname: "テストユーザー",
			birthday: new Date("1990-01-01"),
			gender: "male",
			prefecture: "静岡県",
		},
	});

	console.log("Profile created successfully!");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
		await pool.end();
	});
