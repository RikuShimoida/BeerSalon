import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/master/beers - ビールマスタ一覧取得（検索・フィルタ付き）
export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const search = searchParams.get("search") || "";
		const categoryId = searchParams.get("category_id");
		const breweryId = searchParams.get("brewery_id");

		// ビール一覧取得（カテゴリ、ブルワリー、地域をJOIN）
		let query = supabaseAdmin
			.from("beers")
			.select(`
        *,
        category:beer_categories (*),
        brewery:breweries (*),
        region:regions (*)
      `)
			.eq("is_active", true);

		// 検索フィルタ
		if (search) {
			query = query.ilike("name", `%${search}%`);
		}

		// カテゴリフィルタ
		if (categoryId) {
			query = query.eq("beer_category_id", categoryId);
		}

		// ブルワリーフィルタ
		if (breweryId) {
			query = query.eq("brewery_id", breweryId);
		}

		const { data: beers, error } = await query.order("name", {
			ascending: true,
		});

		if (error) {
			return NextResponse.json(
				{ error: "Failed to fetch beers" },
				{ status: 500 },
			);
		}

		return NextResponse.json(beers);
	} catch (_error) {
		return NextResponse.json(
			{ error: "Failed to fetch beers" },
			{ status: 500 },
		);
	}
}
