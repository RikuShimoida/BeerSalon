"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/form/form-error";
import { TextField } from "@/components/form/text-field";
import { login } from "./actions";

type Props = {
	resetSuccess?: boolean;
};

export function LoginForm({ resetSuccess = false }: Props) {
	const [state, formAction, isPending] = useActionState(login, undefined);
	const hasShownResetToastRef = useRef(false);

	useEffect(() => {
		// Why not 即時呼び出し: Sonner Toaster の初期マウント前に toast を呼ぶと表示されない問題への対処。
		// <Toaster /> が layout.tsx に配置されているが、初回 useEffect 実行タイミングと Toaster の
		// React フックライフサイクル登録のレース条件があるため、微小遅延で確実にマウント後に呼び出す。
		if (resetSuccess && !hasShownResetToastRef.current) {
			hasShownResetToastRef.current = true;
			const timer = setTimeout(() => {
				toast.success(
					"パスワードを再設定しました。新しいパスワードでログインしてください",
				);
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [resetSuccess]);

	return (
		<form action={formAction} className="flex flex-col gap-4 w-full">
			<TextField
				id="email"
				name="email"
				label="メールアドレス"
				type="email"
				required
			/>

			<TextField
				id="password"
				name="password"
				label="パスワード"
				type="password"
				required
			/>

			{state?.error && <FormError>{state.error}</FormError>}

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
					href="/password/forgot"
					className="text-muted-foreground hover:text-foreground hover:underline tracking-wide transition-colors duration-300"
				>
					パスワードをお忘れの方
				</Link>
			</div>
		</form>
	);
}
