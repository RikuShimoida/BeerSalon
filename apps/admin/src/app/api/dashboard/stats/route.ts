import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "認証されていません" },
				{ status: 401 },
			);
		}

		// 統計情報を取得（現在はダミーデータ）
		// 実際のデータベースからの取得は各テーブル実装後に実装

		const stats = {
			barsCount: 0,
			articlesCount: 0,
			activeCouponsCount: 0,
			monthlyViews: 0,
		};

		if (user.role === "bar_owner" && user.barId) {
			// TODO: user.barId を使って各テーブルから統計情報を集計
		}

		// 管理者の場合は全体の統計
		if (user.role === "admin") {
			// TODO: 全体の統計情報を集計
		}

		return NextResponse.json(stats);
	} catch (error) {
		return NextResponse.json(
			{ error: "統計情報の取得に失敗しました" },
			{ status: 500 },
		);
	}
}
