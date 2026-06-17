"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "./actions";

export function ResetForm() {
	const [state, formAction, isPending] = useActionState(
		resetPasswordAction,
		undefined,
	);

	return (
		<form action={formAction} className="flex flex-col gap-4 w-full">
			<div className="flex flex-col gap-2">
				<label
					htmlFor="password"
					className="text-sm font-medium text-card-foreground tracking-wide"
				>
					新しいパスワード
				</label>
				<input
					type="password"
					id="password"
					name="password"
					placeholder="••••••••"
					className="glass-input px-4 py-3 rounded-xl text-card-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300"
					required
				/>
				<p className="text-xs text-muted-foreground tracking-wide">
					8文字以上、大文字・小文字・数字を含めてください
				</p>
			</div>

			<div className="flex flex-col gap-2">
				<label
					htmlFor="confirmPassword"
					className="text-sm font-medium text-card-foreground tracking-wide"
				>
					新しいパスワード（確認用）
				</label>
				<input
					type="password"
					id="confirmPassword"
					name="confirmPassword"
					placeholder="••••••••"
					className="glass-input px-4 py-3 rounded-xl text-card-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300"
					required
				/>
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
			>
				{isPending ? "更新中..." : "パスワードを変更する"}
			</button>
		</form>
	);
}
