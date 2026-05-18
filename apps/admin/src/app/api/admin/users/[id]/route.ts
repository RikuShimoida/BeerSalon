import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getCurrentUser();
	if (!user || user.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const { id } = await params;
	const { data: targetUser, error } = await supabaseAdmin
		.from("admin_users")
		.select(`
      id,
      bar_manage_id,
      name,
      role,
      bar_id,
      contact_email,
      contact_phone,
      is_active,
      created_at,
      updated_at
    `)
		.eq("id", id)
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ user: targetUser });
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
	const { barManageId, password, name, role, is_active } = body;

	const updateData: Record<string, string | boolean> = {
		bar_manage_id: barManageId,
		name,
		role,
		is_active,
	};

	if (password) {
		updateData.password_hash = await bcrypt.hash(password, 10);
	}

	const { data: updatedUser, error } = await supabaseAdmin
		.from("admin_users")
		.update(updateData)
		.eq("id", id)
		.select(
			"id, bar_manage_id, name, role, bar_id, is_active, created_at, updated_at",
		)
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ user: updatedUser });
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

	if (id === user.id) {
		return NextResponse.json(
			{ error: "Cannot delete yourself" },
			{ status: 400 },
		);
	}

	const { error } = await supabaseAdmin
		.from("admin_users")
		.delete()
		.eq("id", id);

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ success: true });
}
