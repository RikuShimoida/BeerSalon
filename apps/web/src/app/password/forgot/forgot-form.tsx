"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/form/form-error";
import { TextField } from "@/components/form/text-field";
import { forgotPasswordAction } from "./actions";

type Props = {
	initialError?: "invalid_token" | "session_expired";
};

export function ForgotForm({ initialError }: Props) {
	const [state, formAction, isPending] = useActionState(
		forgotPasswordAction,
		undefined,
	);
	const formRef = useRef<HTMLFormElement>(null);
	const lastShownStateRef = useRef<typeof state>(undefined);

	useEffect(() => {
		// Why not 即時呼び出し: Sonner Toaster の初期マウント前に toast を呼ぶと表示されない問題への対処。
		// <Toaster /> が layout.tsx に配置されているが、初回 useEffect 実行タイミングと Toaster の
		// React フックライフサイクル登録のレース条件があるため、微小遅延で確実にマウント後に呼び出す。
		if (initialError === "invalid_token") {
			const timer = setTimeout(() => {
				toast.error(
					"パスワード再設定リンクが無効です。再度メールアドレスを入力してください。",
				);
			}, 100);
			return () => clearTimeout(timer);
		}
		if (initialError === "session_expired") {
			const timer = setTimeout(() => {
				toast.error(
					"パスワード再設定の有効期限が切れました。再度メールアドレスを入力してください。",
				);
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [initialError]);

	useEffect(() => {
		if (!state || state === lastShownStateRef.current) {
			return;
		}
		lastShownStateRef.current = state;

		if (state.success) {
			toast.success(state.message);
			formRef.current?.reset();
		}
	}, [state]);

	return (
		<form
			ref={formRef}
			action={formAction}
			className="flex flex-col gap-4 w-full"
		>
			<TextField
				id="email"
				name="email"
				label="メールアドレス"
				type="email"
				required
			/>

			{state && !state.success && <FormError>{state.error}</FormError>}

			<button
				type="submit"
				disabled={isPending}
				className="w-full px-4 py-3 text-primary-foreground gradient-primary rounded-xl font-medium hover:shadow-lg hover:scale-105 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all duration-300 shadow-md"
			>
				{isPending ? "送信中..." : "再設定メールを送信"}
			</button>

			<div className="flex flex-col gap-2 text-sm text-center">
				<Link
					href="/login"
					className="text-primary hover:text-primary/80 hover:underline font-medium tracking-wide transition-colors duration-300"
				>
					ログインに戻る
				</Link>
			</div>
		</form>
	);
}
