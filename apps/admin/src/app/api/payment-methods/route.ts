import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
	try {
		const { data: paymentMethods, error } = await supabaseAdmin
			.from("payment_methods")
			.select("id, name, display_order")
			.eq("is_active", true)
			.order("display_order", { ascending: true });

		if (error) {
			return NextResponse.json(
				{ error: "支払い方法の取得に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json(paymentMethods || []);
	} catch (error) {
		return NextResponse.json(
			{ error: "支払い方法の取得に失敗しました" },
			{ status: 500 },
		);
	}
}
