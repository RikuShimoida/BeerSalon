"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

interface ArticleCreateFormProps {
	barId: string;
}

interface ImageItem {
	file: File;
	preview: string;
}

export default function ArticleCreateForm({ barId }: ArticleCreateFormProps) {
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [images, setImages] = useState<ImageItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImageAdd = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (!files) return;

			const remaining = 3 - images.length;
			const filesToAdd = Array.from(files).slice(0, remaining);

			const newImages = filesToAdd.map((file) => ({
				file,
				preview: URL.createObjectURL(file),
			}));

			setImages((prev) => [...prev, ...newImages]);

			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		},
		[images.length],
	);

	const handleImageRemove = useCallback((index: number) => {
		setImages((prev) => {
			const removed = prev[index];
			URL.revokeObjectURL(removed.preview);
			return prev.filter((_, i) => i !== index);
		});
	}, []);

	const uploadImage = async (file: File): Promise<string> => {
		const formData = new FormData();
		formData.append("file", file);

		const res = await fetch(`/api/bars/${barId}/articles/upload`, {
			method: "POST",
			body: formData,
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
		setSuccess(false);

		try {
			const uploadedUrls: string[] = [];
			for (const img of images) {
				const url = await uploadImage(img.file);
				uploadedUrls.push(url);
			}

			const res = await fetch(`/api/bars/${barId}/articles`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title,
					body,
					image_url: uploadedUrls[0] || null,
					image_url_2: uploadedUrls[1] || null,
					image_url_3: uploadedUrls[2] || null,
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				setError(data.error || "投稿に失敗しました");
				return;
			}

			setTitle("");
			setBody("");
			for (const img of images) {
				URL.revokeObjectURL(img.preview);
			}
			setImages([]);
			setSuccess(true);
		} catch (_error) {
			setError("投稿に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
			{error && (
				<div className="rounded-md bg-red-50 p-4">
					<p className="text-sm text-red-800">{error}</p>
				</div>
			)}

			{success && (
				<div className="rounded-md bg-green-50 p-4">
					<p className="text-sm text-green-800">記事を投稿しました</p>
				</div>
			)}

			<div>
				<label
					htmlFor="title"
					className="block text-sm font-medium text-gray-700"
				>
					タイトル <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					id="title"
					required
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
				/>
			</div>

			<div>
				<label
					htmlFor="body"
					className="block text-sm font-medium text-gray-700"
				>
					本文 <span className="text-red-500">*</span>
				</label>
				<textarea
					id="body"
					required
					rows={10}
					value={body}
					onChange={(e) => setBody(e.target.value)}
					className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					画像（最大3枚）
				</label>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					multiple
					onChange={handleFileChange}
					className="hidden"
				/>

				<div className="flex flex-wrap gap-4">
					{images.map((img, index) => (
						<div key={img.preview} className="relative w-32 h-32">
							<Image
								src={img.preview}
								alt={`画像 ${index + 1}`}
								fill
								className="object-cover rounded-md border border-gray-200"
							/>
							<button
								type="button"
								onClick={() => handleImageRemove(index)}
								className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
							>
								x
							</button>
						</div>
					))}

					{images.length < 3 && (
						<button
							type="button"
							onClick={handleImageAdd}
							className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
						>
							<span className="text-2xl">+</span>
						</button>
					)}
				</div>
			</div>

			<div className="pt-4">
				<button
					type="submit"
					disabled={loading}
					className="w-full px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "投稿中..." : "投稿する"}
				</button>
			</div>
		</form>
	);
}
