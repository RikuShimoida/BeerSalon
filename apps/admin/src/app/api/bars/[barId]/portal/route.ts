import { type NextRequest, NextResponse } from "next/server";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import { resolveRequestOrigin } from "@/lib/request-origin";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

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
		.order("created_at", { ascending: false })
		.limit(1)
		.single();

	if (error || !subscription?.stripe_customer_id) {
		return NextResponse.json(
			{ error: "サブスクリプションが設定されていません" },
			{ status: 404 },
		);
	}

	// 支払い方法管理からの復帰も決済元のオリジンへ戻すため、
	// リクエストヘッダーからオリジンを解決する（Issue #528 課題2の横展開）。
	const baseUrl = resolveRequestOrigin(request);

	// Why not: baseUrl 未設定のまま Portal を作ると return_url が "undefined/bars/..." になり
	//   復帰先が壊れる。checkout と挙動を揃え、無言で壊すより 500 で早期に落とす。
	if (!baseUrl) {
		console.error(
			"Stripe Portal: リクエストオリジンを解決できませんでした（ヘッダー・環境変数とも未設定）",
		);
		return NextResponse.json(
			{ error: "Stripe Customer Portalの作成に失敗しました" },
			{ status: 500 },
		);
	}

	try {
		const portalSession = await stripe.billingPortal.sessions.create({
			customer: subscription.stripe_customer_id,
			return_url: `${baseUrl}/bars/${barId}`,
		});

		return NextResponse.json({ url: portalSession.url });
	} catch (e) {
		console.error("Stripe Portal Session作成エラー:", e);
		return NextResponse.json(
			{ error: "Stripe Customer Portalの作成に失敗しました" },
			{ status: 500 },
		);
	}
}
