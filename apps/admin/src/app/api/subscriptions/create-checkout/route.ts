import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { barId, priceId } = await request.json();

	const { data: bar } = await supabaseAdmin
		.from("bars")
		.select("id, name")
		.eq("id", barId)
		.single();

	if (!bar) {
		return NextResponse.json({ error: "Bar not found" }, { status: 404 });
	}

	try {
		const session = await stripe.checkout.sessions.create({
			mode: "subscription",
			line_items: [
				{
					price: priceId,
					quantity: 1,
				},
			],
			success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
			cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
			metadata: {
				bar_id: barId.toString(),
				user_id: user.id,
			},
		});

		return NextResponse.json({ url: session.url });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to create checkout session" },
			{ status: 500 },
		);
	}
}
