import { type NextRequest, NextResponse } from "next/server";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import { normalizeAbv } from "@/lib/beer-abv";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ barId: string; menuId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId, menuId } = await context.params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { data: menu, error } = await supabaseAdmin
			.from("bar_beer_menus")
			.select(`
				*,
				beer:beers (
					*,
					category:beer_categories (*),
					brewery:breweries (*),
					region:regions (
						*,
						country:countries (*)
					)
				),
				sizes:bar_beer_menu_sizes (*)
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
	} catch (_error) {
		return NextResponse.json(
			{ error: "Failed to fetch beer menu" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	context: { params: Promise<{ barId: string; menuId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.role !== "bar_owner") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { barId, menuId } = await context.params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const body = await request.json();
		const { description, image_url, is_active, abv, sizes } = body;

		const abvResult = normalizeAbv(abv);
		if (!abvResult.ok) {
			return NextResponse.json({ error: abvResult.error }, { status: 400 });
		}

		const { data: menu, error } = await supabaseAdmin
			.from("bar_beer_menus")
			.update({
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

		// abv は beers（ビールマスタ）側のカラム。bar_beer_menus 更新後、
		// 紐づく beers レコードのアルコール度数を同期更新する。
		if (abv !== undefined && menu.beer_id) {
			const { error: beerError } = await supabaseAdmin
				.from("beers")
				.update({
					abv: abvResult.value,
					updated_at: new Date().toISOString(),
				})
				.eq("id", menu.beer_id);

			if (beerError) {
				return NextResponse.json(
					{ error: "アルコール度数の更新に失敗しました" },
					{ status: 500 },
				);
			}
		}

		if (sizes && Array.isArray(sizes)) {
			const { error: deleteError } = await supabaseAdmin
				.from("bar_beer_menu_sizes")
				.delete()
				.eq("bar_beer_menu_id", menuId);

			if (deleteError) {
				return NextResponse.json(
					{ error: "サイズ/価格の更新に失敗しました" },
					{ status: 500 },
				);
			}

			if (sizes.length > 0) {
				const sizeRecords = sizes.map(
					(s: {
						size_name: string;
						price: number | null;
						sort_order: number;
					}) => ({
						bar_beer_menu_id: Number(menuId),
						size_name: s.size_name,
						price: s.price,
						sort_order: s.sort_order,
					}),
				);

				const { error: insertError } = await supabaseAdmin
					.from("bar_beer_menu_sizes")
					.insert(sizeRecords);

				if (insertError) {
					return NextResponse.json(
						{ error: "サイズ/価格の更新に失敗しました" },
						{ status: 500 },
					);
				}
			}
		}

		return NextResponse.json(menu);
	} catch (_error) {
		return NextResponse.json(
			{ error: "Failed to update beer menu" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	context: { params: Promise<{ barId: string; menuId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.role !== "bar_owner") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { barId, menuId } = await context.params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

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
	} catch (_error) {
		return NextResponse.json(
			{ error: "Failed to delete beer menu" },
			{ status: 500 },
		);
	}
}
