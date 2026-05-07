import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/master/beer-categories - ビールカテゴリ一覧取得
export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { data: categories, error } = await supabaseAdmin
			.from("beer_categories")
			.select("*")
			.eq("is_active", true)
			.order("name", { ascending: true });

		if (error) {
			return NextResponse.json(
				{ error: "Failed to fetch beer categories" },
				{ status: 500 },
			);
		}

		return NextResponse.json(categories);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch beer categories" },
			{ status: 500 },
		);
	}
}
