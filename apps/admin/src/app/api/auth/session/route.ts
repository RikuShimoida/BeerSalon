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

		return NextResponse.json({ user });
	} catch (_error) {
		return NextResponse.json(
			{ error: "セッション情報の取得に失敗しました" },
			{ status: 500 },
		);
	}
}
