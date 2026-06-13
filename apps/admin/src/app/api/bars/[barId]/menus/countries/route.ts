import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
	_request: NextRequest,
	_context: { params: Promise<{ barId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { data: countries, error } = await supabaseAdmin
			.from("countries")
			.select("*")
			.eq("is_active", true)
			.order("name", { ascending: true });

		if (error) {
			return NextResponse.json(
				{ error: "Failed to fetch countries" },
				{ status: 500 },
			);
		}

		return NextResponse.json(countries);
	} catch (_error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
