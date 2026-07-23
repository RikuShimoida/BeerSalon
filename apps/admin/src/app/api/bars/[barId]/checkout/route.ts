import { type NextRequest, NextResponse } from "next/server";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ barId: string }> },
) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { barId } = await params;

	if (!canAccessBar(user, barId)) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const { data: existingSub } = await supabaseAdmin
		.from("bar_subscriptions")
		.select("id")
		.eq("bar_id", barId)
		.in("status", ["active", "trialing", "past_due"])
		.limit(1)
		.maybeSingle();

	if (existingSub) {
		return NextResponse.json(
			{ error: "この店舗は既に課金が開始されています" },
			{ status: 409 },
		);
	}

	const { data: plan, error: planError } = await supabaseAdmin
		.from("subscription_plans")
		.select("id, stripe_price_id")
		.eq("is_active", true)
		.order("id", { ascending: true })
		.limit(1)
		.single();

	if (planError || !plan?.stripe_price_id) {
		return NextResponse.json(
			{ error: "課金プランが設定されていません" },
			{ status: 404 },
		);
	}

	const baseUrl = process.env.ADMIN_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;

	try {
		const checkoutSession = await stripe.checkout.sessions.create({
			mode: "subscription",
			line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
			// bar_id / subscription_plan_id は webhook 側で customer.subscription.created から
			// 「どの店舗のどのプランか」を復元して bar_subscriptions を insert するために必須。
			subscription_data: {
				metadata: {
					bar_id: String(barId),
					subscription_plan_id: String(plan.id),
				},
			},
			success_url: `${baseUrl}/bars/${barId}`,
			cancel_url: `${baseUrl}/bars/${barId}`,
		});

		if (!checkoutSession.url) {
			return NextResponse.json(
				{ error: "Stripe Checkoutの作成に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ url: checkoutSession.url });
	} catch (e) {
		console.error("Stripe Checkout Session作成エラー:", e);
		return NextResponse.json(
			{ error: "Stripe Checkoutの作成に失敗しました" },
			{ status: 500 },
		);
	}
}
