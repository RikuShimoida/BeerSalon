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
	const _customerId = subscription.customer as string;
	const subscriptionId = subscription.id;

	const { data: existingSub } = await supabaseAdmin
		.from("bar_subscriptions")
		.select("bar_id")
		.eq("stripe_subscription_id", subscriptionId)
		.single();

	if (existingSub) {
		const sub = subscription as unknown as {
			status: string;
			current_period_start: number;
			current_period_end: number;
			cancel_at_period_end: boolean;
			canceled_at: number | null;
		};

		await supabaseAdmin
			.from("bar_subscriptions")
			.update({
				status: sub.status as
					| "active"
					| "canceled"
					| "past_due"
					| "trialing"
					| "incomplete",
				current_period_start: new Date(
					sub.current_period_start * 1000,
				).toISOString(),
				current_period_end: new Date(
					sub.current_period_end * 1000,
				).toISOString(),
				cancel_at_period_end: sub.cancel_at_period_end || false,
				canceled_at: sub.canceled_at
					? new Date(sub.canceled_at * 1000).toISOString()
					: null,
			})
			.eq("stripe_subscription_id", subscriptionId);
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
