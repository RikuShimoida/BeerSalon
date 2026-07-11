import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
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

		if (user.role === "bar_owner") {
			if (user.barId) {
				query = query.eq("id", user.barId);
			} else {
				return NextResponse.json([]);
			}
		}

		const { data: bars, error } = await query;

		if (error) {
			return NextResponse.json(
				{ error: "バー一覧の取得に失敗しました" },
				{ status: 500 },
			);
		}

		return NextResponse.json(bars);
	} catch (_error) {
		return NextResponse.json(
			{ error: "バー一覧の取得に失敗しました" },
			{ status: 500 },
		);
	}
}

// POST /api/bars - バー新規登録（admin_users + bars を同時作成）
export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "認証されていません" },
				{ status: 401 },
			);
		}

		if (user.role !== "admin") {
			return NextResponse.json({ error: "権限がありません" }, { status: 403 });
		}

		const body = await request.json();
		const {
			bar_manage_id,
			password,
			contact_email,
			contact_phone,
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
			regular_holiday,
			opening_hours,
		} = body;

		// Phase 1 バリデーション
		if (!bar_manage_id || typeof bar_manage_id !== "string") {
			return NextResponse.json(
				{ error: "店舗IDを入力してください" },
				{ status: 400 },
			);
		}

		const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
		if (!slugPattern.test(bar_manage_id)) {
			return NextResponse.json(
				{
					error:
						"店舗IDは半角英数字とハイフンのみ使用できます（例: fuji-beer-bar）",
				},
				{ status: 400 },
			);
		}

		if (!password || password.length < 8) {
			return NextResponse.json(
				{ error: "パスワードは8文字以上で入力してください" },
				{ status: 400 },
			);
		}

		if (!contact_email) {
			return NextResponse.json(
				{ error: "メールアドレスを入力してください" },
				{ status: 400 },
			);
		}

		if (!contact_phone) {
			return NextResponse.json(
				{ error: "電話番号を入力してください" },
				{ status: 400 },
			);
		}

		// bar_manage_id の重複チェック
		const { data: existingUser } = await supabaseAdmin
			.from("admin_users")
			.select("id")
			.eq("bar_manage_id", bar_manage_id)
			.maybeSingle();

		if (existingUser) {
			return NextResponse.json(
				{ error: "この店舗IDは既に使用されています" },
				{ status: 400 },
			);
		}

		// Phase 2 バリデーション（任意項目のURLバリデーション）
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

		// 営業時間は店舗（bars）を作る前に検証する。作成後に 400 を返すと店舗だけ残るため。
		if (opening_hours !== undefined) {
			if (!Array.isArray(opening_hours)) {
				return NextResponse.json(
					{ error: "営業時間の指定が正しくありません" },
					{ status: 400 },
				);
			}

			const openingHoursValidation = validateOpeningHours(opening_hours);
			if (!openingHoursValidation.isValid) {
				return NextResponse.json(
					{ error: openingHoursValidation.error },
					{ status: 400 },
				);
			}
		}

		// バー作成
		const now = new Date().toISOString();
		const { data: bar, error: barError } = await supabaseAdmin
			.from("bars")
			.insert({
				name: name || bar_manage_id,
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
				regular_holiday: regular_holiday || null,
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

		// admin_users (bar_owner) 作成
		const passwordHash = await hashPassword(password);
		const { error: adminUserError } = await supabaseAdmin
			.from("admin_users")
			.insert({
				bar_manage_id,
				password_hash: passwordHash,
				name: name || bar_manage_id,
				role: "bar_owner",
				bar_id: bar.id,
				contact_email: contact_email || null,
				contact_phone: contact_phone || null,
			});

		if (adminUserError) {
			// admin_users作成失敗時はバーもロールバック（論理削除）
			await supabaseAdmin
				.from("bars")
				.update({ is_active: false })
				.eq("id", bar.id);

			return NextResponse.json(
				{ error: "店舗アカウントの作成に失敗しました" },
				{ status: 500 },
			);
		}

		// 営業時間を登録（PUT と同じ sync RPC に寄せ、書き込み口を一本化する）
		if (Array.isArray(opening_hours) && opening_hours.length > 0) {
			const openingHoursData = opening_hours
				.filter(
					(oh: { is_closed: boolean; open_time: string; close_time: string }) =>
						oh.is_closed || (oh.open_time && oh.close_time),
				)
				.map(
					(oh: {
						day_of_week: number;
						open_time: string;
						close_time: string;
						sort_order: number;
						is_closed: boolean;
					}) => ({
						day_of_week: oh.day_of_week,
						open_time: oh.is_closed ? "00:00:00" : `${oh.open_time}:00`,
						close_time: oh.is_closed ? "00:00:00" : `${oh.close_time}:00`,
						sort_order: oh.sort_order,
						is_closed: oh.is_closed,
					}),
				);

			if (openingHoursData.length > 0) {
				// PUT 側と対称に RPC の error を拾う。握り潰すと営業時間の登録失敗が呼び出し側に伝わらないため。
				// Why not「POST 全体の RPC 化（店舗作成含めた全体トランザクション化）」: 本 PR スコープ（子データ同期の原子化）外のため採らず、
				// 既存データ消失防止に必要な RPC エラーの拾い上げのみ行う。
				const { error: syncError } = await supabaseAdmin.rpc(
					"sync_bar_opening_hours",
					{
						p_bar_id: bar.id,
						p_opening_hours: openingHoursData,
					},
				);

				if (syncError) {
					// 店舗（bars）と admin_users は既に作成済み。作成済みの barId を返し、
					// 「店舗は作成されたが営業時間の登録に失敗した」ことを呼び出し側へ伝える。
					return NextResponse.json(
						{
							error: "店舗は作成されましたが営業時間の登録に失敗しました",
							barId: bar.id,
						},
						{ status: 500 },
					);
				}
			}
		}

		return NextResponse.json(bar, { status: 201 });
	} catch (_error) {
		return NextResponse.json(
			{ error: "バーの登録に失敗しました" },
			{ status: 500 },
		);
	}
}
