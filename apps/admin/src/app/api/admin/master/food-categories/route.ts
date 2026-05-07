import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { data: categories, error } = await supabaseAdmin
		.from("master_food_categories")
		.select("*")
		.order("name", { ascending: true });

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
	const user = await getCurrentUser();
	if (!user || user.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const body = await request.json();
	const { name, description, is_active } = body;

	const { data: category, error } = await supabaseAdmin
		.from("master_food_categories")
		.insert({ name, description, is_active })
		.select()
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ category }, { status: 201 });
}
