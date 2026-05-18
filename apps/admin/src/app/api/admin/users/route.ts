import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
	const user = await getCurrentUser();
	if (!user || user.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const { data: users, error } = await supabaseAdmin
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
		.order("created_at", { ascending: false });

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
	const user = await getCurrentUser();
	if (!user || user.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const body = await request.json();
	const {
		barManageId,
		password,
		name,
		role,
		is_active,
		bar_id,
		contact_email,
		contact_phone,
	} = body;

	const passwordHash = await bcrypt.hash(password, 10);

	const { data: newUser, error } = await supabaseAdmin
		.from("admin_users")
		.insert({
			bar_manage_id: barManageId,
			password_hash: passwordHash,
			name,
			role,
			is_active,
			bar_id,
			contact_email,
			contact_phone,
		})
		.select(
			"id, bar_manage_id, name, role, bar_id, is_active, created_at, updated_at",
		)
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ user: newUser }, { status: 201 });
}
