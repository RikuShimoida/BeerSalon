import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { BarFoodMenu } from "@/types/database";

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

		const { data: menus, error } = await supabaseAdmin
			.from("bar_food_menus")
			.select("*")
			.eq("bar_id", barId)
			.order("category", { ascending: true })
			.order("name", { ascending: true });

		if (error) {
			console.error("Error fetching food menus:", error);
			return NextResponse.json(
				{ error: "Failed to fetch food menus" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ menus });
	} catch (error) {
		console.error("Error in GET /api/bars/[barId]/menus/foods:", error);
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
		const body = await request.json();

		const { name, price, description, image_url, category, is_active } = body;

		if (!name) {
			return NextResponse.json({ error: "Name is required" }, { status: 400 });
		}

		const newMenu: Partial<BarFoodMenu> = {
			bar_id: parseInt(barId),
			name,
			price: price || null,
			description: description || null,
			image_url: image_url || null,
			category: category || null,
			is_active: is_active !== undefined ? is_active : true,
		};

		const { data, error } = await supabaseAdmin
			.from("bar_food_menus")
			.insert(newMenu)
			.select()
			.single();

		if (error) {
			console.error("Error creating food menu:", error);
			return NextResponse.json(
				{ error: "Failed to create food menu" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ menu: data }, { status: 201 });
	} catch (error) {
		console.error("Error in POST /api/bars/[barId]/menus/foods:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
