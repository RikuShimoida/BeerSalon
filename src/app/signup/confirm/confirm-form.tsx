"use client";

import { useActionState } from "react";
import { confirmAndSaveProfile, goBackToProfile } from "./actions";

interface ProfileData {
	lastName: string;
	firstName: string;
	nickname: string;
	birthday: string;
	gender: string;
	prefecture: string;
	profileImageUrl?: string;
	bio?: string;
}

interface ConfirmFormProps {
	profileData: ProfileData;
}

export function ConfirmForm({ profileData }: ConfirmFormProps) {
	const [state, formAction, isPending] = useActionState(
		confirmAndSaveProfile,
		undefined,
	);
	const [, backAction, isBackPending] = useActionState(
		goBackToProfile,
		undefined,
	);

	return (
		<div className="flex flex-col gap-3">
			{state?.error && (
				<div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
					{state.error}
				</div>
			)}

			<form action={formAction}>
				<input
					type="hidden"
					name="profileData"
					value={JSON.stringify(profileData)}
				/>
				<button
					type="submit"
					disabled={isPending}
					className="w-full px-4 py-3 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
				>
					{isPending ? "登録中..." : "この内容で登録する"}
				</button>
			</form>

			<form action={backAction}>
				<button
					type="submit"
					disabled={isBackPending}
					className="w-full px-4 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
				>
					{isBackPending ? "戻っています..." : "修正する"}
				</button>
			</form>
		</div>
	);
}
