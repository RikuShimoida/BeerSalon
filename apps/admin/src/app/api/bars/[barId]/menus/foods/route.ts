import { type NextRequest, NextResponse } from "next/server";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ barId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId } = await params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { data: menus, error } = await supabaseAdmin
			.from("bar_food_menus")
			.select("*")
			.eq("bar_id", barId)
			.order("name", { ascending: true });

		if (error) {
			return NextResponse.json(
				{ error: "Failed to fetch food menus" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ menus });
	} catch (_error) {
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

		if (user.role !== "bar_owner") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { barId } = await params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const body = await request.json();
		const { name, description, image_url } = body;

		if (!name) {
			return NextResponse.json(
				{ error: "メニュー名を入力してください" },
				{ status: 400 },
			);
		}

		const { data, error } = await supabaseAdmin
			.from("bar_food_menus")
			.insert({
				bar_id: Number(barId),
				name,
				description: description || null,
				image_url: image_url || null,
			})
			.select()
			.single();

		if (error) {
			return NextResponse.json(
				{ error: "Failed to create food menu" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ menu: data }, { status: 201 });
	} catch (_error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
