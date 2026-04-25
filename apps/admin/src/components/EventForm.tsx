"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarEvent } from "@/types/database";

interface EventFormProps {
	barId: string;
	eventId?: string;
}

export default function EventForm({ barId, eventId }: EventFormProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [formData, setFormData] = useState({
		title: "",
		description: "",
		start_date: "",
		end_date: "",
		image_url: "",
		is_active: true,
	});

	useEffect(() => {
		if (eventId) {
			fetchEvent();
		}
	}, [eventId]);

	const fetchEvent = async () => {
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
				start_date: event.start_date
					? new Date(event.start_date).toISOString().slice(0, 16)
					: "",
				end_date: event.end_date
					? new Date(event.end_date).toISOString().slice(0, 16)
					: "",
				image_url: event.image_url || "",
				is_active: event.is_active,
			});
		} catch (error) {
			console.error("Failed to fetch event:", error);
			setError("イベントの取得に失敗しました");
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
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
					image_url: formData.image_url || null,
					is_active: formData.is_active,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				setError(data.error || "保存に失敗しました");
				return;
			}

			router.push(`/bars/${barId}/events`);
		} catch (error) {
			console.error("Failed to save event:", error);
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
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					placeholder="イベントの詳細を入力してください"
				/>
			</div>

			<div>
				<label
					htmlFor="image_url"
					className="block text-sm font-medium text-gray-700"
				>
					画像URL
				</label>
				<input
					type="url"
					id="image_url"
					name="image_url"
					value={formData.image_url}
					onChange={handleChange}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
					placeholder="https://example.com/image.jpg"
				/>
			</div>

			<div className="flex items-center">
				<input
					type="checkbox"
					id="is_active"
					name="is_active"
					checked={formData.is_active}
					onChange={handleChange}
					className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
				/>
				<label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
					公開する
				</label>
			</div>

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
					{loading ? "保存中..." : eventId ? "更新" : "作成"}
				</button>
			</div>
		</form>
	);
}
