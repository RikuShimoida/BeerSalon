import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/bars/:barId/menus/beers - ビールメニュー一覧取得
export async function GET(
	request: NextRequest,
	context: { params: Promise<{ barId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId } = await context.params;

		// 権限チェック: バーオーナーの場合は自分のバーのみ
		if (user.role === "bar_owner") {
			const { data: barOwner } = await supabaseAdmin
				.from("bar_owners")
				.select("bar_id")
				.eq("admin_user_id", user.id)
				.eq("bar_id", barId)
				.single();

			if (!barOwner) {
				return NextResponse.json({ error: "Forbidden" }, { status: 403 });
			}
		}

		// ビールメニュー一覧取得（ビール情報、カテゴリ、ブルワリーをJOIN）
		const { data: menus, error } = await supabaseAdmin
			.from("bar_beer_menus")
			.select(`
        *,
        beer:beers (
          *,
          category:beer_categories (*),
          brewery:breweries (*),
          region:regions (*)
        )
      `)
			.eq("bar_id", barId)
			.order("created_at", { ascending: false });

		if (error) {
			return NextResponse.json(
				{ error: "Failed to fetch beer menus" },
				{ status: 500 },
			);
		}

		return NextResponse.json(menus);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch beer menus" },
			{ status: 500 },
		);
	}
}

// POST /api/bars/:barId/menus/beers - ビールメニュー追加
export async function POST(
	request: NextRequest,
	context: { params: Promise<{ barId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId } = await context.params;

		// 権限チェック: バーオーナーの場合は自分のバーのみ
		if (user.role === "bar_owner") {
			const { data: barOwner } = await supabaseAdmin
				.from("bar_owners")
				.select("bar_id")
				.eq("admin_user_id", user.id)
				.eq("bar_id", barId)
				.single();

			if (!barOwner) {
				return NextResponse.json({ error: "Forbidden" }, { status: 403 });
			}
		}

		const body = await request.json();
		const { beer_id, price, size, description, image_url, is_active } = body;

		// バリデーション
		if (!beer_id) {
			return NextResponse.json(
				{ error: "ビールを選択してください" },
				{ status: 400 },
			);
		}

		// ビールメニュー作成
		const { data: menu, error } = await supabaseAdmin
			.from("bar_beer_menus")
			.insert({
				bar_id: Number(barId),
				beer_id,
				price,
				size,
				description,
				image_url,
				is_active: is_active ?? true,
			})
			.select()
			.single();

		if (error) {
			// 重複エラーのハンドリング
			if (error.code === "23505") {
				return NextResponse.json(
					{ error: "このビールは既にメニューに登録されています" },
					{ status: 400 },
				);
			}

			return NextResponse.json(
				{ error: "Failed to create beer menu" },
				{ status: 500 },
			);
		}

		return NextResponse.json(menu, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to create beer menu" },
			{ status: 500 },
		);
	}
}
