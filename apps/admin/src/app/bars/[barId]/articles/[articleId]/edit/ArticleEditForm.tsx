"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Article } from "@/types/database";

interface ArticleEditFormProps {
	barId: string;
	articleId: string;
}

interface ImageSlot {
	url: string;
	file?: File;
	preview: string;
}

export default function ArticleEditForm({
	barId,
	articleId,
}: ArticleEditFormProps) {
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [images, setImages] = useState<ImageSlot[]>([]);
	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);
	const [error, setError] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const fetchArticle = useCallback(async () => {
		try {
			const res = await fetch(`/api/bars/${barId}/articles/${articleId}`);
			if (!res.ok) {
				setError("記事の取得に失敗しました");
				return;
			}
			const data = await res.json();
			const article: Article = data.article;

			setTitle(article.title);
			setBody(article.body);

			const existingImages: ImageSlot[] = [];
			if (article.image_url) {
				existingImages.push({
					url: article.image_url,
					preview: article.image_url,
				});
			}
			if (article.image_url_2) {
				existingImages.push({
					url: article.image_url_2,
					preview: article.image_url_2,
				});
			}
			if (article.image_url_3) {
				existingImages.push({
					url: article.image_url_3,
					preview: article.image_url_3,
				});
			}
			setImages(existingImages);
		} catch (_error) {
			setError("記事の取得に失敗しました");
		} finally {
			setFetching(false);
		}
	}, [barId, articleId]);

	useEffect(() => {
		fetchArticle();
	}, [fetchArticle]);

	const handleImageAdd = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (!files) return;

			const remaining = 3 - images.length;
			const filesToAdd = Array.from(files).slice(0, remaining);

			const newImages: ImageSlot[] = filesToAdd.map((file) => ({
				url: "",
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
			if (removed.preview.startsWith("blob:")) {
				URL.revokeObjectURL(removed.preview);
			}
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

		try {
			const uploadedUrls: string[] = [];
			for (const img of images) {
				if (img.file) {
					const url = await uploadImage(img.file);
					uploadedUrls.push(url);
				} else {
					uploadedUrls.push(img.url);
				}
			}

			const res = await fetch(`/api/bars/${barId}/articles/${articleId}`, {
				method: "PUT",
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
				setError(data.error || "更新に失敗しました");
				return;
			}

			router.push(`/bars/${barId}/articles/${articleId}`);
		} catch (_error) {
			setError("更新に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	if (fetching) {
		return (
			<div className="animate-pulse space-y-4">
				<div className="h-8 bg-gray-200 rounded w-1/3" />
				<div className="h-64 bg-gray-200 rounded" />
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
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
				<label
					htmlFor="article-edit-images"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					画像（最大3枚）
				</label>
				<input
					ref={fileInputRef}
					id="article-edit-images"
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

			<div className="flex gap-3 pt-4">
				<button
					type="button"
					onClick={() => router.back()}
					className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
				>
					キャンセル
				</button>
				<button
					type="submit"
					disabled={loading}
					className="flex-1 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "更新中..." : "更新する"}
				</button>
			</div>
		</form>
	);
}
