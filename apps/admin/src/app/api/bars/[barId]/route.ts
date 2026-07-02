import { type NextRequest, NextResponse } from "next/server";
import { canAccessBar, getCurrentUser } from "@/lib/auth";
import { SHIZUOKA_PREFECTURE } from "@/lib/shizuoka-cities";
import { supabaseAdmin } from "@/lib/supabase";
import {
	validateCoordinates,
	validateFacebookUrl,
	validateInstagramUrl,
	validateLineUrl,
	validateOpeningHours,
	validateWebsiteUrl,
	validateXUrl,
} from "@/lib/validators";
import type { Bar } from "@/types/database";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ barId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "認証されていません" },
				{ status: 401 },
			);
		}

		const { barId } = await params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json(
				{ error: "アクセス権限がありません" },
				{ status: 403 },
			);
		}

		const { data: bar, error } = await supabaseAdmin
			.from("bars")
			.select(`
        *,
        bar_payment_methods (
          payment_method:payment_methods (
            id,
            name,
            display_order
          )
        ),
        bar_opening_hours (
          id,
          bar_id,
          day_of_week,
          open_time,
          close_time,
          sort_order,
          is_closed,
          created_at,
          updated_at
        ),
        bar_images (
          id,
          bar_id,
          media_type,
          image_type,
          image_url,
          sort_order,
          created_at
        )
      `)
			.eq("id", barId)
			.eq("is_active", true)
			.single();

		if (error || !bar) {
			return NextResponse.json(
				{ error: "バーが見つかりません" },
				{ status: 404 },
			);
		}

		const paymentMethods =
			bar.bar_payment_methods
				?.map(
					(bpm: { payment_method?: { id: number } }) => bpm.payment_method?.id,
				)
				.filter((id: number | undefined) => id !== undefined) || [];

		const barImages = (
			bar.bar_images as { image_type: string; sort_order: number }[]
		)
			.filter(
				(img: { image_type: string; sort_order: number }) =>
					img.image_type === "slider",
			)
			.sort(
				(
					a: { image_type: string; sort_order: number },
					b: { image_type: string; sort_order: number },
				) => a.sort_order - b.sort_order,
			);

		const response = {
			...bar,
			payment_method_ids: paymentMethods,
			opening_hours: bar.bar_opening_hours || [],
			bar_images: barImages,
		};

		return NextResponse.json(response);
	} catch (_error) {
		return NextResponse.json(
			{ error: "バー情報の取得に失敗しました" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ barId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "認証されていません" },
				{ status: 401 },
			);
		}

		const { barId } = await params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json(
				{ error: "アクセス権限がありません" },
				{ status: 403 },
			);
		}

		const body = await request.json();
		const {
			name,
			city,
			address_line1,
			address_line2,
			latitude,
			longitude,
			phone_number,
			access,
			website_url,
			instagram_url,
			x_url,
			facebook_url,
			line_url,
			description,
			payment_method_ids,
			opening_hours,
		} = body;

		if (!name) {
			return NextResponse.json(
				{ error: "バー名を入力してください" },
				{ status: 400 },
			);
		}

		const websiteUrlValidation = validateWebsiteUrl(website_url);
		if (!websiteUrlValidation.isValid) {
			return NextResponse.json(
				{
					error:
						websiteUrlValidation.error ||
						"ホームページURLの形式が正しくありません",
				},
				{ status: 400 },
			);
		}

		const instagramValidation = validateInstagramUrl(instagram_url);
		if (!instagramValidation.isValid) {
			return NextResponse.json(
				{
					error:
						instagramValidation.error ||
						"Instagram URLの形式が正しくありません",
				},
				{ status: 400 },
			);
		}

		const xUrlValidation = validateXUrl(x_url);
		if (!xUrlValidation.isValid) {
			return NextResponse.json(
				{ error: xUrlValidation.error || "X URLの形式が正しくありません" },
				{ status: 400 },
			);
		}

		const facebookUrlValidation = validateFacebookUrl(facebook_url);
		if (!facebookUrlValidation.isValid) {
			return NextResponse.json(
				{
					error:
						facebookUrlValidation.error ||
						"Facebook URLの形式が正しくありません",
				},
				{ status: 400 },
			);
		}

		const lineUrlValidation = validateLineUrl(line_url);
		if (!lineUrlValidation.isValid) {
			return NextResponse.json(
				{
					error: lineUrlValidation.error || "LINE URLの形式が正しくありません",
				},
				{ status: 400 },
			);
		}

		const coordinatesValidation = validateCoordinates(latitude, longitude);
		if (!coordinatesValidation.isValid) {
			return NextResponse.json(
				{ error: coordinatesValidation.error },
				{ status: 400 },
			);
		}

		const { data: bar, error } = await supabaseAdmin
			.from("bars")
			.update({
				name,
				prefecture: SHIZUOKA_PREFECTURE,
				city: city || "",
				address_line1: address_line1 || "",
				address_line2: address_line2 || null,
				latitude: coordinatesValidation.latitude,
				longitude: coordinatesValidation.longitude,
				phone_number: phone_number || null,
				access: access || null,
				website_url: website_url || null,
				instagram_url: instagram_url || null,
				x_url: x_url || null,
				facebook_url: facebook_url || null,
				line_url: line_url || null,
				description: description || null,
			})
			.eq("id", barId)
			.select()
			.single<Bar>();

		if (error || !bar) {
			return NextResponse.json(
				{ error: "バーの更新に失敗しました" },
				{ status: 500 },
			);
		}

		if (payment_method_ids !== undefined) {
			if (!Array.isArray(payment_method_ids)) {
				return NextResponse.json(
					{ error: "支払い方法の指定が正しくありません" },
					{ status: 400 },
				);
			}

			const normalizedIds: number[] = [];
			for (const pmId of payment_method_ids) {
				const id = Number(pmId);
				if (!Number.isInteger(id)) {
					return NextResponse.json(
						{ error: "支払い方法の指定が正しくありません" },
						{ status: 400 },
					);
				}
				if (!normalizedIds.includes(id)) {
					normalizedIds.push(id);
				}
			}

			// DELETE→INSERT を1トランザクションで実行する RPC に委譲し、
			// INSERT 失敗時に既存データが消えたまま残る事故を防ぐ
			const { error: syncError } = await supabaseAdmin.rpc(
				"sync_bar_payment_methods",
				{
					p_bar_id: parseInt(barId, 10),
					p_payment_method_ids: normalizedIds,
				},
			);

			if (syncError) {
				return NextResponse.json(
					{ error: "支払い方法の更新に失敗しました" },
					{ status: 500 },
				);
			}
		}

		if (opening_hours !== undefined) {
			if (!Array.isArray(opening_hours)) {
				return NextResponse.json(
					{ error: "営業時間の指定が正しくありません" },
					{ status: 400 },
				);
			}

			// 不正値のまま sync RPC を呼んで既存データを消す事故を防ぐため、整形前に要素を検証する
			const openingHoursValidation = validateOpeningHours(opening_hours);
			if (!openingHoursValidation.isValid) {
				return NextResponse.json(
					{ error: openingHoursValidation.error },
					{ status: 400 },
				);
			}

			interface OpeningHourInput {
				day_of_week: number;
				open_time: string;
				close_time: string;
				sort_order: number;
				is_closed: boolean;
			}
			const openingHoursData = opening_hours
				.filter(
					(oh: OpeningHourInput) =>
						oh.is_closed || (oh.open_time && oh.close_time),
				)
				.map((oh: OpeningHourInput) => ({
					day_of_week: oh.day_of_week,
					open_time: oh.is_closed ? "00:00:00" : `${oh.open_time}:00`,
					close_time: oh.is_closed ? "00:00:00" : `${oh.close_time}:00`,
					sort_order: oh.sort_order,
					is_closed: oh.is_closed,
				}));

			const { error: syncError } = await supabaseAdmin.rpc(
				"sync_bar_opening_hours",
				{
					p_bar_id: parseInt(barId, 10),
					p_opening_hours: openingHoursData,
				},
			);

			if (syncError) {
				return NextResponse.json(
					{ error: "営業時間の更新に失敗しました" },
					{ status: 500 },
				);
			}
		}

		return NextResponse.json(bar);
	} catch (_error) {
		return NextResponse.json(
			{ error: "バーの更新に失敗しました" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ barId: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "認証されていません" },
				{ status: 401 },
			);
		}

		const { barId } = await params;

		if (!canAccessBar(user, barId)) {
			return NextResponse.json(
				{ error: "アクセス権限がありません" },
				{ status: 403 },
			);
		}

		const { error } = await supabaseAdmin
			.from("bars")
			.update({ is_active: false })
			.eq("id", barId);

		if (error) {
			return NextResponse.json(
				{ error: "バーの削除に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (_error) {
		return NextResponse.json(
			{ error: "バーの削除に失敗しました" },
			{ status: 500 },
		);
	}
}
