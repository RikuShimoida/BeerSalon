import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
	const body = await request.text();
	const signature = request.headers.get("stripe-signature");

	if (!signature) {
		return NextResponse.json({ error: "No signature" }, { status: 400 });
	}

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(
			body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET ?? "",
		);
	} catch (err) {
		console.error("Webhook signature verification failed:", err);
		return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
	}

	try {
		switch (event.type) {
			case "customer.subscription.created":
			case "customer.subscription.updated": {
				const subscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionUpdate(subscription);
				break;
			}

			case "customer.subscription.deleted": {
				const subscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionCanceled(subscription);
				break;
			}

			case "invoice.paid": {
				const invoice = event.data.object as Stripe.Invoice;
				await handleInvoicePaid(invoice);
				break;
			}

			case "invoice.payment_failed": {
				const invoice = event.data.object as Stripe.Invoice;
				await handleInvoicePaymentFailed(invoice);
				break;
			}

			default:
				console.log(`Unhandled event type: ${event.type}`);
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error("Webhook handler error:", error);
		return NextResponse.json(
			{ error: "Webhook handler failed" },
			{ status: 500 },
		);
	}
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
	const customerId = subscription.customer as string;
	const subscriptionId = subscription.id;

	const { data: existingSub } = await supabaseAdmin
		.from("bar_subscriptions")
		.select("bar_id")
		.eq("stripe_subscription_id", subscriptionId)
		.maybeSingle();

	const sub = subscription as unknown as {
		status: string;
		current_period_start: number;
		current_period_end: number;
		cancel_at_period_end: boolean;
		canceled_at: number | null;
		metadata: Record<string, string> | null;
	};

	const status = sub.status as
		| "active"
		| "canceled"
		| "past_due"
		| "trialing"
		| "incomplete";
	const currentPeriodStart = new Date(
		sub.current_period_start * 1000,
	).toISOString();
	const currentPeriodEnd = new Date(
		sub.current_period_end * 1000,
	).toISOString();
	const cancelAtPeriodEnd = sub.cancel_at_period_end || false;
	const canceledAt = sub.canceled_at
		? new Date(sub.canceled_at * 1000).toISOString()
		: null;

	if (existingSub) {
		await supabaseAdmin
			.from("bar_subscriptions")
			.update({
				status,
				current_period_start: currentPeriodStart,
				current_period_end: currentPeriodEnd,
				cancel_at_period_end: cancelAtPeriodEnd,
				canceled_at: canceledAt,
			})
			.eq("stripe_subscription_id", subscriptionId);
		return;
	}

	// 初回サブスク（Checkout 経由）は既存行が無いため insert する。
	// bar_id / subscription_plan_id は Checkout で subscription_data.metadata に埋めた値を復元する。
	const barId = sub.metadata?.bar_id;
	const subscriptionPlanId = sub.metadata?.subscription_plan_id;

	// metadata を持たないサブスク（Portal 経由等）は紐付け先を特定できないため insert しない。
	if (!barId || !subscriptionPlanId) {
		console.warn(
			`bar_subscriptions insert をスキップ: metadata が不足 (subscription=${subscriptionId})`,
		);
		return;
	}

	// Why not: 素の insert だと、Stripe の at-least-once 配信で created が重複到達したり、
	//   select 後・insert 前に別配信が先に入ると stripe_subscription_id が重複した二重行になる。
	//   UNIQUE 制約 + upsert(onConflict) で一意行へ収束させる。
	const { error: upsertError } = await supabaseAdmin
		.from("bar_subscriptions")
		.upsert(
			{
				bar_id: Number(barId),
				subscription_plan_id: Number(subscriptionPlanId),
				stripe_customer_id: customerId,
				stripe_subscription_id: subscriptionId,
				status,
				current_period_start: currentPeriodStart,
				current_period_end: currentPeriodEnd,
				cancel_at_period_end: cancelAtPeriodEnd,
				canceled_at: canceledAt,
			},
			{ onConflict: "stripe_subscription_id" },
		);

	// Why not: bar_id 部分ユニークインデックス違反（23505）で throw すると webhook が 500 を返し、
	//   Stripe が同じイベントを無限リトライする。二重サブスク（別 subscription で同一店舗が有効）は
	//   運用で解約対応すべき異常状態のため、エラーログを残して 200 で受理しリトライを止める。
	if (upsertError && upsertError.code !== "23505") {
		throw new Error(upsertError.message);
	}
	if (upsertError?.code === "23505") {
		console.error(
			`bar_subscriptions 二重サブスク検知（bar_id=${barId} に別の有効サブスクが存在）: subscription=${subscriptionId}`,
		);
	}
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
	const subscriptionId = subscription.id;

	await supabaseAdmin
		.from("bar_subscriptions")
		.update({
			status: "canceled",
			canceled_at: new Date().toISOString(),
		})
		.eq("stripe_subscription_id", subscriptionId);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
	const inv = invoice as unknown as {
		id: string;
		subscription: string | null;
		amount_paid: number;
		amount_due: number;
		currency: string;
		invoice_pdf: string | null;
		status_transitions: { paid_at: number | null };
	};

	const subscriptionId = inv.subscription;

	if (!subscriptionId) return;

	const { data: barSub } = await supabaseAdmin
		.from("bar_subscriptions")
		.select("bar_id, id")
		.eq("stripe_subscription_id", subscriptionId)
		.single();

	if (!barSub) return;

	await supabaseAdmin.from("invoices").insert({
		bar_id: barSub.bar_id,
		bar_subscription_id: barSub.id,
		stripe_invoice_id: inv.id,
		amount_paid: inv.amount_paid,
		amount_due: inv.amount_due,
		currency: inv.currency,
		status: "paid",
		invoice_pdf: inv.invoice_pdf,
		paid_at: inv.status_transitions.paid_at
			? new Date(inv.status_transitions.paid_at * 1000).toISOString()
			: null,
	});
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
	const inv = invoice as unknown as {
		subscription: string | null;
	};

	const subscriptionId = inv.subscription;

	if (!subscriptionId) return;

	await supabaseAdmin
		.from("bar_subscriptions")
		.update({ status: "past_due" })
		.eq("stripe_subscription_id", subscriptionId);
}
