import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/bars/[barId]/approve - セルフサーブ登録された店舗を admin が承認する
// 承認で admin_users.approval_status を 'approved' にし（ログイン可能化）、bars.is_active を true にする（公開化）。
export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ barId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "認証されていません" },
				{ status: 401 },
			);
		}

		if (user.role !== "admin") {
			return NextResponse.json({ error: "権限がありません" }, { status: 403 });
		}

		const { barId } = await params;
		const barIdNum = Number(barId);
		if (!Number.isInteger(barIdNum) || barIdNum <= 0) {
			return NextResponse.json({ error: "店舗IDが不正です" }, { status: 400 });
		}

		const { data: adminUser, error: adminUserError } = await supabaseAdmin
			.from("admin_users")
			.select("id, approval_status")
			.eq("bar_id", barIdNum)
			.eq("role", "bar_owner")
			.maybeSingle();

		if (adminUserError || !adminUser) {
			return NextResponse.json(
				{ error: "承認対象の店舗アカウントが見つかりません" },
				{ status: 404 },
			);
		}

		const { error: updateAdminError } = await supabaseAdmin
			.from("admin_users")
			.update({
				approval_status: "approved",
				updated_at: new Date().toISOString(),
			})
			.eq("id", adminUser.id);

		if (updateAdminError) {
			return NextResponse.json(
				{ error: "承認に失敗しました" },
				{ status: 500 },
			);
		}

		const { error: updateBarError } = await supabaseAdmin
			.from("bars")
			.update({ is_active: true, updated_at: new Date().toISOString() })
			.eq("id", barIdNum);

		if (updateBarError) {
			return NextResponse.json(
				{ error: "店舗の公開に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ barId: barIdNum, approvalStatus: "approved" });
	} catch (_error) {
		return NextResponse.json({ error: "承認に失敗しました" }, { status: 500 });
	}
}
