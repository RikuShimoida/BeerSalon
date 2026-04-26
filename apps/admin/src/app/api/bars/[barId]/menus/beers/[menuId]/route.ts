import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/bars/:barId/menus/beers/:menuId - ビールメニュー詳細取得
export async function GET(
	request: NextRequest,
	context: { params: Promise<{ barId: string; menuId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId, menuId } = await context.params;

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

		// ビールメニュー詳細取得
		const { data: menu, error } = await supabaseAdmin
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
			.eq("id", menuId)
			.eq("bar_id", barId)
			.single();

		if (error || !menu) {
			return NextResponse.json(
				{ error: "Beer menu not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(menu);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch beer menu" },
			{ status: 500 },
		);
	}
}

// PUT /api/bars/:barId/menus/beers/:menuId - ビールメニュー更新
export async function PUT(
	request: NextRequest,
	context: { params: Promise<{ barId: string; menuId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId, menuId } = await context.params;

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
		const { price, size, description, image_url, is_active } = body;

		// ビールメニュー更新
		const { data: menu, error } = await supabaseAdmin
			.from("bar_beer_menus")
			.update({
				price,
				size,
				description,
				image_url,
				is_active,
				updated_at: new Date().toISOString(),
			})
			.eq("id", menuId)
			.eq("bar_id", barId)
			.select()
			.single();

		if (error || !menu) {
			return NextResponse.json(
				{ error: "Failed to update beer menu" },
				{ status: 500 },
			);
		}

		return NextResponse.json(menu);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to update beer menu" },
			{ status: 500 },
		);
	}
}

// DELETE /api/bars/:barId/menus/beers/:menuId - ビールメニュー削除
export async function DELETE(
	request: NextRequest,
	context: { params: Promise<{ barId: string; menuId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId, menuId } = await context.params;

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

		// ビールメニュー削除（物理削除）
		const { error } = await supabaseAdmin
			.from("bar_beer_menus")
			.delete()
			.eq("id", menuId)
			.eq("bar_id", barId);

		if (error) {
			return NextResponse.json(
				{ error: "Failed to delete beer menu" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to delete beer menu" },
			{ status: 500 },
		);
	}
}
