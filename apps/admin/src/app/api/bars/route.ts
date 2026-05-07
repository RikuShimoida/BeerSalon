import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { SHIZUOKA_PREFECTURE } from "@/lib/shizuoka-cities";
import { supabaseAdmin } from "@/lib/supabase";
import {
	validateFacebookUrl,
	validateInstagramUrl,
	validateWebsiteUrl,
	validateXUrl,
} from "@/lib/validators";
import type { Bar } from "@/types/database";

// GET /api/bars - バー一覧取得
export async function GET() {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "認証されていません" },
				{ status: 401 },
			);
		}

		let query = supabaseAdmin
			.from("bars")
			.select("*")
			.eq("is_active", true)
			.order("created_at", { ascending: false });

		// バーオーナーの場合は自分のバーのみ
		if (user.role === "bar_owner") {
			const { data: barOwners } = await supabaseAdmin
				.from("bar_owners")
				.select("bar_id")
				.eq("admin_user_id", user.id);

			const barIds = barOwners?.map((bo) => bo.bar_id) || [];
			query = query.in("id", barIds.length > 0 ? barIds : [-1]); // barIdsが空の場合は結果なし
		}

		const { data: bars, error } = await query;

		if (error) {
			return NextResponse.json(
				{ error: "バー一覧の取得に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json(bars);
	} catch (error) {
		return NextResponse.json(
			{ error: "バー一覧の取得に失敗しました" },
			{ status: 500 },
		);
	}
}

// POST /api/bars - バー新規登録
export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "認証されていません" },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const {
			name,
			city,
			address_line1,
			address_line2,
			phone_number,
			access,
			website_url,
			instagram_url,
			x_url,
			facebook_url,
			description,
			payment_method_ids,
			opening_hours,
		} = body;

		// バリデーション
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

		// バー作成
		const now = new Date().toISOString();
		const { data: bar, error: barError } = await supabaseAdmin
			.from("bars")
			.insert({
				name,
				prefecture: SHIZUOKA_PREFECTURE,
				city: city || "",
				address_line1: address_line1 || "",
				address_line2: address_line2 || null,
				phone_number: phone_number || null,
				access: access || null,
				website_url: website_url || null,
				instagram_url: instagram_url || null,
				x_url: x_url || null,
				facebook_url: facebook_url || null,
				description: description || null,
				updated_at: now,
			})
			.select()
			.single<Bar>();

		if (barError || !bar) {
			return NextResponse.json(
				{ error: "バーの登録に失敗しました" },
				{ status: 500 },
			);
		}

		// バーオーナーとの紐付けを作成
		const { error: ownerError } = await supabaseAdmin
			.from("bar_owners")
			.insert({
				bar_id: bar.id,
				admin_user_id: user.id,
			});

		if (ownerError) {
		}

		// 支払い方法を登録
		if (Array.isArray(payment_method_ids) && payment_method_ids.length > 0) {
			const paymentMethodsData = payment_method_ids.map((pmId: string) => ({
				bar_id: bar.id,
				payment_method_id: parseInt(pmId),
			}));

			const { error: insertError } = await supabaseAdmin
				.from("bar_payment_methods")
				.insert(paymentMethodsData);

			if (insertError) {
			}
		}

		// 営業時間を登録
		if (Array.isArray(opening_hours) && opening_hours.length > 0) {
			const openingHoursData = opening_hours
				.filter((oh: any) => oh.is_closed || (oh.open_time && oh.close_time))
				.map((oh: any) => ({
					bar_id: bar.id,
					day_of_week: oh.day_of_week,
					open_time: oh.is_closed ? "00:00:00" : `${oh.open_time}:00`,
					close_time: oh.is_closed ? "00:00:00" : `${oh.close_time}:00`,
					sort_order: oh.sort_order,
					is_closed: oh.is_closed,
					created_at: now,
					updated_at: now,
				}));

			if (openingHoursData.length > 0) {
				const { error: insertError } = await supabaseAdmin
					.from("bar_opening_hours")
					.insert(openingHoursData);

				if (insertError) {
				}
			}
		}

		return NextResponse.json(bar, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{ error: "バーの登録に失敗しました" },
			{ status: 500 },
		);
	}
}
