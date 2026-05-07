import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { BarCoupon } from "@/types/database";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ barId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId } = await params;

		// 権限チェック: バーオーナーの場合は自分のバーのみ
		if (user.role === "bar_owner") {
			const { data: barOwner } = await supabaseAdmin
				.from("bar_owners")
				.select("bar_id")
				.eq("admin_user_id", user.id)
				.eq("bar_id", barId)
				.single();

			if (!barOwner) {
				return NextResponse.json({ error: "Forbidden" }, { status: 403 });
			}
		}

		const { data: coupons, error } = await supabaseAdmin
			.from("bar_coupons")
			.select("*")
			.eq("bar_id", barId)
			.order("created_at", { ascending: false });

		if (error) {
			return NextResponse.json(
				{ error: "Failed to fetch coupons" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ coupons });
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ barId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId } = await params;

		// 権限チェック: バーオーナーの場合は自分のバーのみ
		if (user.role === "bar_owner") {
			const { data: barOwner } = await supabaseAdmin
				.from("bar_owners")
				.select("bar_id")
				.eq("admin_user_id", user.id)
				.eq("bar_id", barId)
				.single();

			if (!barOwner) {
				return NextResponse.json({ error: "Forbidden" }, { status: 403 });
			}
		}

		const body = await request.json();

		const {
			title,
			description,
			discount_type,
			discount_value,
			code,
			usage_limit,
			valid_from,
			valid_until,
			is_active,
		} = body;

		if (!title || !discount_type || discount_value === undefined) {
			return NextResponse.json(
				{ error: "Title, discount type, and discount value are required" },
				{ status: 400 },
			);
		}

		const newCoupon: Partial<BarCoupon> = {
			bar_id: parseInt(barId),
			title,
			description: description || null,
			discount_type,
			discount_value: parseInt(discount_value),
			code: code || null,
			usage_limit: usage_limit ? parseInt(usage_limit) : null,
			used_count: 0,
			valid_from: valid_from || null,
			valid_until: valid_until || null,
			is_active: is_active !== undefined ? is_active : true,
		};

		const { data, error } = await supabaseAdmin
			.from("bar_coupons")
			.insert(newCoupon)
			.select()
			.single();

		if (error) {
			return NextResponse.json(
				{ error: "Failed to create coupon" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ coupon: data }, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
