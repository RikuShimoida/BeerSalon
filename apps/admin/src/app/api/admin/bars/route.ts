import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
	const user = await getCurrentUser();
	if (!user || user.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const { data: bars, error } = await supabaseAdmin
		.from("bars")
		.select(`
      *,
      bar_owners (
        admin_user_id,
        admin_users (
          id,
          email,
          name
        )
      )
    `)
		.order("created_at", { ascending: false });

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ bars });
}
