"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
	const [state, formAction, isPending] = useActionState(login, undefined);

	return (
		<form action={formAction} className="flex flex-col gap-4 w-full">
			<div className="flex flex-col gap-2">
				<label htmlFor="email" className="text-sm font-medium text-foreground">
					メールアドレス
				</label>
				<input
					type="email"
					id="email"
					name="email"
					placeholder="example@mail.com"
					className="px-4 py-3 border border-input bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
					required
				/>
			</div>

			<div className="flex flex-col gap-2">
				<label
					htmlFor="password"
					className="text-sm font-medium text-foreground"
				>
					パスワード
				</label>
				<input
					type="password"
					id="password"
					name="password"
					placeholder="••••••••"
					className="px-4 py-3 border border-input bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
					required
				/>
			</div>

			{state?.error && (
				<div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
					{state.error}
				</div>
			)}

			<button
				type="submit"
				disabled={isPending}
				className="w-full px-4 py-3 text-primary-foreground bg-primary rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
			>
				{isPending ? "ログイン中..." : "ログイン"}
			</button>

			<div className="flex flex-col gap-2 text-sm text-center">
				<Link
					href="/signup"
					className="text-primary hover:text-primary/80 hover:underline font-medium"
				>
					新規登録はこちら
				</Link>
				<Link
					href="/password/reset"
					className="text-muted-foreground hover:text-foreground hover:underline"
				>
					パスワードをお忘れの方
				</Link>
			</div>
		</form>
	);
}
