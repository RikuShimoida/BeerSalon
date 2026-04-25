"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bar, BarOpeningHour } from "@/types/database";
import OpeningHoursEditor from "./OpeningHoursEditor";
import SliderMediaManager from "./SliderMediaManager";
import {
	validateInstagramUrl,
	validateXUrl,
	validateFacebookUrl,
	validateWebsiteUrl,
} from "@/lib/validators";
import {
	SHIZUOKA_PREFECTURE,
	SHIZUOKA_MUNICIPALITIES,
} from "@/lib/shizuoka-cities";

interface PaymentMethod {
	id: string;
	name: string;
	display_order: number;
}

interface OpeningHourInput {
	day_of_week: number;
	open_time: string;
	close_time: string;
	sort_order: number;
	is_closed: boolean;
}

interface BarFormProps {
	bar?: Bar;
	isEdit?: boolean;
}

export default function BarForm({ bar, isEdit = false }: BarFormProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [openingHoursErrors, setOpeningHoursErrors] = useState<{
		[key: string]: string;
	}>({});
	const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
	const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(
		bar?.preview_image_url || null,
	);
	const [previewImageFile, setPreviewImageFile] = useState<File | null>(null);
	const [uploadingImage, setUploadingImage] = useState(false);
	const [imageError, setImageError] = useState("");
	const [sliderMediaFiles, setSliderMediaFiles] = useState<File[]>([]);

	const [formData, setFormData] = useState({
		name: bar?.name || "",
		prefecture: SHIZUOKA_PREFECTURE,
		city: bar?.city || "",
		address_line1: bar?.address_line1 || "",
		address_line2: bar?.address_line2 || "",
		phone_number: bar?.phone_number || "",
		access: bar?.access || "",
		website_url: bar?.website_url || "",
		instagram_url: bar?.instagram_url || "",
		x_url: bar?.x_url || "",
		facebook_url: bar?.facebook_url || "",
		description: bar?.description || "",
		payment_method_ids: bar?.payment_method_ids || [],
	});

	const [openingHours, setOpeningHours] = useState<OpeningHourInput[]>(() => {
		if (bar?.opening_hours && bar.opening_hours.length > 0) {
			return bar.opening_hours.map((h) => ({
				day_of_week: h.day_of_week,
				open_time: h.open_time.substring(0, 5),
				close_time: h.close_time.substring(0, 5),
				sort_order: h.sort_order,
				is_closed: h.is_closed,
			}));
		}

		return Array.from({ length: 7 }, (_, day) => ({
			day_of_week: day,
			open_time: "",
			close_time: "",
			sort_order: 0,
			is_closed: false,
		}));
	});

	useEffect(() => {
		fetchPaymentMethods();
	}, []);

	const fetchPaymentMethods = async () => {
		try {
			const response = await fetch("/api/payment-methods");
			if (response.ok) {
				const data = await response.json();
				setPaymentMethods(data);
			}
		} catch (error) {
			console.error("Failed to fetch payment methods:", error);
		}
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const handlePaymentMethodChange = (paymentMethodId: string) => {
		const currentIds = formData.payment_method_ids || [];
		const newIds = currentIds.includes(paymentMethodId)
			? currentIds.filter((id) => id !== paymentMethodId)
			: [...currentIds, paymentMethodId];

		setFormData({
			...formData,
			payment_method_ids: newIds,
		});
	};

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setImageError("");

		const MAX_SIZE = 5 * 1024 * 1024; // 5MB
		const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

		if (file.size > MAX_SIZE) {
			setImageError("画像サイズは5MB以下にしてください");
			return;
		}

		if (!ALLOWED_TYPES.includes(file.type)) {
			setImageError("画像形式はJPEG、PNG、WebPのみ対応しています");
			return;
		}

		// 編集モードの場合はすぐにアップロード
		if (isEdit && bar?.id) {
			setUploadingImage(true);
			try {
				const formData = new FormData();
				formData.append("file", file);

				const response = await fetch(`/api/bars/${bar.id}/preview-image`, {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					const data = await response.json();
					setImageError(data.error || "画像のアップロードに失敗しました");
					return;
				}

				const data = await response.json();
				setPreviewImageUrl(data.preview_image_url);
			} catch (error) {
				console.error("Image upload error:", error);
				setImageError("画像のアップロードに失敗しました");
			} finally {
				setUploadingImage(false);
			}
		} else {
			// 新規作成モードの場合はファイルを保持してプレビュー表示
			setPreviewImageFile(file);
			// プレビュー用のローカルURLを生成
			const localPreviewUrl = URL.createObjectURL(file);
			setPreviewImageUrl(localPreviewUrl);
		}
	};

	const handleImageDelete = async () => {
		if (!previewImageUrl) return;

		if (!confirm("プレビュー画像を削除しますか？")) return;

		// 編集モードの場合はサーバーから削除
		if (isEdit && bar?.id) {
			setUploadingImage(true);
			setImageError("");

			try {
				const response = await fetch(`/api/bars/${bar.id}/preview-image`, {
					method: "DELETE",
				});

				if (!response.ok) {
					const data = await response.json();
					setImageError(data.error || "画像の削除に失敗しました");
					return;
				}

				setPreviewImageUrl(null);
			} catch (error) {
				console.error("Image delete error:", error);
				setImageError("画像の削除に失敗しました");
			} finally {
				setUploadingImage(false);
			}
		} else {
			// 新規作成モードの場合はローカル状態をクリア
			if (previewImageUrl && previewImageUrl.startsWith("blob:")) {
				URL.revokeObjectURL(previewImageUrl);
			}
			setPreviewImageFile(null);
			setPreviewImageUrl(null);
			setImageError("");
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
		setOpeningHoursErrors({});

		if (!formData.name) {
			setError("バー名を入力してください");
			return;
		}

		const websiteUrlValidation = validateWebsiteUrl(formData.website_url);
		if (!websiteUrlValidation.isValid) {
			setError(
				websiteUrlValidation.error || "ホームページURLの形式が正しくありません",
			);
			return;
		}

		const instagramValidation = validateInstagramUrl(formData.instagram_url);
		if (!instagramValidation.isValid) {
			setError(
				instagramValidation.error || "Instagram URLの形式が正しくありません",
			);
			return;
		}

		const xUrlValidation = validateXUrl(formData.x_url);
		if (!xUrlValidation.isValid) {
			setError(xUrlValidation.error || "X URLの形式が正しくありません");
			return;
		}

		const facebookUrlValidation = validateFacebookUrl(formData.facebook_url);
		if (!facebookUrlValidation.isValid) {
			setError(
				facebookUrlValidation.error || "Facebook URLの形式が正しくありません",
			);
			return;
		}

		if (!validateOpeningHours()) {
			setError("営業時間の入力に誤りがあります");
			return;
		}

		setLoading(true);

		try {
			const url = isEdit ? `/api/bars/${bar?.id}` : "/api/bars";
			const method = isEdit ? "PUT" : "POST";

			const filteredOpeningHours = openingHours.filter(
				(h) => h.is_closed || (h.open_time !== "" && h.close_time !== ""),
			);

			const requestBody = {
				...formData,
				opening_hours: filteredOpeningHours,
			};

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const data = await response.json();
				setError(data.error || "保存に失敗しました");
				return;
			}

			const responseData = await response.json();

			// 新規作成時の画像・メディアアップロード
			if (!isEdit && responseData.id) {
				const uploadErrors: string[] = [];

				// プレビュー画像のアップロード
				if (previewImageFile) {
					try {
						const imageFormData = new FormData();
						imageFormData.append("file", previewImageFile);

						const imageResponse = await fetch(
							`/api/bars/${responseData.id}/preview-image`,
							{
								method: "POST",
								body: imageFormData,
							},
						);

						if (!imageResponse.ok) {
							console.error("Preview image upload failed after bar creation");
							uploadErrors.push("プレビュー画像");
						}
					} catch (imageError) {
						console.error("Image upload error:", imageError);
						uploadErrors.push("プレビュー画像");
					}
				}

				// スライダーメディアのアップロード
				if (sliderMediaFiles.length > 0) {
					for (const file of sliderMediaFiles) {
						try {
							const mediaFormData = new FormData();
							mediaFormData.append("file", file);

							const mediaResponse = await fetch(
								`/api/bars/${responseData.id}/media`,
								{
									method: "POST",
									body: mediaFormData,
								},
							);

							if (!mediaResponse.ok) {
								console.error("Slider media upload failed:", file.name);
								uploadErrors.push(`スライダーメディア (${file.name})`);
							}
						} catch (mediaError) {
							console.error("Media upload error:", mediaError);
							uploadErrors.push(`スライダーメディア (${file.name})`);
						}
					}
				}

				// エラーがあった場合は通知して遷移
				if (uploadErrors.length > 0) {
					setError(
						`店舗情報は保存されましたが、以下のアップロードに失敗しました: ${uploadErrors.join(", ")}。編集画面から再度アップロードしてください。`,
					);
					setTimeout(() => {
						router.push("/bars");
						router.refresh();
					}, 3000);
					return;
				}
			}

			router.push("/bars");
			router.refresh();
		} catch (err) {
			console.error("❌ 予期しないエラー:", err);
			setError("保存に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{error && (
				<div className="rounded-md bg-red-50 p-4">
					<p className="text-sm text-red-800">{error}</p>
				</div>
			)}

			<div>
				<label
					htmlFor="name"
					className="block text-sm font-medium text-gray-700"
				>
					バー名 <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					id="name"
					name="name"
					required
					value={formData.name}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="city"
					className="block text-sm font-medium text-gray-700"
				>
					市町村
				</label>
				<select
					id="city"
					name="city"
					value={formData.city}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				>
					<option value="">選択してください</option>
					{SHIZUOKA_MUNICIPALITIES.map((city) => (
						<option key={city} value={city}>
							{city}
						</option>
					))}
				</select>
				<p className="mt-1 text-sm text-gray-500">
					静岡県内の市町村を選択してください
				</p>
			</div>

			<div>
				<label
					htmlFor="address_line1"
					className="block text-sm font-medium text-gray-700"
				>
					番地
				</label>
				<input
					type="text"
					id="address_line1"
					name="address_line1"
					placeholder="神宮前1-2-3"
					value={formData.address_line1}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="address_line2"
					className="block text-sm font-medium text-gray-700"
				>
					建物名・部屋番号
				</label>
				<input
					type="text"
					id="address_line2"
					name="address_line2"
					placeholder="〇〇ビル 4F"
					value={formData.address_line2}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
					placeholder="03-1234-5678"
					value={formData.phone_number}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="access"
					className="block text-sm font-medium text-gray-700"
				>
					交通手段・アクセス
				</label>
				<textarea
					id="access"
					name="access"
					rows={3}
					placeholder="例）JR◯◯駅から徒歩5分&#10;例）駐車場：近隣コインパーキングあり（提携なし）&#10;例）バス：◯◯停留所から徒歩2分"
					value={formData.access}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="website_url"
					className="block text-sm font-medium text-gray-700"
				>
					ホームページURL
				</label>
				<input
					type="url"
					id="website_url"
					name="website_url"
					placeholder="https://example.com"
					value={formData.website_url}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
				<p className="mt-1 text-sm text-gray-500">
					店舗の公式Webサイトがある場合に入力してください（任意）
				</p>
			</div>

			<div>
				<label
					htmlFor="instagram_url"
					className="block text-sm font-medium text-gray-700"
				>
					Instagram URL
				</label>
				<input
					type="url"
					id="instagram_url"
					name="instagram_url"
					placeholder="https://www.instagram.com/your_account"
					value={formData.instagram_url}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="x_url"
					className="block text-sm font-medium text-gray-700"
				>
					X（Twitter）URL
				</label>
				<input
					type="url"
					id="x_url"
					name="x_url"
					placeholder="https://x.com/example"
					value={formData.x_url}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
				<p className="mt-1 text-sm text-gray-500">
					店舗の公式Xアカウントがある場合に入力してください（任意）
				</p>
			</div>

			<div>
				<label
					htmlFor="facebook_url"
					className="block text-sm font-medium text-gray-700"
				>
					Facebook URL
				</label>
				<input
					type="url"
					id="facebook_url"
					name="facebook_url"
					placeholder="https://www.facebook.com/yourpage"
					value={formData.facebook_url}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
				<p className="mt-1 text-sm text-gray-500">
					店舗の公式Facebookページがある場合に入力してください（任意）
				</p>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					プレビュー画像
				</label>
				<p className="text-sm text-gray-500 mb-3">
					店舗一覧ページに表示されるサムネイル画像です（推奨: 16:9 または
					4:3、最大5MB、JPEG/PNG/WebP）
				</p>

				{imageError && (
					<div className="mb-3 rounded-md bg-red-50 p-3">
						<p className="text-sm text-red-800">{imageError}</p>
					</div>
				)}

				{previewImageUrl ? (
					<div className="space-y-3">
						<div className="relative w-full max-w-md">
							<img
								src={previewImageUrl}
								alt="プレビュー画像"
								className="w-full h-auto rounded-lg border border-gray-300"
							/>
						</div>
						<div className="flex space-x-2">
							<label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
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
								className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								削除
							</button>
						</div>
					</div>
				) : (
					<div>
						<label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
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

			<div className="border-t border-gray-200 pt-6">
				<SliderMediaManager
					barId={isEdit && bar?.id ? bar.id.toString() : null}
					onFilesChange={setSliderMediaFiles}
				/>
			</div>

			<div>
				<label
					htmlFor="description"
					className="block text-sm font-medium text-gray-700"
				>
					紹介文
				</label>
				<textarea
					id="description"
					name="description"
					rows={4}
					value={formData.description}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					支払い方法
				</label>
				<div className="space-y-2">
					{paymentMethods.map((pm) => (
						<label key={pm.id} className="flex items-center">
							<input
								type="checkbox"
								checked={formData.payment_method_ids?.includes(pm.id) || false}
								onChange={() => handlePaymentMethodChange(pm.id)}
								className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							/>
							<span className="ml-2 text-sm text-gray-700">{pm.name}</span>
						</label>
					))}
				</div>
			</div>

			<OpeningHoursEditor
				value={openingHours}
				onChange={setOpeningHours}
				errors={openingHoursErrors}
			/>

			<div className="flex justify-end space-x-3">
				<button
					type="button"
					onClick={() => router.back()}
					className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					キャンセル
				</button>
				<button
					type="submit"
					disabled={loading}
					className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "保存中..." : "保存"}
				</button>
			</div>
		</form>
	);
}
