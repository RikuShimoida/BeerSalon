"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { GENDERS, PREFECTURES } from "@/lib/constants/prefectures";
import { type ProfileFormData, profileSchema } from "@/lib/validations/auth";

interface ProfileFormProps {
	initialData?: {
		lastName: string;
		firstName: string;
		nickname: string;
		birthday: string;
		gender: string;
		prefecture: string;
	};
}

export function ProfileForm({ initialData }: ProfileFormProps) {
	const router = useRouter();

	const defaultValues = initialData
		? {
				lastName: initialData.lastName,
				firstName: initialData.firstName,
				nickname: initialData.nickname,
				year: initialData.birthday.split("-")[0],
				month: String(Number.parseInt(initialData.birthday.split("-")[1], 10)),
				day: String(Number.parseInt(initialData.birthday.split("-")[2], 10)),
				gender: initialData.gender,
				prefecture: initialData.prefecture,
			}
		: undefined;

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ProfileFormData>({
		resolver: zodResolver(profileSchema),
		defaultValues,
	});

	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
	const months = Array.from({ length: 12 }, (_, i) => i + 1);
	const days = Array.from({ length: 31 }, (_, i) => i + 1);

	const onSubmit = async (data: ProfileFormData) => {
		const birthdayString = `${data.year}-${data.month.padStart(2, "0")}-${data.day.padStart(2, "0")}`;
		const profileData = {
			lastName: data.lastName,
			firstName: data.firstName,
			nickname: data.nickname,
			birthday: birthdayString,
			gender: data.gender,
			prefecture: data.prefecture,
		};

		const encodedData = encodeURIComponent(JSON.stringify(profileData));
		router.push(`/signup/confirm?data=${encodedData}`);
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col gap-4 w-full"
		>
			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-2">
					<label
						htmlFor="lastName"
						className="text-sm font-medium text-gray-700"
					>
						姓
					</label>
					<input
						type="text"
						id="lastName"
						placeholder="下井田"
						className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						{...register("lastName")}
					/>
					{errors.lastName && (
						<p className="text-sm text-red-600">{errors.lastName.message}</p>
					)}
				</div>

				<div className="flex flex-col gap-2">
					<label
						htmlFor="firstName"
						className="text-sm font-medium text-gray-700"
					>
						名
					</label>
					<input
						type="text"
						id="firstName"
						placeholder="陸"
						className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						{...register("firstName")}
					/>
					{errors.firstName && (
						<p className="text-sm text-red-600">{errors.firstName.message}</p>
					)}
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<label htmlFor="nickname" className="text-sm font-medium text-gray-700">
					ニックネーム
				</label>
				<input
					type="text"
					id="nickname"
					placeholder="りく"
					className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					{...register("nickname")}
				/>
				{errors.nickname && (
					<p className="text-sm text-red-600">{errors.nickname.message}</p>
				)}
			</div>

			<div className="flex flex-col gap-2">
				<label className="text-sm font-medium text-gray-700">生年月日</label>
				<div className="grid grid-cols-3 gap-2">
					<select
						className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						{...register("year")}
					>
						<option value="">年</option>
						{years.map((year) => (
							<option key={year} value={year}>
								{year}
							</option>
						))}
					</select>
					<select
						className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						{...register("month")}
					>
						<option value="">月</option>
						{months.map((month) => (
							<option key={month} value={month}>
								{month}
							</option>
						))}
					</select>
					<select
						className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						{...register("day")}
					>
						<option value="">日</option>
						{days.map((day) => (
							<option key={day} value={day}>
								{day}
							</option>
						))}
					</select>
				</div>
				{(errors.year || errors.month || errors.day) && (
					<p className="text-sm text-red-600">
						{errors.year?.message ||
							errors.month?.message ||
							errors.day?.message}
					</p>
				)}
			</div>

			<div className="flex flex-col gap-2">
				<label htmlFor="gender" className="text-sm font-medium text-gray-700">
					性別
				</label>
				<select
					id="gender"
					className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					{...register("gender")}
				>
					<option value="">選択してください</option>
					{GENDERS.map((gender) => (
						<option key={gender.value} value={gender.value}>
							{gender.label}
						</option>
					))}
				</select>
				{errors.gender && (
					<p className="text-sm text-red-600">{errors.gender.message}</p>
				)}
			</div>

			<div className="flex flex-col gap-2">
				<label
					htmlFor="prefecture"
					className="text-sm font-medium text-gray-700"
				>
					お住まいの都道府県
				</label>
				<select
					id="prefecture"
					className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					{...register("prefecture")}
				>
					<option value="">選択してください</option>
					{PREFECTURES.map((pref) => (
						<option key={pref} value={pref}>
							{pref}
						</option>
					))}
				</select>
				{errors.prefecture && (
					<p className="text-sm text-red-600">{errors.prefecture.message}</p>
				)}
			</div>

			<button
				type="submit"
				disabled={isSubmitting}
				className="w-full px-4 py-3 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
			>
				{isSubmitting ? "確認中..." : "登録内容を確認"}
			</button>
		</form>
	);
}
