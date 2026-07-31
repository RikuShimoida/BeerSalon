"use client";

import { ImagePlus, MapPin, Plus, X } from "lucide-react";
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
	bar: Bar;
};

export function PostForm({ bar }: PostFormProps) {
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
		<form onSubmit={handleSubmit} className="w-full">
			<input type="hidden" name="barId" value={bar.id.toString()} />

			<div className="flex items-center justify-between gap-4 mb-6">
				<button
					type="button"
					onClick={() => router.back()}
					aria-label="閉じる"
					className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-raised border border-primary/20 text-subtext hover:text-primary transition-colors"
				>
					<X className="w-5 h-5" aria-hidden="true" />
				</button>
				<h1 className="font-mincho text-xl text-heading flex-1 text-center">
					投稿を作成
				</h1>
				<button
					type="submit"
					disabled={isPending}
					className="px-5 py-2.5 rounded-lg bg-gradient-to-br from-primary to-primary-strong text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
				>
					{isPending ? "投稿中..." : "投稿する"}
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-6">
				<div className="flex flex-col gap-3">
					<span className="text-sm font-medium text-subtext">
						写真（最大4枚）
					</span>
					<div className="grid grid-cols-2 gap-3">
						{previewUrls.map((url, index) => (
							<div
								key={url}
								className="relative aspect-square rounded-xl overflow-hidden border border-primary/15"
							>
								{/* biome-ignore lint/performance/noImgElement: blob URL preview */}
								<img
									src={url}
									alt={`プレビュー ${index + 1}`}
									className="w-full h-full object-cover"
								/>
								<button
									type="button"
									onClick={() => handleRemoveImage(index)}
									aria-label={`写真${index + 1}を削除`}
									className="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-deep/80 text-foreground hover:bg-surface-deep transition-colors flex items-center justify-center"
								>
									<X className="w-4 h-4" aria-hidden="true" />
								</button>
							</div>
						))}

						{images.length < 4 && (
							<label
								htmlFor="image-upload"
								className="flex flex-col items-center justify-center gap-2 aspect-square rounded-xl border-2 border-dashed border-primary/30 cursor-pointer text-subtext hover:border-primary hover:text-primary transition-colors"
							>
								{previewUrls.length === 0 ? (
									<>
										<ImagePlus className="w-7 h-7" aria-hidden="true" />
										<span className="text-xs">写真を追加</span>
									</>
								) : (
									<Plus className="w-7 h-7" aria-hidden="true" />
								)}
								<input
									id="image-upload"
									type="file"
									accept="image/*"
									multiple
									aria-label="写真を追加"
									onChange={handleImageChange}
									className="hidden"
								/>
							</label>
						)}
					</div>

					{imageError && (
						<p className="text-sm text-destructive">{imageError}</p>
					)}
				</div>

				<div className="flex flex-col gap-5">
					<div className="flex flex-col gap-2">
						<span className="text-sm font-medium text-subtext">
							投稿する店舗
						</span>
						<div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-raised border border-primary/20">
							<MapPin
								className="w-5 h-5 text-primary flex-shrink-0"
								aria-hidden="true"
							/>
							<span className="font-medium text-heading">{bar.name}</span>
							<span className="text-sm text-subtext">
								{bar.prefecture} {bar.city}
							</span>
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<label htmlFor="body" className="text-sm font-medium text-subtext">
							投稿本文<span className="text-destructive ml-1">*</span>
						</label>
						<textarea
							id="body"
							name="body"
							rows={8}
							placeholder="お店の感想やビールの味わいなどを投稿してください..."
							className="px-4 py-3 rounded-xl bg-input border border-primary/20 text-foreground placeholder:text-[#5f5138] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 resize-none"
							required
						/>
					</div>

					{state?.error && (
						<div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl">
							{state.error}
						</div>
					)}
				</div>
			</div>
		</form>
	);
}
