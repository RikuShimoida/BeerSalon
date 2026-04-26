import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
	console.log("Creating follow test data...");

	const testUser1Email = "test@example.com";
	const testUser2Email = "test2@example.com";
	const testUser3Email = "test3@example.com";

	const {
		data: { users },
		error: listError,
	} = await supabase.auth.admin.listUsers();

	if (listError) {
		console.error("Error listing users:", listError);
		throw listError;
	}

	let testUser1 = users?.find((u) => u.email === testUser1Email);
	let testUser2 = users?.find((u) => u.email === testUser2Email);
	let testUser3 = users?.find((u) => u.email === testUser3Email);

	if (!testUser1) {
		console.log("Creating test user 1...");
		const { data: newUser1, error: error1 } =
			await supabase.auth.admin.createUser({
				email: testUser1Email,
				password: "password123",
				email_confirm: true,
			});
		if (error1) throw error1;
		testUser1 = newUser1.user;
	}

	if (!testUser2) {
		console.log("Creating test user 2...");
		const { data: newUser2, error: error2 } =
			await supabase.auth.admin.createUser({
				email: testUser2Email,
				password: "password123",
				email_confirm: true,
			});
		if (error2) throw error2;
		testUser2 = newUser2.user;
	}

	if (!testUser3) {
		console.log("Creating test user 3...");
		const { data: newUser3, error: error3 } =
			await supabase.auth.admin.createUser({
				email: testUser3Email,
				password: "password123",
				email_confirm: true,
			});
		if (error3) throw error3;
		testUser3 = newUser3.user;
	}

	if (!testUser1 || !testUser2 || !testUser3) {
		throw new Error("Failed to create test users");
	}

	let profile1 = await prisma.userProfile.findUnique({
		where: { userAuthId: testUser1.id },
	});

	if (!profile1) {
		console.log("Creating profile for test user 1...");
		profile1 = await prisma.userProfile.create({
			data: {
				userAuthId: testUser1.id,
				lastName: "テスト",
				firstName: "太郎",
				nickname: "テストユーザー1",
				birthday: new Date("1990-01-01"),
				gender: "male",
				prefecture: "静岡県",
			},
		});
	}

	let profile2 = await prisma.userProfile.findUnique({
		where: { userAuthId: testUser2.id },
	});

	if (!profile2) {
		console.log("Creating profile for test user 2...");
		profile2 = await prisma.userProfile.create({
			data: {
				userAuthId: testUser2.id,
				lastName: "サンプル",
				firstName: "花子",
				nickname: "テストユーザー2",
				birthday: new Date("1992-05-15"),
				gender: "female",
				prefecture: "東京都",
			},
		});
	}

	let profile3 = await prisma.userProfile.findUnique({
		where: { userAuthId: testUser3.id },
	});

	if (!profile3) {
		console.log("Creating profile for test user 3...");
		profile3 = await prisma.userProfile.create({
			data: {
				userAuthId: testUser3.id,
				lastName: "例",
				firstName: "次郎",
				nickname: "テストユーザー3",
				birthday: new Date("1988-12-25"),
				gender: "male",
				prefecture: "大阪府",
			},
		});
	}

	const existingFollow1 = await prisma.userFollowRelation.findFirst({
		where: {
			followerId: profile1.id,
			followeeId: profile2.id,
		},
	});

	if (!existingFollow1) {
		console.log("Creating follow relation: User1 -> User2...");
		await prisma.userFollowRelation.create({
			data: {
				followerId: profile1.id,
				followeeId: profile2.id,
			},
		});
	}

	const existingFollow2 = await prisma.userFollowRelation.findFirst({
		where: {
			followerId: profile1.id,
			followeeId: profile3.id,
		},
	});

	if (!existingFollow2) {
		console.log("Creating follow relation: User1 -> User3...");
		await prisma.userFollowRelation.create({
			data: {
				followerId: profile1.id,
				followeeId: profile3.id,
			},
		});
	}

	console.log("Follow test data created successfully!");
	console.log(`Test user 1 (${testUser1Email}) follows 2 users`);
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
