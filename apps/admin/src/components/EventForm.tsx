"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toDateTimeLocalValue } from "@/lib/datetime-local";
import type { BarEvent } from "@/types/database";

interface EventFormProps {
	barId: string;
	eventId?: string;
}

interface ImageState {
	file: File | null;
	preview: string;
}

export default function EventForm({ barId, eventId }: EventFormProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [formData, setFormData] = useState({
		title: "",
		description: "",
		start_date: "",
		end_date: "",
		is_active: true,
	});

	const [image, setImage] = useState<ImageState | null>(null);
	const [existingImageUrl, setExistingImageUrl] = useState("");

	useEffect(() => {
		const loadEvent = async () => {
			try {
				const response = await fetch(`/api/bars/${barId}/events/${eventId}`);

				if (!response.ok) {
					setError("イベントの取得に失敗しました");
					return;
				}

				const data = await response.json();
				const event: BarEvent = data.event;

				setFormData({
					title: event.title,
					description: event.description || "",
					start_date: toDateTimeLocalValue(event.start_date),
					end_date: toDateTimeLocalValue(event.end_date),
					is_active: event.is_active,
				});

				if (event.image_url) {
					setExistingImageUrl(event.image_url);
				}
			} catch (_error) {
				setError("イベントの取得に失敗しました");
			}
		};

		if (eventId) {
			loadEvent();
		}
	}, [eventId, barId]);

	useEffect(() => {
		return () => {
			if (image?.file) {
				URL.revokeObjectURL(image.preview);
			}
		};
	}, [image]);

	const uploadImage = async (file: File): Promise<string> => {
		const uploadFormData = new FormData();
		uploadFormData.append("file", file);

		const res = await fetch(`/api/bars/${barId}/events/upload`, {
			method: "POST",
			body: uploadFormData,
		});

		if (!res.ok) {
			const data = await res.json();
			throw new Error(data.error || "画像のアップロードに失敗しました");
		}

		const data = await res.json();
		return data.url;
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			let imageUrl: string | null = existingImageUrl || null;

			if (image?.file) {
				imageUrl = await uploadImage(image.file);
			}

			const url = eventId
				? `/api/bars/${barId}/events/${eventId}`
				: `/api/bars/${barId}/events`;

			const method = eventId ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: formData.title,
					description: formData.description || null,
					start_date: formData.start_date
						? new Date(formData.start_date).toISOString()
						: null,
					end_date: formData.end_date
						? new Date(formData.end_date).toISOString()
						: null,
					image_url: imageUrl,
					is_active: formData.is_active,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				setError(data.error || "保存に失敗しました");
				return;
			}

			router.push(`/bars/${barId}/events`);
		} catch (_error) {
			setError("保存に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value, type } = e.target;

		if (type === "checkbox") {
			const checked = (e.target as HTMLInputElement).checked;
			setFormData((prev) => ({ ...prev, [name]: checked }));
		} else {
			setFormData((prev) => ({ ...prev, [name]: value }));
		}
	};

	const handleImageAdd = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (!files || files.length === 0) return;

			const file = files[0];

			if (image?.file) {
				URL.revokeObjectURL(image.preview);
			}

			setImage({
				file,
				preview: URL.createObjectURL(file),
			});
			setExistingImageUrl("");

			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		},
		[image],
	);

	const handleImageRemove = useCallback(() => {
		if (image?.file) {
			URL.revokeObjectURL(image.preview);
		}
		setImage(null);
		setExistingImageUrl("");
	}, [image]);

	const currentPreview = image?.preview || existingImageUrl;

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{error && (
				<div className="rounded-md bg-red-50 p-4">
					<p className="text-sm text-red-800">{error}</p>
				</div>
			)}

			<div>
				<label
					htmlFor="title"
					className="block text-sm font-medium text-gray-700"
				>
					イベント名 <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					id="title"
					name="title"
					required
					value={formData.title}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					placeholder="ビールフェスティバル"
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<label
						htmlFor="start_date"
						className="block text-sm font-medium text-gray-700"
					>
						開始日時 <span className="text-red-500">*</span>
					</label>
					<input
						type="datetime-local"
						id="start_date"
						name="start_date"
						required
						value={formData.start_date}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					/>
				</div>

				<div>
					<label
						htmlFor="end_date"
						className="block text-sm font-medium text-gray-700"
					>
						終了日時
					</label>
					<input
						type="datetime-local"
						id="end_date"
						name="end_date"
						value={formData.end_date}
						onChange={handleChange}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					/>
				</div>
			</div>

			<div>
				<label
					htmlFor="description"
					className="block text-sm font-medium text-gray-700"
				>
					説明
				</label>
				<textarea
					id="description"
					name="description"
					rows={6}
					value={formData.description}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
					placeholder="イベントの詳細を入力してください"
				/>
			</div>

			<div>
				<label
					htmlFor="event_image"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					画像
				</label>
				<input
					ref={fileInputRef}
					id="event_image"
					type="file"
					accept="image/jpeg,image/png,image/webp"
					onChange={handleFileChange}
					className="hidden"
				/>

				<div className="flex flex-wrap gap-4">
					{currentPreview && (
						<div className="relative w-32 h-32">
							<Image
								src={currentPreview}
								alt="イベント画像"
								fill
								className="object-cover rounded-md border border-gray-200"
							/>
							<button
								type="button"
								onClick={handleImageRemove}
								className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
							>
								x
							</button>
						</div>
					)}

					{!currentPreview && (
						<button
							type="button"
							onClick={handleImageAdd}
							className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
						>
							<span className="text-2xl">+</span>
						</button>
					)}
				</div>
				<p className="mt-1 text-xs text-gray-500">
					JPEG、PNG、WebP形式（最大5MB）
				</p>
			</div>

			<div className="flex items-center">
				<input
					type="checkbox"
					id="is_active"
					name="is_active"
					checked={formData.is_active}
					onChange={handleChange}
					className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
				/>
				<label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
					公開する
				</label>
			</div>

			<div className="flex justify-end space-x-3">
				<button
					type="button"
					onClick={() => router.back()}
					className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
				>
					キャンセル
				</button>
				<button
					type="submit"
					disabled={loading}
					className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "保存中..." : eventId ? "更新" : "作成"}
				</button>
			</div>
		</form>
	);
}
