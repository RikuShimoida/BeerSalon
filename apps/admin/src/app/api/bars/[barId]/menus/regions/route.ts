import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
	request: NextRequest,
	_context: { params: Promise<{ barId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const countryId = searchParams.get("country_id");

		if (!countryId) {
			return NextResponse.json(
				{ error: "country_id is required" },
				{ status: 400 },
			);
		}

		const { data: regions, error } = await supabaseAdmin
			.from("regions")
			.select("*")
			.eq("country_id", countryId)
			.eq("is_active", true)
			.order("name", { ascending: true });

		if (error) {
			return NextResponse.json(
				{ error: "Failed to fetch regions" },
				{ status: 500 },
			);
		}

		return NextResponse.json(regions);
	} catch (_error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
