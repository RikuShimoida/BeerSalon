"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Media {
	id: number;
	bar_id: number;
	media_type: "image" | "video";
	image_type: string;
	image_url: string;
	sort_order: number;
	created_at: string;
}

interface LocalMedia {
	file: File;
	previewUrl: string;
	media_type: "image" | "video";
}

interface SliderMediaManagerProps {
	barId?: string | null;
	onFilesChange?: (files: File[]) => void;
}

const MAX_MEDIA_COUNT = 5;

export default function SliderMediaManager({
	barId,
	onFilesChange,
}: SliderMediaManagerProps) {
	const [media, setMedia] = useState<Media[]>([]);
	const [localMedia, setLocalMedia] = useState<LocalMedia[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState("");
	const [previewMedia, setPreviewMedia] = useState<Media | LocalMedia | null>(
		null,
	);

	const isEditMode = !!barId;

	useEffect(() => {
		if (isEditMode) {
			fetchMedia();
		} else {
			setLoading(false);
		}
	}, [barId, isEditMode]);

	const fetchMedia = async () => {
		if (!barId) return;
		try {
			const response = await fetch(`/api/bars/${barId}/media`);
			if (!response.ok) {
				setError("メディアの取得に失敗しました");
				return;
			}
			const data = await response.json();
			setMedia(data.media || []);
		} catch (error) {
			setError("メディアの取得に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const totalCount = isEditMode ? media.length : localMedia.length;
		if (totalCount >= MAX_MEDIA_COUNT) {
			alert("スライダー用メディアは最大5枚までです");
			return;
		}

		setError("");

		// ファイル形式とサイズのバリデーション
		const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
		const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
		const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
		const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

		const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
		const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

		if (!isImage && !isVideo) {
			setError(
				"画像形式はJPEG、PNG、WebP、動画形式はMP4、WebMのみ対応しています",
			);
			return;
		}

		if (isImage && file.size > MAX_IMAGE_SIZE) {
			setError("画像サイズは5MB以下にしてください");
			return;
		}

		if (isVideo && file.size > MAX_VIDEO_SIZE) {
			setError("動画サイズは50MB以下にしてください");
			return;
		}

		if (isEditMode) {
			// 編集モード: すぐにアップロード
			setUploading(true);
			try {
				const formData = new FormData();
				formData.append("file", file);

				const response = await fetch(`/api/bars/${barId}/media`, {
					method: "POST",
					body: formData,
				});

				const data = await response.json();

				if (!response.ok) {
					setError(data.error || "アップロードに失敗しました");
					return;
				}

				await fetchMedia();
				e.target.value = "";
			} catch (error) {
				setError("アップロードに失敗しました");
			} finally {
				setUploading(false);
			}
		} else {
			// 新規作成モード: ローカルに保存
			const previewUrl = URL.createObjectURL(file);
			const newLocalMedia: LocalMedia = {
				file,
				previewUrl,
				media_type: isImage ? "image" : "video",
			};

			const updatedLocalMedia = [...localMedia, newLocalMedia];
			setLocalMedia(updatedLocalMedia);

			// 親コンポーネントに通知
			if (onFilesChange) {
				onFilesChange(updatedLocalMedia.map((m) => m.file));
			}

			e.target.value = "";
		}
	};

	const handleDelete = async (index: number, mediaId?: number) => {
		if (!confirm("このメディアを削除しますか？")) return;

		if (isEditMode && mediaId) {
			// 編集モード: サーバーから削除
			try {
				const response = await fetch(`/api/bars/${barId}/media/${mediaId}`, {
					method: "DELETE",
				});

				if (!response.ok) {
					alert("削除に失敗しました");
					return;
				}

				await fetchMedia();
			} catch (error) {
				alert("削除に失敗しました");
			}
		} else {
			// 新規作成モード: ローカルから削除
			const mediaToDelete = localMedia[index];
			if (mediaToDelete) {
				URL.revokeObjectURL(mediaToDelete.previewUrl);
			}

			const updatedLocalMedia = localMedia.filter((_, i) => i !== index);
			setLocalMedia(updatedLocalMedia);

			if (onFilesChange) {
				onFilesChange(updatedLocalMedia.map((m) => m.file));
			}
		}
	};

	const handleMoveUp = async (index: number) => {
		if (index === 0) return;

		if (isEditMode) {
			// 編集モード: サーバーで並び替え
			const newMedia = [...media];
			[newMedia[index - 1], newMedia[index]] = [
				newMedia[index],
				newMedia[index - 1],
			];
			const mediaIds = newMedia.map((m) => m.id);

			try {
				const response = await fetch(`/api/bars/${barId}/media/reorder`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ mediaIds }),
				});

				if (!response.ok) {
					alert("順序の変更に失敗しました");
					return;
				}

				await fetchMedia();
			} catch (error) {
				alert("順序の変更に失敗しました");
			}
		} else {
			// 新規作成モード: ローカルで並び替え
			const newLocalMedia = [...localMedia];
			[newLocalMedia[index - 1], newLocalMedia[index]] = [
				newLocalMedia[index],
				newLocalMedia[index - 1],
			];
			setLocalMedia(newLocalMedia);

			if (onFilesChange) {
				onFilesChange(newLocalMedia.map((m) => m.file));
			}
		}
	};

	const handleMoveDown = async (index: number) => {
		const maxIndex = isEditMode ? media.length - 1 : localMedia.length - 1;
		if (index === maxIndex) return;

		if (isEditMode) {
			// 編集モード: サーバーで並び替え
			const newMedia = [...media];
			[newMedia[index], newMedia[index + 1]] = [
				newMedia[index + 1],
				newMedia[index],
			];
			const mediaIds = newMedia.map((m) => m.id);

			try {
				const response = await fetch(`/api/bars/${barId}/media/reorder`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ mediaIds }),
				});

				if (!response.ok) {
					alert("順序の変更に失敗しました");
					return;
				}

				await fetchMedia();
			} catch (error) {
				alert("順序の変更に失敗しました");
			}
		} else {
			// 新規作成モード: ローカルで並び替え
			const newLocalMedia = [...localMedia];
			[newLocalMedia[index], newLocalMedia[index + 1]] = [
				newLocalMedia[index + 1],
				newLocalMedia[index],
			];
			setLocalMedia(newLocalMedia);

			if (onFilesChange) {
				onFilesChange(newLocalMedia.map((m) => m.file));
			}
		}
	};

	if (loading) {
		return (
			<div className="animate-pulse space-y-3">
				<div className="h-6 bg-gray-200 rounded w-1/4"></div>
				<div className="h-32 bg-gray-200 rounded"></div>
			</div>
		);
	}

	const displayMedia = isEditMode ? media : localMedia;
	const currentCount = displayMedia.length;

	return (
		<div>
			<div className="flex justify-between items-center mb-3">
				<div>
					<label className="block text-sm font-medium text-gray-700">
						スライダー用メディア
					</label>
					<p className="text-xs text-gray-500 mt-1">
						店舗詳細ページのスライダーに表示されます（登録済み: {currentCount} /{" "}
						{MAX_MEDIA_COUNT}枚）
					</p>
				</div>
				<div>
					<input
						type="file"
						accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
						onChange={handleFileSelect}
						className="hidden"
						id="slider-media-upload"
						disabled={currentCount >= MAX_MEDIA_COUNT || uploading}
					/>
					<label
						htmlFor="slider-media-upload"
						className={`inline-flex items-center px-3 py-1.5 text-sm rounded cursor-pointer ${
							currentCount >= MAX_MEDIA_COUNT || uploading
								? "bg-gray-300 text-gray-500 cursor-not-allowed"
								: "bg-blue-600 text-white hover:bg-blue-700"
						}`}
					>
						{uploading ? "アップロード中..." : "+ 追加"}
					</label>
				</div>
			</div>

			{error && (
				<div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
					{error}
				</div>
			)}

			{currentCount === 0 ? (
				<div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
					<p className="text-sm text-gray-600">メディアが登録されていません</p>
					<p className="text-xs text-gray-500 mt-1">
						画像（JPEG, PNG, WebP）または動画（MP4, WebM）をアップロード
					</p>
				</div>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
					{isEditMode
						? media.map((item, index) => (
								<div
									key={item.id}
									className="bg-gray-50 rounded-lg p-3 border border-gray-200"
								>
									<div className="relative aspect-video bg-gray-100 rounded mb-2">
										{item.media_type === "image" ? (
											<Image
												src={item.image_url}
												alt={`スライダー画像 ${index + 1}`}
												fill
												className="object-cover rounded cursor-pointer"
												onClick={() => setPreviewMedia(item)}
											/>
										) : (
											<video
												src={item.image_url}
												className="w-full h-full object-cover rounded cursor-pointer"
												onClick={() => setPreviewMedia(item)}
											/>
										)}
										<div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
											{item.media_type === "image" ? "画像" : "動画"}
										</div>
									</div>

									<div className="flex items-center justify-between mb-2">
										<span className="text-xs text-gray-600">
											表示順: {index + 1}
										</span>
										<div className="flex gap-1">
											<button
												type="button"
												onClick={() => handleMoveUp(index)}
												disabled={index === 0}
												className={`px-2 py-0.5 text-xs rounded ${
													index === 0
														? "bg-gray-100 text-gray-400 cursor-not-allowed"
														: "bg-gray-200 hover:bg-gray-300"
												}`}
											>
												↑
											</button>
											<button
												type="button"
												onClick={() => handleMoveDown(index)}
												disabled={index === media.length - 1}
												className={`px-2 py-0.5 text-xs rounded ${
													index === media.length - 1
														? "bg-gray-100 text-gray-400 cursor-not-allowed"
														: "bg-gray-200 hover:bg-gray-300"
												}`}
											>
												↓
											</button>
										</div>
									</div>

									<button
										type="button"
										onClick={() => handleDelete(index, item.id)}
										className="w-full px-2 py-1 text-xs border border-red-300 text-red-700 rounded hover:bg-red-50"
									>
										削除
									</button>
								</div>
							))
						: localMedia.map((item, index) => (
								<div
									key={index}
									className="bg-gray-50 rounded-lg p-3 border border-gray-200"
								>
									<div className="relative aspect-video bg-gray-100 rounded mb-2">
										{item.media_type === "image" ? (
											<img
												src={item.previewUrl}
												alt={`スライダー画像 ${index + 1}`}
												className="w-full h-full object-cover rounded cursor-pointer"
												onClick={() => setPreviewMedia(item)}
											/>
										) : (
											<video
												src={item.previewUrl}
												className="w-full h-full object-cover rounded cursor-pointer"
												onClick={() => setPreviewMedia(item)}
											/>
										)}
										<div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
											{item.media_type === "image" ? "画像" : "動画"}
										</div>
									</div>

									<div className="flex items-center justify-between mb-2">
										<span className="text-xs text-gray-600">
											表示順: {index + 1}
										</span>
										<div className="flex gap-1">
											<button
												type="button"
												onClick={() => handleMoveUp(index)}
												disabled={index === 0}
												className={`px-2 py-0.5 text-xs rounded ${
													index === 0
														? "bg-gray-100 text-gray-400 cursor-not-allowed"
														: "bg-gray-200 hover:bg-gray-300"
												}`}
											>
												↑
											</button>
											<button
												type="button"
												onClick={() => handleMoveDown(index)}
												disabled={index === localMedia.length - 1}
												className={`px-2 py-0.5 text-xs rounded ${
													index === localMedia.length - 1
														? "bg-gray-100 text-gray-400 cursor-not-allowed"
														: "bg-gray-200 hover:bg-gray-300"
												}`}
											>
												↓
											</button>
										</div>
									</div>

									<button
										type="button"
										onClick={() => handleDelete(index)}
										className="w-full px-2 py-1 text-xs border border-red-300 text-red-700 rounded hover:bg-red-50"
									>
										削除
									</button>
								</div>
							))}
				</div>
			)}

			{previewMedia && (
				<div
					className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
					onClick={() => setPreviewMedia(null)}
				>
					<div className="max-w-4xl max-h-screen p-4">
						{previewMedia.media_type === "image" ? (
							<img
								src={
									"image_url" in previewMedia
										? previewMedia.image_url
										: previewMedia.previewUrl
								}
								alt="プレビュー"
								className="max-w-full max-h-screen object-contain"
							/>
						) : (
							<video
								src={
									"image_url" in previewMedia
										? previewMedia.image_url
										: previewMedia.previewUrl
								}
								controls
								className="max-w-full max-h-screen"
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
