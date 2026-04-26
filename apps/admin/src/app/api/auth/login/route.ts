import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";
import { AdminUser } from "@/types/database";

export async function POST(request: NextRequest) {
	try {
		const { email, password } = await request.json();

		// バリデーション
		if (!email || !password) {
			return NextResponse.json({ error: "入力してください" }, { status: 400 });
		}

		// メールアドレスでユーザーを検索
		const { data: user, error } = await supabaseAdmin
			.from("admin_users")
			.select("*")
			.eq("email", email)
			.eq("is_active", true)
			.single<AdminUser>();

		if (error) {
		}

		if (error || !user) {
			return NextResponse.json(
				{ error: "メールアドレスまたはパスワードが正しくありません" },
				{ status: 401 },
			);
		}

		// パスワード検証
		const isValid = await verifyPassword(password, user.password_hash);
		if (!isValid) {
			return NextResponse.json(
				{ error: "メールアドレスまたはパスワードが正しくありません" },
				{ status: 401 },
			);
		}

		// JWTトークン作成
		const token = await createToken(user);

		// クッキーにトークンを保存
		await setAuthCookie(token);

		return NextResponse.json({
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
			},
		});
	} catch (error) {
		return NextResponse.json(
			{ error: "ログインに失敗しました" },
			{ status: 500 },
		);
	}
}
