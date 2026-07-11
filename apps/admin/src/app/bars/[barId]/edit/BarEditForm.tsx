"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import OpeningHoursEditor from "@/components/OpeningHoursEditor";
import SliderMediaManager from "@/components/SliderMediaManager";
import {
	SHIZUOKA_MUNICIPALITIES,
	SHIZUOKA_PREFECTURE,
} from "@/lib/shizuoka-cities";
import {
	validateCoordinates,
	validateFacebookUrl,
	validateInstagramUrl,
	validateLineUrl,
	validateWebsiteUrl,
	validateXUrl,
} from "@/lib/validators";
import type { Bar } from "@/types/database";

interface OpeningHourInput {
	day_of_week: number;
	open_time: string;
	close_time: string;
	sort_order: number;
	is_closed: boolean;
}

interface PaymentMethodOption {
	id: number;
	name: string;
	display_order: number;
}

export default function BarEditForm({ barId }: { barId: string }) {
	const router = useRouter();
	const [bar, setBar] = useState<Bar | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [fetchError, setFetchError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [openingHoursErrors, setOpeningHoursErrors] = useState<{
		[key: string]: string;
	}>({});

	const [formData, setFormData] = useState({
		name: "",
		description: "",
		access: "",
		phone_number: "",
		prefecture: "",
		city: "",
		address_line1: "",
		address_line2: "",
		latitude: "",
		longitude: "",
		website_url: "",
		instagram_url: "",
		x_url: "",
		facebook_url: "",
		line_url: "",
	});

	const [openingHours, setOpeningHours] = useState<OpeningHourInput[]>(
		Array.from({ length: 7 }, (_, day) => ({
			day_of_week: day,
			open_time: "",
			close_time: "",
			sort_order: 0,
			is_closed: false,
		})),
	);

	const [regularHoliday, setRegularHoliday] = useState("");

	// Payment methods
	const [paymentMethodOptions, setPaymentMethodOptions] = useState<
		PaymentMethodOption[]
	>([]);
	const [selectedPaymentMethodIds, setSelectedPaymentMethodIds] = useState<
		number[]
	>([]);

	// Preview image
	const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
	const [uploadingImage, setUploadingImage] = useState(false);
	const [imageError, setImageError] = useState("");

	// Store ID change
	const [currentBarManageId, setCurrentBarManageId] = useState("");
	const [newBarManageId, setNewBarManageId] = useState("");
	const [changingId, setChangingId] = useState(false);
	const [idChangeError, setIdChangeError] = useState("");

	// Password change
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [changingPassword, setChangingPassword] = useState(false);
	const [passwordError, setPasswordError] = useState("");
	const [passwordSuccess, setPasswordSuccess] = useState("");

	const fetchBar = useCallback(async () => {
		try {
			const response = await fetch(`/api/bars/${barId}`);

			if (!response.ok) {
				if (response.status === 403) {
					setFetchError("アクセス権限がありません");
				} else if (response.status === 404) {
					setFetchError("店舗が見つかりません");
				} else {
					setFetchError("店舗情報の取得に失敗しました");
				}
				return;
			}

			const data = await response.json();
			setBar(data);
			setPreviewImageUrl(data.preview_image_url || null);
			setRegularHoliday(data.regular_holiday ?? "");
			setFormData({
				name: data.name || "",
				description: data.description || "",
				access: data.access || "",
				phone_number: data.phone_number || "",
				prefecture: data.prefecture || "",
				city: data.city || "",
				address_line1: data.address_line1 || "",
				address_line2: data.address_line2 || "",
				latitude: data.latitude != null ? String(data.latitude) : "",
				longitude: data.longitude != null ? String(data.longitude) : "",
				website_url: data.website_url || "",
				instagram_url: data.instagram_url || "",
				x_url: data.x_url || "",
				facebook_url: data.facebook_url || "",
				line_url: data.line_url || "",
			});

			if (Array.isArray(data.payment_method_ids)) {
				setSelectedPaymentMethodIds(
					data.payment_method_ids.map((id: number | string) => Number(id)),
				);
			}

			if (data.opening_hours && data.opening_hours.length > 0) {
				setOpeningHours(
					data.opening_hours.map(
						(h: {
							day_of_week: number;
							open_time: string;
							close_time: string;
							sort_order: number;
							is_closed: boolean;
						}) => ({
							day_of_week: h.day_of_week,
							open_time: h.open_time.substring(0, 5),
							close_time: h.close_time.substring(0, 5),
							sort_order: h.sort_order,
							is_closed: h.is_closed,
						}),
					),
				);
			}

			// Fetch admin_user for current bar_manage_id
			try {
				const adminResponse = await fetch(`/api/bars/${barId}/admin-user`);
				if (adminResponse.ok) {
					const adminData = await adminResponse.json();
					setCurrentBarManageId(adminData.bar_manage_id || "");
				}
			} catch (_err) {
				// admin user info is optional for display
			}
		} catch (_error) {
			setFetchError("店舗情報の取得に失敗しました");
		} finally {
			setLoading(false);
		}
	}, [barId]);

	useEffect(() => {
		fetchBar();
	}, [fetchBar]);

	useEffect(() => {
		const fetchPaymentMethods = async () => {
			try {
				const response = await fetch("/api/payment-methods");
				if (response.ok) {
					const data = await response.json();
					setPaymentMethodOptions(data);
				}
			} catch (_error) {
				// payment method options are optional for display
			}
		};
		fetchPaymentMethods();
	}, []);

	const handlePaymentMethodToggle = (id: number) => {
		setSelectedPaymentMethodIds((prev) =>
			prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
		);
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setImageError("");

		const MAX_SIZE = 5 * 1024 * 1024;
		const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

		if (file.size > MAX_SIZE) {
			setImageError("画像サイズは5MB以下にしてください");
			return;
		}

		if (!ALLOWED_TYPES.includes(file.type)) {
			setImageError("画像形式はJPEG、PNG、WebPのみ対応しています");
			return;
		}

		setUploadingImage(true);
		try {
			const uploadFormData = new FormData();
			uploadFormData.append("file", file);

			const response = await fetch(`/api/bars/${barId}/preview-image`, {
				method: "POST",
				body: uploadFormData,
			});

			if (!response.ok) {
				const data = await response.json();
				setImageError(data.error || "画像のアップロードに失敗しました");
				return;
			}

			const data = await response.json();
			setPreviewImageUrl(data.preview_image_url);
		} catch (_error) {
			setImageError("画像のアップロードに失敗しました");
		} finally {
			setUploadingImage(false);
		}
	};

	const handleImageDelete = async () => {
		if (!previewImageUrl) return;
		if (!confirm("プレビュー画像を削除しますか？")) return;

		setUploadingImage(true);
		setImageError("");

		try {
			const response = await fetch(`/api/bars/${barId}/preview-image`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const data = await response.json();
				setImageError(data.error || "画像の削除に失敗しました");
				return;
			}

			setPreviewImageUrl(null);
		} catch (_error) {
			setImageError("画像の削除に失敗しました");
		} finally {
			setUploadingImage(false);
		}
	};

	const validateOpeningHours = (): boolean => {
		const errors: { [key: string]: string } = {};

		for (const hour of openingHours) {
			if (!hour.is_closed) {
				const errorKey = `${hour.day_of_week}_${hour.sort_order}`;
				const hasOpenTime = hour.open_time !== "";
				const hasCloseTime = hour.close_time !== "";

				if (hasOpenTime && !hasCloseTime) {
					errors[errorKey] = "終了時刻を入力してください";
				} else if (!hasOpenTime && hasCloseTime) {
					errors[errorKey] = "開始時刻を入力してください";
				}
			}
		}

		setOpeningHoursErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccessMessage("");
		setOpeningHoursErrors({});

		if (formData.website_url) {
			const result = validateWebsiteUrl(formData.website_url);
			if (!result.isValid) {
				setError(result.error || "ホームページURLの形式が正しくありません");
				return;
			}
		}
		if (formData.instagram_url) {
			const result = validateInstagramUrl(formData.instagram_url);
			if (!result.isValid) {
				setError(result.error || "Instagram URLの形式が正しくありません");
				return;
			}
		}
		if (formData.x_url) {
			const result = validateXUrl(formData.x_url);
			if (!result.isValid) {
				setError(result.error || "X URLの形式が正しくありません");
				return;
			}
		}
		if (formData.facebook_url) {
			const result = validateFacebookUrl(formData.facebook_url);
			if (!result.isValid) {
				setError(result.error || "Facebook URLの形式が正しくありません");
				return;
			}
		}
		if (formData.line_url) {
			const result = validateLineUrl(formData.line_url);
			if (!result.isValid) {
				setError(result.error || "LINE URLの形式が正しくありません");
				return;
			}
		}

		const coordinatesResult = validateCoordinates(
			formData.latitude,
			formData.longitude,
		);
		if (!coordinatesResult.isValid) {
			setError(coordinatesResult.error);
			return;
		}

		if (!validateOpeningHours()) {
			setError("営業時間の入力に誤りがあります");
			return;
		}

		setSaving(true);

		try {
			const filteredOpeningHours = openingHours.filter(
				(h) => h.is_closed || (h.open_time !== "" && h.close_time !== ""),
			);

			const response = await fetch(`/api/bars/${barId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					regular_holiday: regularHoliday.trim() || null,
					payment_method_ids: selectedPaymentMethodIds,
					opening_hours: filteredOpeningHours,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				setError(data.error || "保存に失敗しました");
				return;
			}

			router.push(`/bars/${barId}`);
			router.refresh();
		} catch (_err) {
			setError("保存に失敗しました");
		} finally {
			setSaving(false);
		}
	};

	const handleChangeBarManageId = async () => {
		setIdChangeError("");

		if (!newBarManageId.trim()) {
			setIdChangeError("新しい店舗IDを入力してください");
			return;
		}

		const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
		if (!slugPattern.test(newBarManageId)) {
			setIdChangeError("店舗IDは半角英数字とハイフンのみ使用できます");
			return;
		}

		if (
			!confirm(
				`店舗IDを「${currentBarManageId}」から「${newBarManageId}」に変更しますか？\nログイン時に使用するIDが変わります。`,
			)
		) {
			return;
		}

		setChangingId(true);

		try {
			const response = await fetch(`/api/bars/${barId}/admin-user`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bar_manage_id: newBarManageId }),
			});

			if (!response.ok) {
				const data = await response.json();
				setIdChangeError(data.error || "店舗IDの変更に失敗しました");
				return;
			}

			setCurrentBarManageId(newBarManageId);
			setNewBarManageId("");
		} catch (_err) {
			setIdChangeError("店舗IDの変更に失敗しました");
		} finally {
			setChangingId(false);
		}
	};

	const handleChangePassword = async () => {
		setPasswordError("");
		setPasswordSuccess("");

		if (!currentPassword) {
			setPasswordError("現在のパスワードを入力してください");
			return;
		}
		if (!newPassword || newPassword.length < 8) {
			setPasswordError("新しいパスワードは8文字以上で入力してください");
			return;
		}
		if (newPassword !== confirmPassword) {
			setPasswordError("新しいパスワードが一致しません");
			return;
		}

		setChangingPassword(true);

		try {
			const response = await fetch(`/api/bars/${barId}/admin-user`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					current_password: currentPassword,
					new_password: newPassword,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				setPasswordError(data.error || "パスワードの変更に失敗しました");
				return;
			}

			setPasswordSuccess("パスワードを変更しました");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (_err) {
			setPasswordError("パスワードの変更に失敗しました");
		} finally {
			setChangingPassword(false);
		}
	};

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-gray-200 rounded w-1/4" />
					<div className="h-64 bg-gray-200 rounded" />
				</div>
			</div>
		);
	}

	if (fetchError || !bar) {
		return (
			<div className="p-6">
				<div className="rounded-md bg-red-50 border border-red-200 p-4">
					<p className="text-sm text-red-800">
						{fetchError || "店舗が見つかりません"}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 max-w-2xl mx-auto">
			<h1 className="text-2xl font-bold text-gray-900 mb-6">店舗情報編集</h1>

			{error && (
				<div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
					<p className="text-sm text-red-800">{error}</p>
				</div>
			)}

			{successMessage && (
				<div className="mb-6 rounded-md bg-green-50 border border-green-200 p-4">
					<p className="text-sm text-green-800">{successMessage}</p>
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-6">
				<div>
					<label
						htmlFor="name"
						className="block text-sm font-medium text-gray-700"
					>
						店舗名
					</label>
					<input
						type="text"
						id="name"
						name="name"
						value={formData.name}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					/>
				</div>

				<div>
					<label
						htmlFor="description"
						className="block text-sm font-medium text-gray-700"
					>
						説明（PR文）
					</label>
					<textarea
						id="description"
						name="description"
						rows={4}
						value={formData.description}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					/>
				</div>

				<OpeningHoursEditor
					value={openingHours}
					onChange={setOpeningHours}
					errors={openingHoursErrors}
					regularHoliday={regularHoliday}
					onRegularHolidayChange={setRegularHoliday}
				/>

				<div>
					<label
						htmlFor="access"
						className="block text-sm font-medium text-gray-700"
					>
						アクセス
					</label>
					<input
						type="text"
						id="access"
						name="access"
						value={formData.access}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					/>
				</div>

				<div>
					<label
						htmlFor="phone_number"
						className="block text-sm font-medium text-gray-700"
					>
						電話番号
					</label>
					<input
						type="tel"
						id="phone_number"
						name="phone_number"
						value={formData.phone_number}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					/>
				</div>

				<div>
					<label
						htmlFor="prefecture"
						className="block text-sm font-medium text-gray-700"
					>
						都道府県
					</label>
					<select
						id="prefecture"
						name="prefecture"
						value={formData.prefecture}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					>
						<option value="">選択してください</option>
						<option value={SHIZUOKA_PREFECTURE}>{SHIZUOKA_PREFECTURE}</option>
					</select>
				</div>

				<div>
					<label
						htmlFor="city"
						className="block text-sm font-medium text-gray-700"
					>
						市区町村
					</label>
					<select
						id="city"
						name="city"
						value={formData.city}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					>
						<option value="">選択してください</option>
						{SHIZUOKA_MUNICIPALITIES.map((city) => (
							<option key={city} value={city}>
								{city}
							</option>
						))}
					</select>
				</div>

				<div>
					<label
						htmlFor="address_line1"
						className="block text-sm font-medium text-gray-700"
					>
						住所1
					</label>
					<input
						type="text"
						id="address_line1"
						name="address_line1"
						value={formData.address_line1}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					/>
				</div>

				<div>
					<label
						htmlFor="address_line2"
						className="block text-sm font-medium text-gray-700"
					>
						住所2
					</label>
					<input
						type="text"
						id="address_line2"
						name="address_line2"
						value={formData.address_line2}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					/>
				</div>

				<div>
					<label
						htmlFor="latitude"
						className="block text-sm font-medium text-gray-700"
					>
						緯度
					</label>
					<input
						type="number"
						step="any"
						id="latitude"
						name="latitude"
						value={formData.latitude}
						onChange={handleChange}
						placeholder="35.0116"
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					/>
					<p className="mt-1 text-sm text-gray-500">
						-90〜90（マップ表示用・任意）
					</p>
				</div>

				<div>
					<label
						htmlFor="longitude"
						className="block text-sm font-medium text-gray-700"
					>
						経度
					</label>
					<input
						type="number"
						step="any"
						id="longitude"
						name="longitude"
						value={formData.longitude}
						onChange={handleChange}
						placeholder="135.7681"
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					/>
					<p className="mt-1 text-sm text-gray-500">
						-180〜180（マップ表示用・任意）
					</p>
				</div>

				<div>
					<label
						htmlFor="website_url"
						className="block text-sm font-medium text-gray-700"
					>
						ホームページ
					</label>
					<input
						type="url"
						id="website_url"
						name="website_url"
						value={formData.website_url}
						onChange={handleChange}
						placeholder="https://example.com"
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					/>
				</div>

				<div>
					<label
						htmlFor="instagram_url"
						className="block text-sm font-medium text-gray-700"
					>
						Instagram
					</label>
					<input
						type="url"
						id="instagram_url"
						name="instagram_url"
						value={formData.instagram_url}
						onChange={handleChange}
						placeholder="https://www.instagram.com/your_account"
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					/>
				</div>

				<div>
					<label
						htmlFor="x_url"
						className="block text-sm font-medium text-gray-700"
					>
						X（Twitter）
					</label>
					<input
						type="url"
						id="x_url"
						name="x_url"
						value={formData.x_url}
						onChange={handleChange}
						placeholder="https://x.com/example"
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					/>
				</div>

				<div>
					<label
						htmlFor="facebook_url"
						className="block text-sm font-medium text-gray-700"
					>
						Facebook
					</label>
					<input
						type="url"
						id="facebook_url"
						name="facebook_url"
						value={formData.facebook_url}
						onChange={handleChange}
						placeholder="https://www.facebook.com/yourpage"
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					/>
				</div>

				<div>
					<label
						htmlFor="line_url"
						className="block text-sm font-medium text-gray-700"
					>
						LINE
					</label>
					<input
						type="url"
						id="line_url"
						name="line_url"
						value={formData.line_url}
						onChange={handleChange}
						placeholder="https://line.me/R/ti/p/@example"
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					/>
				</div>

				<fieldset>
					<legend className="block text-sm font-medium text-gray-700">
						支払い方法
					</legend>
					<p className="mt-1 text-sm text-gray-500 mb-2">
						店舗で利用できる支払い方法を選択してください（複数選択可）
					</p>
					{paymentMethodOptions.length === 0 ? (
						<p className="text-sm text-gray-500">
							支払い方法が登録されていません
						</p>
					) : (
						<div className="space-y-2">
							{paymentMethodOptions.map((method) => (
								<label
									key={method.id}
									htmlFor={`payment_method_${method.id}`}
									className="flex items-center gap-2 text-sm text-gray-900"
								>
									<input
										type="checkbox"
										id={`payment_method_${method.id}`}
										checked={selectedPaymentMethodIds.includes(method.id)}
										onChange={() => handlePaymentMethodToggle(method.id)}
										className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
									/>
									{method.name}
								</label>
							))}
						</div>
					)}
				</fieldset>

				{/* Preview image section */}
				<div>
					<div className="block text-sm font-medium text-gray-700 mb-2">
						プレビュー画像
					</div>
					<p className="text-sm text-gray-500 mb-3">
						店舗一覧ページに表示されるサムネイル画像です（最大5MB、JPEG/PNG/WebP）
					</p>

					{imageError && (
						<div className="mb-3 rounded-md bg-red-50 p-3">
							<p className="text-sm text-red-800">{imageError}</p>
						</div>
					)}

					{previewImageUrl ? (
						<div className="space-y-3">
							<div className="relative w-full max-w-md">
								<Image
									src={previewImageUrl}
									alt="プレビュー画像"
									width={400}
									height={300}
									unoptimized
									className="w-full h-auto rounded-lg border border-gray-300"
								/>
							</div>
							<div className="flex space-x-2">
								<label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
									<input
										type="file"
										accept="image/jpeg,image/png,image/webp"
										onChange={handleImageUpload}
										disabled={uploadingImage}
										className="hidden"
									/>
									{uploadingImage ? "アップロード中..." : "画像を変更"}
								</label>
								<button
									type="button"
									onClick={handleImageDelete}
									disabled={uploadingImage}
									className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									削除
								</button>
							</div>
						</div>
					) : (
						<div>
							<label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
								<input
									type="file"
									accept="image/jpeg,image/png,image/webp"
									onChange={handleImageUpload}
									disabled={uploadingImage}
									className="hidden"
								/>
								{uploadingImage ? "アップロード中..." : "画像を選択"}
							</label>
							<p className="mt-2 text-sm text-gray-500">
								画像が設定されていません
							</p>
						</div>
					)}
				</div>

				{/* Slider media section */}
				<div className="border-t border-gray-200 pt-6">
					<SliderMediaManager barId={barId} />
				</div>

				<div className="flex justify-between pt-4">
					<button
						type="button"
						onClick={() => router.push(`/bars/${barId}`)}
						className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
					>
						キャンセル
					</button>
					<button
						type="submit"
						disabled={saving}
						className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{saving ? "保存中..." : "保存する"}
					</button>
				</div>
			</form>

			{/* Store ID change section */}
			<section className="mt-12 border-t border-gray-200 pt-8">
				<h2 className="text-lg font-bold text-gray-900 mb-4">店舗ID変更</h2>

				{idChangeError && (
					<div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
						<p className="text-sm text-red-800">{idChangeError}</p>
					</div>
				)}

				<div className="space-y-4">
					<div>
						<span className="block text-sm font-medium text-gray-500">
							現在の店舗ID
						</span>
						<p className="mt-1 text-gray-900 font-mono">
							{currentBarManageId || "-"}
						</p>
					</div>

					<div>
						<label
							htmlFor="new_bar_manage_id"
							className="block text-sm font-medium text-gray-700"
						>
							新しい店舗ID
						</label>
						<input
							type="text"
							id="new_bar_manage_id"
							value={newBarManageId}
							onChange={(e) => setNewBarManageId(e.target.value)}
							placeholder="new-bar-id"
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
						/>
						<p className="mt-1 text-sm text-gray-500">
							半角英数字とハイフンのみ
						</p>
					</div>

					<button
						type="button"
						onClick={handleChangeBarManageId}
						disabled={changingId}
						className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{changingId ? "変更中..." : "店舗IDを変更する"}
					</button>
				</div>
			</section>

			{/* Password change section */}
			<section className="mt-12 border-t border-gray-200 pt-8 pb-8">
				<h2 className="text-lg font-bold text-gray-900 mb-4">パスワード変更</h2>

				{passwordError && (
					<div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
						<p className="text-sm text-red-800">{passwordError}</p>
					</div>
				)}

				{passwordSuccess && (
					<div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3">
						<p className="text-sm text-green-800">{passwordSuccess}</p>
					</div>
				)}

				<div className="space-y-4">
					<div>
						<label
							htmlFor="current_password"
							className="block text-sm font-medium text-gray-700"
						>
							現在のパスワード
						</label>
						<input
							type="password"
							id="current_password"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
						/>
					</div>

					<div>
						<label
							htmlFor="new_password"
							className="block text-sm font-medium text-gray-700"
						>
							新しいパスワード
						</label>
						<input
							type="password"
							id="new_password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="8文字以上"
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
						/>
					</div>

					<div>
						<label
							htmlFor="confirm_password"
							className="block text-sm font-medium text-gray-700"
						>
							新しいパスワード（確認用）
						</label>
						<input
							type="password"
							id="confirm_password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
						/>
					</div>

					<button
						type="button"
						onClick={handleChangePassword}
						disabled={changingPassword}
						className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{changingPassword ? "変更中..." : "パスワードを変更する"}
					</button>
				</div>
			</section>
		</div>
	);
}
