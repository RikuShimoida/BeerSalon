"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { createPost } from "./actions";

type Bar = {
	id: bigint;
	name: string;
	prefecture: string;
	city: string;
};

type PostFormProps = {
	bars: Bar[];
	selectedBarId?: string;
};

export function PostForm({ bars, selectedBarId }: PostFormProps) {
	const router = useRouter();
	const [state, formAction] = useActionState(createPost, undefined);
	const [isPending, startTransition] = useTransition();
	const [images, setImages] = useState<File[]>([]);
	const [previewUrls, setPreviewUrls] = useState<string[]>([]);
	const [imageError, setImageError] = useState<string | null>(null);

	useEffect(() => {
		return () => {
			for (const url of previewUrls) {
				URL.revokeObjectURL(url);
			}
		};
	}, [previewUrls]);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);

		if (images.length + files.length > 4) {
			setImageError("写真は最大4枚までです");
			e.target.value = "";
			return;
		}

		setImageError(null);
		const newImages = [...images, ...files].slice(0, 4);
		setImages(newImages);

		const newUrls = files.map((file) => URL.createObjectURL(file));
		setPreviewUrls((prev) => [...prev, ...newUrls].slice(0, 4));

		e.target.value = "";
	};

	const handleRemoveImage = (index: number) => {
		URL.revokeObjectURL(previewUrls[index]);
		setImages((prev) => prev.filter((_, i) => i !== index));
		setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
		setImageError(null);
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		for (let i = 0; i < images.length; i++) {
			formData.append(`image-${i}`, images[i]);
		}

		startTransition(() => {
			formAction(formData);
		});
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
			<div className="flex flex-col gap-2">
				<label htmlFor="barId" className="text-sm font-medium text-gray-700">
					店舗選択<span className="text-red-500 ml-1">*</span>
				</label>
				<select
					id="barId"
					name="barId"
					defaultValue={selectedBarId || state?.barId || ""}
					className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				>
					<option value="">店舗を選択してください</option>
					{bars.map((bar) => (
						<option key={bar.id.toString()} value={bar.id.toString()}>
							{bar.name} ({bar.prefecture} {bar.city})
						</option>
					))}
				</select>
			</div>

			<div className="flex flex-col gap-2">
				<label htmlFor="body" className="text-sm font-medium text-gray-700">
					投稿本文<span className="text-red-500 ml-1">*</span>
				</label>
				<textarea
					id="body"
					name="body"
					rows={6}
					placeholder="お店の感想やビールの味わいなどを投稿してください..."
					className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
					required
				/>
			</div>

			<div className="flex flex-col gap-2">
				<div className="text-sm font-medium text-gray-700">
					写真を追加（最大4枚）
				</div>
				<div className="flex flex-col gap-4">
					{images.length < 4 && (
						<label
							htmlFor="image-upload"
							className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
						>
							<span className="text-blue-600 font-medium">+ 写真を追加</span>
							<input
								id="image-upload"
								type="file"
								accept="image/*"
								multiple
								onChange={handleImageChange}
								className="hidden"
							/>
						</label>
					)}

					{previewUrls.length > 0 && (
						<div className="grid grid-cols-2 gap-4">
							{previewUrls.map((url, index) => (
								<div key={url} className="relative aspect-square">
									{/* biome-ignore lint/performance/noImgElement: blob URL preview */}
									<img
										src={url}
										alt={`Preview ${index + 1}`}
										className="w-full h-full object-cover rounded-lg"
									/>
									<button
										type="button"
										onClick={() => handleRemoveImage(index)}
										className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center"
									>
										×
									</button>
								</div>
							))}
						</div>
					)}

					{imageError && (
						<div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
							{imageError}
						</div>
					)}
				</div>
			</div>

			{state?.error && (
				<div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
					{state.error}
				</div>
			)}

			<div className="flex gap-4">
				<button
					type="button"
					onClick={() => router.back()}
					className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 transition-colors"
				>
					キャンセル
				</button>
				<button
					type="submit"
					disabled={isPending}
					className="flex-1 px-4 py-3 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
				>
					{isPending ? "投稿中..." : "投稿する"}
				</button>
			</div>
		</form>
	);
}
