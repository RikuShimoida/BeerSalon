import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "認証されていません" },
				{ status: 401 },
			);
		}

		// 最近の活動を取得（現在はダミーデータ）
		// 実際のデータベースからの取得は各テーブル実装後に実装

		const activities = [
			{
				id: "1",
				type: "article",
				title: "記事「新着ビール入荷」を公開",
				date: "2025-02-05",
			},
			{
				id: "2",
				type: "coupon",
				title: "クーポン「初回20%オフ」を発行",
				date: "2025-02-03",
			},
			{
				id: "3",
				type: "menu",
				title: "ビールメニュー「IPAセット」を追加",
				date: "2025-02-01",
			},
		];

		return NextResponse.json(activities);
	} catch (error) {
		return NextResponse.json(
			{ error: "活動履歴の取得に失敗しました" },
			{ status: 500 },
		);
	}
}
