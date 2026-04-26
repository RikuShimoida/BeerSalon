import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { BarEvent } from "@/types/database";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ barId: string; eventId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId, eventId } = await params;

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

		const { data: event, error } = await supabaseAdmin
			.from("bar_events")
			.select("*")
			.eq("id", eventId)
			.eq("bar_id", barId)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return NextResponse.json({ error: "Event not found" }, { status: 404 });
			}
			console.error("Error fetching event:", error);
			return NextResponse.json(
				{ error: "Failed to fetch event" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ event });
	} catch (error) {
		console.error("Error in GET /api/bars/[barId]/events/[eventId]:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ barId: string; eventId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId, eventId } = await params;

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

		const { title, description, start_date, end_date, image_url, is_active } =
			body;

		if (!title || !start_date) {
			return NextResponse.json(
				{ error: "Title and start date are required" },
				{ status: 400 },
			);
		}

		const updatedEvent: Partial<BarEvent> = {
			title,
			description: description || null,
			start_date,
			end_date: end_date || null,
			image_url: image_url || null,
			is_active: is_active !== undefined ? is_active : true,
		};

		const { data, error } = await supabaseAdmin
			.from("bar_events")
			.update(updatedEvent)
			.eq("id", eventId)
			.eq("bar_id", barId)
			.select()
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				return NextResponse.json({ error: "Event not found" }, { status: 404 });
			}
			console.error("Error updating event:", error);
			return NextResponse.json(
				{ error: "Failed to update event" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ event: data });
	} catch (error) {
		console.error("Error in PUT /api/bars/[barId]/events/[eventId]:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ barId: string; eventId: string }> },
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { barId, eventId } = await params;

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
			.from("bar_events")
			.delete()
			.eq("id", eventId)
			.eq("bar_id", barId);

		if (error) {
			console.error("Error deleting event:", error);
			return NextResponse.json(
				{ error: "Failed to delete event" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error in DELETE /api/bars/[barId]/events/[eventId]:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
