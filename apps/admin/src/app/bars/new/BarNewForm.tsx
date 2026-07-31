"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import BarProfileFields from "@/components/BarProfileFields";
import OpeningHoursEditor from "@/components/OpeningHoursEditor";
import SliderMediaManager from "@/components/SliderMediaManager";
import {
	createInitialOpeningHours,
	INITIAL_BAR_PROFILE_FIELDS,
	type OpeningHourInput,
	validateBarSnsUrls,
} from "@/lib/bar-form";
import { SHIZUOKA_PREFECTURE } from "@/lib/shizuoka-cities";
import { validateCoordinates } from "@/lib/validators";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const REDIRECT_DELAY_MS = 3000;

export default function BarNewForm() {
	const router = useRouter();
	const [step, setStep] = useState<1 | 2>(1);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [openingHoursErrors, setOpeningHoursErrors] = useState<{
		[key: string]: string;
	}>({});

	const [phase1, setPhase1] = useState({
		bar_manage_id: "",
		password: "",
		contact_email: "",
		contact_phone: "",
	});

	const [phase2, setPhase2] = useState(INITIAL_BAR_PROFILE_FIELDS);

	// Images
	const [previewImageFile, setPreviewImageFile] = useState<File | null>(null);
	const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
	const [imageError, setImageError] = useState("");
	const [sliderMediaFiles, setSliderMediaFiles] = useState<File[]>([]);

	const [openingHours, setOpeningHours] = useState<OpeningHourInput[]>(
		createInitialOpeningHours,
	);

	const [regularHoliday, setRegularHoliday] = useState("");

	const handlePhase1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPhase1({ ...phase1, [e.target.name]: e.target.value });
	};

	const handlePhase2Change = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		setPhase2({ ...phase2, [e.target.name]: e.target.value });
	};

	const validatePhase1 = (): boolean => {
		if (!phase1.bar_manage_id.trim()) {
			setError("店舗IDを入力してください");
			return false;
		}
		if (!SLUG_PATTERN.test(phase1.bar_manage_id)) {
			setError(
				"店舗IDは半角英数字とハイフンのみ使用できます（例: fuji-beer-bar）",
			);
			return false;
		}
		if (!phase1.password || phase1.password.length < 8) {
			setError("パスワードは8文字以上で入力してください");
			return false;
		}
		if (!phase1.contact_email.trim()) {
			setError("メールアドレスを入力してください");
			return false;
		}
		if (!phase1.contact_phone.trim()) {
			setError("電話番号を入力してください");
			return false;
		}
		return true;
	};

	const handleNext = () => {
		setError("");
		if (validatePhase1()) {
			setStep(2);
		}
	};

	const handleBack = () => {
		setError("");
		setStep(1);
	};

	const handlePreviewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

		setPreviewImageFile(file);
		setPreviewImageUrl(URL.createObjectURL(file));
	};

	const handlePreviewImageDelete = () => {
		if (previewImageUrl?.startsWith("blob:")) {
			URL.revokeObjectURL(previewImageUrl);
		}
		setPreviewImageFile(null);
		setPreviewImageUrl(null);
		setImageError("");
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

		const snsResult = validateBarSnsUrls(phase2);
		if (!snsResult.isValid) {
			setError(snsResult.error);
			return;
		}

		const coordinatesResult = validateCoordinates(
			phase2.latitude,
			phase2.longitude,
		);
		if (!coordinatesResult.isValid) {
			setError(coordinatesResult.error);
			return;
		}

		if (!validateOpeningHours()) {
			setError("営業時間の入力に誤りがあります");
			return;
		}

		setLoading(true);

		try {
			const filteredOpeningHours = openingHours.filter(
				(h) => h.is_closed || (h.open_time !== "" && h.close_time !== ""),
			);

			const response = await fetch("/api/bars", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...phase1,
					...phase2,
					prefecture: phase2.prefecture || SHIZUOKA_PREFECTURE,
					regular_holiday: regularHoliday.trim() || null,
					opening_hours: filteredOpeningHours,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				setError(data.error || "登録に失敗しました");
				return;
			}

			const responseData = await response.json();

			if (responseData.id) {
				const uploadErrors: string[] = [];

				if (previewImageFile) {
					try {
						const imageFormData = new FormData();
						imageFormData.append("file", previewImageFile);
						const imageResponse = await fetch(
							`/api/bars/${responseData.id}/preview-image`,
							{ method: "POST", body: imageFormData },
						);
						if (!imageResponse.ok) {
							// Why not: 店舗登録は admin 専用画面のため、API が admin に返す detail をそのまま表示して原因を追いやすくする
							const detail = await imageResponse
								.json()
								.then((d) => d.detail as string | undefined)
								.catch(() => undefined);
							uploadErrors.push(
								detail ? `プレビュー画像 (${detail})` : "プレビュー画像",
							);
						}
					} catch {
						uploadErrors.push("プレビュー画像");
					}
				}

				for (const file of sliderMediaFiles) {
					try {
						const mediaFormData = new FormData();
						mediaFormData.append("file", file);
						const mediaResponse = await fetch(
							`/api/bars/${responseData.id}/media`,
							{ method: "POST", body: mediaFormData },
						);
						if (!mediaResponse.ok) {
							uploadErrors.push(`スライダーメディア (${file.name})`);
						}
					} catch {
						uploadErrors.push(`スライダーメディア (${file.name})`);
					}
				}

				if (uploadErrors.length > 0) {
					setError(
						`店舗は登録されましたが、以下のアップロードに失敗しました: ${uploadErrors.join(", ")}。編集画面から再度アップロードしてください。`,
					);
					// Why not: 一覧へ戻すと画像欠落が「No Image」に埋もれて気付けないため、再アップロード可能な編集画面へ誘導する
					setTimeout(() => {
						router.push(`/bars/${responseData.id}/edit`);
						router.refresh();
					}, REDIRECT_DELAY_MS);
					return;
				}
			}

			router.push("/bars");
			router.refresh();
		} catch (_err) {
			setError("登録に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-6 max-w-2xl mx-auto">
			<h1 className="text-2xl font-bold text-gray-900 mb-6">店舗登録</h1>

			{/* Stepper */}
			<div className="flex items-center mb-8">
				<div className="flex items-center">
					<div
						className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
							step >= 1 ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-500"
						}`}
					>
						1
					</div>
					<span
						className={`ml-2 text-sm font-medium ${
							step >= 1 ? "text-gray-900" : "text-gray-400"
						}`}
					>
						必須項目
					</span>
				</div>
				<div className="flex-1 mx-4 h-px bg-gray-300" />
				<div className="flex items-center">
					<div
						className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
							step >= 2 ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-500"
						}`}
					>
						2
					</div>
					<span
						className={`ml-2 text-sm font-medium ${
							step >= 2 ? "text-gray-900" : "text-gray-400"
						}`}
					>
						店舗情報
					</span>
				</div>
			</div>

			{error && (
				<div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
					<p className="text-sm text-red-800">{error}</p>
				</div>
			)}

			{step === 1 && (
				<div className="space-y-6">
					<div>
						<label
							htmlFor="bar_manage_id"
							className="block text-sm font-medium text-gray-700"
						>
							店舗ID <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="bar_manage_id"
							name="bar_manage_id"
							value={phase1.bar_manage_id}
							onChange={handlePhase1Change}
							placeholder="fuji-beer-bar"
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
						/>
						<p className="mt-1 text-sm text-gray-500">
							半角英数字とハイフンのみ（ログイン時に使用）
						</p>
					</div>

					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-gray-700"
						>
							パスワード <span className="text-red-500">*</span>
						</label>
						<input
							type="password"
							id="password"
							name="password"
							value={phase1.password}
							onChange={handlePhase1Change}
							placeholder="8文字以上"
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
						/>
						<p className="mt-1 text-sm text-gray-500">
							店舗スタッフ全員で共有するパスワード
						</p>
					</div>

					<div>
						<label
							htmlFor="contact_email"
							className="block text-sm font-medium text-gray-700"
						>
							店舗管理者メールアドレス <span className="text-red-500">*</span>
						</label>
						<input
							type="email"
							id="contact_email"
							name="contact_email"
							value={phase1.contact_email}
							onChange={handlePhase1Change}
							placeholder="owner@fuji-beer.com"
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
						/>
						<p className="mt-1 text-sm text-gray-500">請求書送付用</p>
					</div>

					<div>
						<label
							htmlFor="contact_phone"
							className="block text-sm font-medium text-gray-700"
						>
							店舗管理者電話番号 <span className="text-red-500">*</span>
						</label>
						<input
							type="tel"
							id="contact_phone"
							name="contact_phone"
							value={phase1.contact_phone}
							onChange={handlePhase1Change}
							placeholder="090-1234-5678"
							className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
						/>
						<p className="mt-1 text-sm text-gray-500">トラブル時連絡用</p>
					</div>

					<div className="flex justify-end">
						<button
							type="button"
							onClick={handleNext}
							className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
						>
							次へ
						</button>
					</div>
				</div>
			)}

			{step === 2 && (
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
							value={phase2.name}
							onChange={handlePhase2Change}
							placeholder="富士ビアバー"
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
							value={phase2.description}
							onChange={handlePhase2Change}
							placeholder="店舗の紹介文"
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

					<BarProfileFields fields={phase2} onChange={handlePhase2Change} />

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
											onChange={handlePreviewImageSelect}
											className="hidden"
										/>
										画像を変更
									</label>
									<button
										type="button"
										onClick={handlePreviewImageDelete}
										className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
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
										onChange={handlePreviewImageSelect}
										className="hidden"
									/>
									画像を選択
								</label>
								<p className="mt-2 text-sm text-gray-500">
									画像が設定されていません
								</p>
							</div>
						)}
					</div>

					{/* Slider media section */}
					<div className="border-t border-gray-200 pt-6">
						<SliderMediaManager
							barId={null}
							onFilesChange={setSliderMediaFiles}
						/>
					</div>

					<div className="flex justify-between">
						<button
							type="button"
							onClick={handleBack}
							className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
						>
							戻る
						</button>
						<button
							type="submit"
							disabled={loading}
							className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? "登録中..." : "登録する"}
						</button>
					</div>
				</form>
			)}
		</div>
	);
}
