"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
	const [state, formAction, isPending] = useActionState(login, undefined);

	return (
		<form action={formAction} className="flex flex-col gap-4 w-full">
			<div className="flex flex-col gap-2">
				<label
					htmlFor="email"
					className="text-sm font-medium text-card-foreground tracking-wide"
				>
					メールアドレス
				</label>
				<input
					type="email"
					id="email"
					name="email"
					placeholder="example@mail.com"
					className="glass-input px-4 py-3 rounded-xl text-card-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300"
					required
				/>
			</div>

			<div className="flex flex-col gap-2">
				<label
					htmlFor="password"
					className="text-sm font-medium text-card-foreground tracking-wide"
				>
					パスワード
				</label>
				<input
					type="password"
					id="password"
					name="password"
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
				{isPending ? "ログイン中..." : "ログイン"}
			</button>

			<div className="flex flex-col gap-2 text-sm text-center">
				<Link
					href="/signup"
					className="text-primary hover:text-primary/80 hover:underline font-medium tracking-wide transition-colors duration-300"
				>
					新規登録はこちら
				</Link>
				<Link
					href="/password/reset"
					className="text-muted-foreground hover:text-foreground hover:underline tracking-wide transition-colors duration-300"
				>
					パスワードをお忘れの方
				</Link>
			</div>
		</form>
	);
}
