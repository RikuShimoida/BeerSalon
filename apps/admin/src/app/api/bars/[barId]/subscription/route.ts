import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ barId: string }> },
) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { barId } = await params;

	const { data: subscription, error } = await supabaseAdmin
		.from("bar_subscriptions")
		.select(`
      *,
      subscription_plans (*)
    `)
		.eq("bar_id", barId)
		.eq("status", "active")
		.single();

	if (error && error.code !== "PGRST116") {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ subscription: subscription || null });
}
