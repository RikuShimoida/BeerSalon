import { type NextRequest, NextResponse } from "next/server";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ barId: string; menuId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId, menuId } = await params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { data: menu, error } = await supabaseAdmin
			.from("bar_food_menus")
			.select("*")
			.eq("id", menuId)
			.eq("bar_id", barId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Food menu not found" },
					{ status: 404 },
				);
			}
			return NextResponse.json(
				{ error: "Failed to fetch food menu" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ menu });
	} catch (_error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ barId: string; menuId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.role !== "bar_owner") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { barId, menuId } = await params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const body = await request.json();
		const { name, price, description, image_url } = body;

		if (!name) {
			return NextResponse.json(
				{ error: "メニュー名を入力してください" },
				{ status: 400 },
			);
		}

		const { data, error } = await supabaseAdmin
			.from("bar_food_menus")
			.update({
				name,
				price: price ?? null,
				description: description || null,
				image_url: image_url || null,
			})
			.eq("id", menuId)
			.eq("bar_id", barId)
			.select()
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Food menu not found" },
					{ status: 404 },
				);
			}
			return NextResponse.json(
				{ error: "Failed to update food menu" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ menu: data });
	} catch (_error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ barId: string; menuId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.role !== "bar_owner") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { barId, menuId } = await params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { error } = await supabaseAdmin
			.from("bar_food_menus")
			.delete()
			.eq("id", menuId)
			.eq("bar_id", barId);

		if (error) {
			return NextResponse.json(
				{ error: "Failed to delete food menu" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (_error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
