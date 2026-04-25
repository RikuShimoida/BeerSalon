import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { BarEvent } from "@/types/database";

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

		const { data: events, error } = await supabaseAdmin
			.from("bar_events")
			.select("*")
			.eq("bar_id", barId)
			.order("start_date", { ascending: false });

		if (error) {
			console.error("Error fetching events:", error);
			return NextResponse.json(
				{ error: "Failed to fetch events" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ events });
	} catch (error) {
		console.error("Error in GET /api/bars/[barId]/events:", error);
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

		const { title, description, start_date, end_date, image_url, is_active } =
			body;

		if (!title || !start_date) {
			return NextResponse.json(
				{ error: "Title and start date are required" },
				{ status: 400 },
			);
		}

		const newEvent: Partial<BarEvent> = {
			bar_id: parseInt(barId),
			title,
			description: description || null,
			start_date,
			end_date: end_date || null,
			image_url: image_url || null,
			is_active: is_active !== undefined ? is_active : true,
		};

		const { data, error } = await supabaseAdmin
			.from("bar_events")
			.insert(newEvent)
			.select()
			.single();

		if (error) {
			console.error("Error creating event:", error);
			return NextResponse.json(
				{ error: "Failed to create event" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ event: data }, { status: 201 });
	} catch (error) {
		console.error("Error in POST /api/bars/[barId]/events:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
