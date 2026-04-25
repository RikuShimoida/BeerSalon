import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Bar } from "@/types/database";
import {
	validateInstagramUrl,
	validateXUrl,
	validateFacebookUrl,
	validateWebsiteUrl,
} from "@/lib/validators";
import { SHIZUOKA_PREFECTURE } from "@/lib/shizuoka-cities";

// GET /api/bars/:barId - バー詳細取得
export async function GET(
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

		// バーオーナーの場合は自分のバーかチェック
		if (user.role === "bar_owner") {
			const { data: barOwner } = await supabaseAdmin
				.from("bar_owners")
				.select("*")
				.eq("bar_id", barId)
				.eq("admin_user_id", user.id)
				.single();

			if (!barOwner) {
				return NextResponse.json(
					{ error: "アクセス権限がありません" },
					{ status: 403 },
				);
			}
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
				?.map((bpm: any) => bpm.payment_method?.id)
				.filter((id: any) => id !== undefined) || [];

		const response = {
			...bar,
			payment_method_ids: paymentMethods,
			opening_hours: bar.bar_opening_hours || [],
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("Bar get error:", error);
		return NextResponse.json(
			{ error: "バー情報の取得に失敗しました" },
			{ status: 500 },
		);
	}
}

// PUT /api/bars/:barId - バー更新
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

		// バーオーナーの場合は自分のバーかチェック
		if (user.role === "bar_owner") {
			const { data: barOwner } = await supabaseAdmin
				.from("bar_owners")
				.select("*")
				.eq("bar_id", barId)
				.eq("admin_user_id", user.id)
				.single();

			if (!barOwner) {
				return NextResponse.json(
					{ error: "アクセス権限がありません" },
					{ status: 403 },
				);
			}
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

		const { data: bar, error } = await supabaseAdmin
			.from("bars")
			.update({
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
			})
			.eq("id", barId)
			.select()
			.single<Bar>();

		if (error || !bar) {
			console.error("Bar update error:", error);
			return NextResponse.json(
				{ error: "バーの更新に失敗しました" },
				{ status: 500 },
			);
		}

		if (payment_method_ids !== undefined) {
			const { error: deleteError } = await supabaseAdmin
				.from("bar_payment_methods")
				.delete()
				.eq("bar_id", barId);

			if (deleteError) {
				console.error("Payment methods delete error:", deleteError);
			}

			if (Array.isArray(payment_method_ids) && payment_method_ids.length > 0) {
				const paymentMethodsData = payment_method_ids.map((pmId: string) => ({
					bar_id: parseInt(barId),
					payment_method_id: parseInt(pmId),
				}));

				const { error: insertError } = await supabaseAdmin
					.from("bar_payment_methods")
					.insert(paymentMethodsData);

				if (insertError) {
					console.error("Payment methods insert error:", insertError);
					return NextResponse.json(
						{ error: "支払い方法の更新に失敗しました" },
						{ status: 500 },
					);
				}
			}
		}

		if (opening_hours !== undefined) {
			const { error: deleteError } = await supabaseAdmin
				.from("bar_opening_hours")
				.delete()
				.eq("bar_id", barId);

			if (deleteError) {
				console.error("Opening hours delete error:", deleteError);
			}

			if (Array.isArray(opening_hours) && opening_hours.length > 0) {
				const now = new Date().toISOString();
				const openingHoursData = opening_hours
					.filter((oh: any) => oh.is_closed || (oh.open_time && oh.close_time))
					.map((oh: any) => ({
						bar_id: parseInt(barId),
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
						console.error("Opening hours insert error:", insertError);
						return NextResponse.json(
							{ error: "営業時間の更新に失敗しました" },
							{ status: 500 },
						);
					}
				}
			}
		}

		return NextResponse.json(bar);
	} catch (error) {
		console.error("Bar update API error:", error);
		return NextResponse.json(
			{ error: "バーの更新に失敗しました" },
			{ status: 500 },
		);
	}
}

// DELETE /api/bars/:barId - バー削除（論理削除）
export async function DELETE(
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

		// バーオーナーの場合は自分のバーかチェック
		if (user.role === "bar_owner") {
			const { data: barOwner } = await supabaseAdmin
				.from("bar_owners")
				.select("*")
				.eq("bar_id", barId)
				.eq("admin_user_id", user.id)
				.single();

			if (!barOwner) {
				return NextResponse.json(
					{ error: "アクセス権限がありません" },
					{ status: 403 },
				);
			}
		}

		// 論理削除（is_activeをfalseに設定）
		const { error } = await supabaseAdmin
			.from("bars")
			.update({ is_active: false })
			.eq("id", barId);

		if (error) {
			console.error("Bar delete error:", error);
			return NextResponse.json(
				{ error: "バーの削除に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Bar delete API error:", error);
		return NextResponse.json(
			{ error: "バーの削除に失敗しました" },
			{ status: 500 },
		);
	}
}
