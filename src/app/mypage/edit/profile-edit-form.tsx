"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { updateProfile } from "./actions";

interface ProfileEditFormProps {
	currentProfile: {
		profileImageUrl?: string;
		bio?: string;
		nickname: string;
		lastName: string;
		firstName: string;
		email: string;
		birthday: string;
		gender: string;
		prefecture: string;
	};
}

export function ProfileEditForm({ currentProfile }: ProfileEditFormProps) {
	const router = useRouter();
	const [state, formAction, isPending] = useActionState(
		updateProfile,
		undefined,
	);
	const [imagePreview, setImagePreview] = useState<string | null>(
		currentProfile.profileImageUrl || null,
	);
	const [bioLength, setBioLength] = useState(currentProfile.bio?.length || 0);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				alert("画像サイズは5MB以下にしてください");
				e.target.value = "";
				return;
			}

			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	return (
		<form action={formAction} className="flex flex-col gap-6 w-full">
			<div className="flex flex-col gap-2">
				<label
					htmlFor="profileImage"
					className="text-sm font-medium text-card-foreground tracking-wide"
				>
					プロフィール画像
				</label>
				<div className="flex flex-col items-center gap-4">
					{imagePreview ? (
						<div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary relative">
							<Image
								src={imagePreview}
								alt="プロフィール画像プレビュー"
								fill
								className="object-cover"
							/>
						</div>
					) : (
						<div className="w-32 h-32 rounded-full border-2 border-muted bg-muted flex items-center justify-center text-4xl text-muted-foreground">
							{currentProfile.nickname.charAt(0)}
						</div>
					)}
					<input
						type="file"
						id="profileImage"
						name="profileImage"
						accept="image/*"
						onChange={handleImageChange}
						className="glass-input px-4 py-3 rounded-xl text-card-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 focus:outline-none transition-all duration-300"
					/>
					<input
						type="hidden"
						name="profileImageUrl"
						value={imagePreview || ""}
					/>
					<p className="text-xs text-muted-foreground">
						推奨: 正方形の画像、最大5MB
					</p>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<label
					htmlFor="bio"
					className="text-sm font-medium text-card-foreground tracking-wide"
				>
					プロフィール文
				</label>
				<textarea
					id="bio"
					name="bio"
					placeholder="自己紹介やビールの好みを入力してください"
					maxLength={500}
					rows={4}
					defaultValue={currentProfile.bio}
					onChange={(e) => setBioLength(e.target.value.length)}
					className="glass-input px-4 py-3 rounded-xl text-card-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300 resize-none"
				/>
				<p className="text-xs text-muted-foreground text-right">
					{bioLength}/500文字
				</p>
			</div>

			<div className="border-t border-border/50 pt-6">
				<h2 className="text-lg font-bold text-card-foreground mb-4 tracking-tight">
					基本情報（編集不可）
				</h2>

				<div className="space-y-4">
					<div>
						<p className="text-sm text-muted-foreground mb-1">ニックネーム</p>
						<p className="text-base text-card-foreground font-medium">
							{currentProfile.nickname}
						</p>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="text-sm text-muted-foreground mb-1">姓</p>
							<p className="text-base text-card-foreground font-medium">
								{currentProfile.lastName}
							</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground mb-1">名</p>
							<p className="text-base text-card-foreground font-medium">
								{currentProfile.firstName}
							</p>
						</div>
					</div>

					<div>
						<p className="text-sm text-muted-foreground mb-1">メールアドレス</p>
						<p className="text-base text-card-foreground font-medium">
							{currentProfile.email}
						</p>
					</div>

					<div>
						<p className="text-sm text-muted-foreground mb-1">生年月日</p>
						<p className="text-base text-card-foreground font-medium">
							{currentProfile.birthday}
						</p>
					</div>

					<div>
						<p className="text-sm text-muted-foreground mb-1">性別</p>
						<p className="text-base text-card-foreground font-medium">
							{currentProfile.gender}
						</p>
					</div>

					<div>
						<p className="text-sm text-muted-foreground mb-1">都道府県</p>
						<p className="text-base text-card-foreground font-medium">
							{currentProfile.prefecture}
						</p>
					</div>
				</div>
			</div>

			{state?.error && (
				<div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
					{state.error}
				</div>
			)}

			<div className="flex gap-4">
				<button
					type="button"
					onClick={() => router.push("/mypage")}
					className="flex-1 px-4 py-3 text-card-foreground bg-muted rounded-xl font-medium hover:bg-muted/80 transition-all duration-300 shadow-md"
				>
					キャンセル
				</button>
				<button
					type="submit"
					disabled={isPending}
					className="flex-1 px-4 py-3 text-primary-foreground gradient-primary rounded-xl font-medium hover:shadow-lg hover:scale-105 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all duration-300 shadow-md"
				>
					{isPending ? "保存中..." : "保存"}
				</button>
			</div>
		</form>
	);
}
