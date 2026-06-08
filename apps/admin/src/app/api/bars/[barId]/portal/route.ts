import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser, canAccessBar } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";

export async function POST(
	request: NextRequest,
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

	const { data: subscription, error } = await supabaseAdmin
		.from("bar_subscriptions")
		.select("stripe_customer_id")
		.eq("bar_id", barId)
		.in("status", ["active", "trialing", "past_due"])
		.limit(1)
		.single();

	if (error || !subscription?.stripe_customer_id) {
		return NextResponse.json(
			{ error: "サブスクリプションが設定されていません" },
			{ status: 404 },
		);
	}

	try {
		const portalSession = await stripe.billingPortal.sessions.create({
			customer: subscription.stripe_customer_id,
			return_url: `${process.env.NEXT_PUBLIC_APP_URL}/bars/${barId}`,
		});

		return NextResponse.json({ url: portalSession.url });
	} catch (_e) {
		return NextResponse.json(
			{ error: "Stripe Customer Portalの作成に失敗しました" },
			{ status: 500 },
		);
	}
}
