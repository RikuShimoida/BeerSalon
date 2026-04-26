import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { BarCoupon } from "@/types/database";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ barId: string; couponId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId, couponId } = await params;

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

		const { data: coupon, error } = await supabaseAdmin
			.from("bar_coupons")
			.select("*")
			.eq("id", couponId)
			.eq("bar_id", barId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Coupon not found" },
					{ status: 404 },
				);
			}
			console.error("Error fetching coupon:", error);
			return NextResponse.json(
				{ error: "Failed to fetch coupon" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ coupon });
	} catch (error) {
		console.error("Error in GET /api/bars/[barId]/coupons/[couponId]:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ barId: string; couponId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId, couponId } = await params;

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

		const updatedCoupon: Partial<BarCoupon> = {
			title,
			description: description || null,
			discount_type,
			discount_value: parseInt(discount_value),
			code: code || null,
			usage_limit: usage_limit ? parseInt(usage_limit) : null,
			valid_from: valid_from || null,
			valid_until: valid_until || null,
			is_active: is_active !== undefined ? is_active : true,
		};

		const { data, error } = await supabaseAdmin
			.from("bar_coupons")
			.update(updatedCoupon)
			.eq("id", couponId)
			.eq("bar_id", barId)
			.select()
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Coupon not found" },
					{ status: 404 },
				);
			}
			console.error("Error updating coupon:", error);
			return NextResponse.json(
				{ error: "Failed to update coupon" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ coupon: data });
	} catch (error) {
		console.error("Error in PUT /api/bars/[barId]/coupons/[couponId]:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ barId: string; couponId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId, couponId } = await params;

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

		const { error } = await supabaseAdmin
			.from("bar_coupons")
			.delete()
			.eq("id", couponId)
			.eq("bar_id", barId);

		if (error) {
			console.error("Error deleting coupon:", error);
			return NextResponse.json(
				{ error: "Failed to delete coupon" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error(
			"Error in DELETE /api/bars/[barId]/coupons/[couponId]:",
			error,
		);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
