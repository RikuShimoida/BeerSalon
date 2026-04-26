import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { BarFoodMenu } from "@/types/database";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ barId: string; menuId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId, menuId } = await params;

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
	} catch (error) {
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

		const { barId, menuId } = await params;
		const body = await request.json();

		const { name, price, description, image_url, category, is_active } = body;

		if (!name) {
			return NextResponse.json({ error: "Name is required" }, { status: 400 });
		}

		const updatedMenu: Partial<BarFoodMenu> = {
			name,
			price: price || null,
			description: description || null,
			image_url: image_url || null,
			category: category || null,
			is_active: is_active !== undefined ? is_active : true,
		};

		const { data, error } = await supabaseAdmin
			.from("bar_food_menus")
			.update(updatedMenu)
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
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ barId: string; menuId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId, menuId } = await params;

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
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
