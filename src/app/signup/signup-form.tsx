"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "./actions";

export function SignUpForm() {
	const [state, formAction, isPending] = useActionState(signUp, undefined);

	return (
		<form action={formAction} className="flex flex-col gap-4 w-full">
			<div className="flex flex-col gap-2">
				<label htmlFor="email" className="text-sm font-medium text-gray-700">
					メールアドレス
				</label>
				<input
					type="email"
					id="email"
					name="email"
					placeholder="example@mail.com"
					className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
			</div>

			<div className="flex flex-col gap-2">
				<label htmlFor="password" className="text-sm font-medium text-gray-700">
					パスワード
				</label>
				<input
					type="password"
					id="password"
					name="password"
					placeholder="••••••••"
					className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
				<p className="text-xs text-gray-500">
					8文字以上、大文字・小文字・数字・記号を含めてください
				</p>
			</div>

			{state?.error && (
				<div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
					{state.error}
				</div>
			)}

			<button
				type="submit"
				disabled={isPending}
				className="w-full px-4 py-3 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
			>
				{isPending ? "登録中..." : "登録"}
			</button>

			<div className="flex flex-col gap-2 text-sm text-center">
				<Link href="/login" className="text-blue-600 hover:underline">
					ログインはこちら
				</Link>
			</div>
		</form>
	);
}
