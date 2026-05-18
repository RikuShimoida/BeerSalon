import { type NextRequest, NextResponse } from "next/server";
import { createToken, setAuthCookie, verifyPassword } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { AdminUser } from "@/types/database";

export async function POST(request: NextRequest) {
	try {
		const { barManageId, password } = await request.json();

		if (!barManageId || !password) {
			return NextResponse.json({ error: "入力してください" }, { status: 400 });
		}

		const { data: user, error } = await supabaseAdmin
			.from("admin_users")
			.select("*")
			.eq("bar_manage_id", barManageId)
			.eq("is_active", true)
			.single<AdminUser>();

		if (error || !user) {
			return NextResponse.json(
				{ error: "店舗IDまたはパスワードが正しくありません" },
				{ status: 401 },
			);
		}

		const isValid = await verifyPassword(password, user.password_hash);
		if (!isValid) {
			return NextResponse.json(
				{ error: "店舗IDまたはパスワードが正しくありません" },
				{ status: 401 },
			);
		}

		const token = await createToken(user);

		await setAuthCookie(token);

		return NextResponse.json({
			user: {
				id: user.id,
				barManageId: user.bar_manage_id,
				name: user.name,
				role: user.role,
				barId: user.bar_id,
			},
		});
	} catch (_error) {
		return NextResponse.json(
			{ error: "ログインに失敗しました" },
			{ status: 500 },
		);
	}
}
