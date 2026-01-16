import { createClient } from "@supabase/supabase-js";
import { prisma } from "../src/lib/prisma";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

async function clearAllUsers() {
	console.log("ユーザーデータのクリアを開始します...");

	// 1. Prismaからuser_profilesを削除
	const deletedProfiles = await prisma.userProfile.deleteMany({});
	console.log(
		`✓ ${deletedProfiles.count}件のユーザープロフィールを削除しました`,
	);

	// 2. Supabase Authからユーザーを削除
	const {
		data: { users },
		error: listError,
	} = await supabase.auth.admin.listUsers();

	if (listError) {
		console.error("ユーザー一覧の取得に失敗:", listError);
		return;
	}

	console.log(`${users.length}件のAuthユーザーを削除します...`);

	for (const user of users) {
		const { error: deleteError } = await supabase.auth.admin.deleteUser(
			user.id,
		);
		if (deleteError) {
			console.error(`ユーザー ${user.email} の削除に失敗:`, deleteError);
		} else {
			console.log(`✓ ${user.email} を削除しました`);
		}
	}

	console.log("すべてのユーザーデータをクリアしました");
}

clearAllUsers()
	.catch((error) => {
		console.error("エラーが発生しました:", error);
		process.exit(1);
	})
	.finally(() => {
		prisma.$disconnect();
	});
