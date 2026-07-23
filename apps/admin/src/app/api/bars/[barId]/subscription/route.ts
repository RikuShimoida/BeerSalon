import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ barId: string }> },
) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { barId } = await params;

	// Why not: status を "active" だけで見ると、checkout の 409 ガード（active/trialing/past_due）と
	//   条件がズレ、trialing/past_due の店舗で「課金を開始する」が出るのに押すと 409 で詰む。
	//   課金導線の出し分けを 409 と一致させるため同じ status 集合で判定する。
	const { data: subscription, error } = await supabaseAdmin
		.from("bar_subscriptions")
		.select(`
      *,
      subscription_plans (*)
    `)
		.eq("bar_id", barId)
		.in("status", ["active", "trialing", "past_due"])
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error && error.code !== "PGRST116") {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ subscription: subscription || null });
}
