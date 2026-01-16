"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { GENDERS, PREFECTURES } from "@/lib/constants/prefectures";
import { saveProfileToSession } from "./actions";

export function ProfileForm() {
	const [state, formAction, isPending] = useActionState(
		saveProfileToSession,
		undefined,
	);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [bioLength, setBioLength] = useState(0);

	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

	const months = Array.from({ length: 12 }, (_, i) => i + 1);

	const days = Array.from({ length: 31 }, (_, i) => i + 1);

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
		<form action={formAction} className="flex flex-col gap-4 w-full">
			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-2">
					<label
						htmlFor="lastName"
						className="text-sm font-medium text-card-foreground tracking-wide"
					>
						姓
					</label>
					<input
						type="text"
						id="lastName"
						name="lastName"
						placeholder="下井田"
						className="glass-input px-4 py-3 rounded-xl text-card-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300"
						required
					/>
				</div>

				<div className="flex flex-col gap-2">
					<label
						htmlFor="firstName"
						className="text-sm font-medium text-card-foreground tracking-wide"
					>
						名
					</label>
					<input
						type="text"
						id="firstName"
						name="firstName"
						placeholder="陸"
						className="glass-input px-4 py-3 rounded-xl text-card-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300"
						required
					/>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<label
					htmlFor="nickname"
					className="text-sm font-medium text-card-foreground tracking-wide"
				>
					ニックネーム
				</label>
				<input
					type="text"
					id="nickname"
					name="nickname"
					placeholder="りく"
					className="glass-input px-4 py-3 rounded-xl text-card-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300"
					required
				/>
			</div>

			<div className="flex flex-col gap-2">
				<label
					htmlFor="birthday"
					className="text-sm font-medium text-card-foreground tracking-wide"
				>
					生年月日
				</label>
				<div className="grid grid-cols-3 gap-2">
					<select
						name="year"
						className="glass-input px-4 py-3 rounded-xl text-card-foreground focus:outline-none transition-all duration-300"
						required
					>
						<option value="">年</option>
						{years.map((year) => (
							<option key={year} value={year}>
								{year}
							</option>
						))}
					</select>
					<select
						name="month"
						className="glass-input px-4 py-3 rounded-xl text-card-foreground focus:outline-none transition-all duration-300"
						required
					>
						<option value="">月</option>
						{months.map((month) => (
							<option key={month} value={month}>
								{month}
							</option>
						))}
					</select>
					<select
						name="day"
						className="glass-input px-4 py-3 rounded-xl text-card-foreground focus:outline-none transition-all duration-300"
						required
					>
						<option value="">日</option>
						{days.map((day) => (
							<option key={day} value={day}>
								{day}
							</option>
						))}
					</select>
				</div>
				<input type="hidden" name="birthday" id="birthday" />
			</div>

			<div className="flex flex-col gap-2">
				<label
					htmlFor="gender"
					className="text-sm font-medium text-card-foreground tracking-wide"
				>
					性別
				</label>
				<select
					id="gender"
					name="gender"
					className="glass-input px-4 py-3 rounded-xl text-card-foreground focus:outline-none transition-all duration-300"
					required
				>
					<option value="">選択してください</option>
					{GENDERS.map((gender) => (
						<option key={gender.value} value={gender.value}>
							{gender.label}
						</option>
					))}
				</select>
			</div>

			<div className="flex flex-col gap-2">
				<label
					htmlFor="prefecture"
					className="text-sm font-medium text-card-foreground tracking-wide"
				>
					お住まいの都道府県
				</label>
				<select
					id="prefecture"
					name="prefecture"
					className="glass-input px-4 py-3 rounded-xl text-card-foreground focus:outline-none transition-all duration-300"
					required
				>
					<option value="">選択してください</option>
					{PREFECTURES.map((pref) => (
						<option key={pref} value={pref}>
							{pref}
						</option>
					))}
				</select>
			</div>

			<div className="flex flex-col gap-2">
				<label
					htmlFor="profileImage"
					className="text-sm font-medium text-card-foreground tracking-wide"
				>
					プロフィール画像（任意）
				</label>
				<div className="flex flex-col items-center gap-4">
					{imagePreview && (
						<div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary relative">
							<Image
								src={imagePreview}
								alt="プロフィール画像プレビュー"
								fill
								className="object-cover"
							/>
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
					プロフィール文（任意）
				</label>
				<textarea
					id="bio"
					name="bio"
					placeholder="自己紹介やビールの好みを入力してください"
					maxLength={500}
					rows={4}
					onChange={(e) => setBioLength(e.target.value.length)}
					className="glass-input px-4 py-3 rounded-xl text-card-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300 resize-none"
				/>
				<p className="text-xs text-muted-foreground text-right">
					{bioLength}/500文字
				</p>
			</div>

			{state?.error && (
				<div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
					{state.error}
				</div>
			)}

			<button
				type="submit"
				disabled={isPending}
				className="w-full px-4 py-3 text-primary-foreground gradient-primary rounded-xl font-medium hover:shadow-lg hover:scale-105 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all duration-300 shadow-md"
				onClick={(e) => {
					const form = e.currentTarget.form;
					if (form) {
						const year = (form.elements.namedItem("year") as HTMLSelectElement)
							.value;
						const month = (
							form.elements.namedItem("month") as HTMLSelectElement
						).value;
						const day = (form.elements.namedItem("day") as HTMLSelectElement)
							.value;
						const birthdayInput = form.elements.namedItem(
							"birthday",
						) as HTMLInputElement;
						if (year && month && day) {
							birthdayInput.value = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
						}
					}
				}}
			>
				{isPending ? "確認中..." : "登録内容を確認"}
			</button>
		</form>
	);
}
