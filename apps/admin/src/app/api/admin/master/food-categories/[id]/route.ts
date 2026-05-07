import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = await params;
	const { data: category, error } = await supabaseAdmin
		.from("master_food_categories")
		.select("*")
		.eq("id", id)
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ category });
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getCurrentUser();
	if (!user || user.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const { id } = await params;
	const body = await request.json();
	const { name, description, is_active } = body;

	const { data: category, error } = await supabaseAdmin
		.from("master_food_categories")
		.update({ name, description, is_active })
		.eq("id", id)
		.select()
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ category });
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getCurrentUser();
	if (!user || user.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const { id } = await params;
	const { error } = await supabaseAdmin
		.from("master_food_categories")
		.delete()
		.eq("id", id);

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ success: true });
}
