import { type NextRequest, NextResponse } from "next/server";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ barId: string; menuId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId, menuId } = await context.params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { data: menu, error } = await supabaseAdmin
			.from("bar_beer_menus")
			.select(`
				*,
				beer:beers (
					*,
					category:beer_categories (*),
					brewery:breweries (*),
					region:regions (*)
				),
				sizes:bar_beer_menu_sizes (*)
			`)
			.eq("id", menuId)
			.eq("bar_id", barId)
			.single();

		if (error || !menu) {
			return NextResponse.json(
				{ error: "Beer menu not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json(menu);
	} catch (_error) {
		return NextResponse.json(
			{ error: "Failed to fetch beer menu" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	context: { params: Promise<{ barId: string; menuId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.role !== "bar_owner") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { barId, menuId } = await context.params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const body = await request.json();
		const { description, image_url, is_active } = body;

		const { data: menu, error } = await supabaseAdmin
			.from("bar_beer_menus")
			.update({
				description,
				image_url,
				is_active,
				updated_at: new Date().toISOString(),
			})
			.eq("id", menuId)
			.eq("bar_id", barId)
			.select()
			.single();

		if (error || !menu) {
			return NextResponse.json(
				{ error: "Failed to update beer menu" },
				{ status: 500 },
			);
		}

		return NextResponse.json(menu);
	} catch (_error) {
		return NextResponse.json(
			{ error: "Failed to update beer menu" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	context: { params: Promise<{ barId: string; menuId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.role !== "bar_owner") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { barId, menuId } = await context.params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { error } = await supabaseAdmin
			.from("bar_beer_menus")
			.delete()
			.eq("id", menuId)
			.eq("bar_id", barId);

		if (error) {
			return NextResponse.json(
				{ error: "Failed to delete beer menu" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (_error) {
		return NextResponse.json(
			{ error: "Failed to delete beer menu" },
			{ status: 500 },
		);
	}
}
