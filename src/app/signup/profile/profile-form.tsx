"use client";

import { useActionState } from "react";
import { GENDERS, PREFECTURES } from "@/lib/constants/prefectures";
import { saveProfileToSession } from "./actions";

export function ProfileForm() {
	const [state, formAction, isPending] = useActionState(
		saveProfileToSession,
		undefined,
	);

	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

	const months = Array.from({ length: 12 }, (_, i) => i + 1);

	const days = Array.from({ length: 31 }, (_, i) => i + 1);

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
