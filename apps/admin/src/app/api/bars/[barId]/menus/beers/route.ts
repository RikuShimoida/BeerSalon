import { type NextRequest, NextResponse } from "next/server";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import { normalizeAbv } from "@/lib/beer-abv";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ barId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId } = await context.params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { data: menus, error } = await supabaseAdmin
			.from("bar_beer_menus")
			.select(`
				*,
				beer:beers (
					*,
					category:beer_categories (*),
					brewery:breweries (*),
					region:regions (*)
				),
				sizes:bar_beer_menu_sizes (*)
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
	} catch (_error) {
		return NextResponse.json(
			{ error: "Failed to fetch beer menus" },
			{ status: 500 },
		);
	}
}

export async function POST(
	request: NextRequest,
	context: { params: Promise<{ barId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.role !== "bar_owner") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { barId } = await context.params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const body = await request.json();
		const {
			name,
			beer_category_id,
			region_id,
			brewery_name,
			abv,
			sizes,
			description,
			image_url,
		} = body;

		if (!name) {
			return NextResponse.json(
				{ error: "メニュー名を入力してください" },
				{ status: 400 },
			);
		}

		if (!beer_category_id) {
			return NextResponse.json(
				{ error: "ビールカテゴリを選択してください" },
				{ status: 400 },
			);
		}

		const abvResult = normalizeAbv(abv);
		if (!abvResult.ok) {
			return NextResponse.json({ error: abvResult.error }, { status: 400 });
		}

		let breweryId: number | null = null;
		if (brewery_name) {
			const { data: existingBrewery } = await supabaseAdmin
				.from("breweries")
				.select("id")
				.eq("name", brewery_name)
				.single();

			if (existingBrewery) {
				breweryId = existingBrewery.id;
			} else {
				const { data: newBrewery, error: breweryError } = await supabaseAdmin
					.from("breweries")
					.insert({
						name: brewery_name,
						region_id: region_id || null,
					})
					.select("id")
					.single();

				if (breweryError) {
					return NextResponse.json(
						{ error: "醸造所の登録に失敗しました" },
						{ status: 500 },
					);
				}
				breweryId = newBrewery.id;
			}
		}

		const { data: beer, error: beerError } = await supabaseAdmin
			.from("beers")
			.insert({
				name,
				beer_category_id,
				brewery_id: breweryId,
				region_id: region_id || null,
				abv: abvResult.value,
				description,
				image_url,
			})
			.select("id")
			.single();

		if (beerError) {
			return NextResponse.json(
				{ error: "ビールの登録に失敗しました" },
				{ status: 500 },
			);
		}

		const { data: menu, error: menuError } = await supabaseAdmin
			.from("bar_beer_menus")
			.insert({
				bar_id: Number(barId),
				beer_id: beer.id,
				description,
				image_url,
			})
			.select("id")
			.single();

		if (menuError) {
			return NextResponse.json(
				{ error: "ビールメニューの登録に失敗しました" },
				{ status: 500 },
			);
		}

		if (sizes && Array.isArray(sizes) && sizes.length > 0) {
			const sizeRecords = sizes.map(
				(s: {
					size_name: string;
					price: number | null;
					sort_order: number;
				}) => ({
					bar_beer_menu_id: menu.id,
					size_name: s.size_name,
					price: s.price,
					sort_order: s.sort_order,
				}),
			);

			const { error: sizeError } = await supabaseAdmin
				.from("bar_beer_menu_sizes")
				.insert(sizeRecords);

			if (sizeError) {
				return NextResponse.json(
					{ error: "サイズ/価格の登録に失敗しました" },
					{ status: 500 },
				);
			}
		}

		return NextResponse.json({ id: menu.id }, { status: 201 });
	} catch (_error) {
		return NextResponse.json(
			{ error: "Failed to create beer menu" },
			{ status: 500 },
		);
	}
}
