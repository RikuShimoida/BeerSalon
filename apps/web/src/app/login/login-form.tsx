"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/form/form-error";
import { login } from "./actions";

type Props = {
	resetSuccess?: boolean;
};

export function LoginForm({ resetSuccess = false }: Props) {
	const [state, formAction, isPending] = useActionState(login, undefined);
	const [showPassword, setShowPassword] = useState(false);
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
		<form action={formAction} className="flex w-full flex-col gap-5">
			<div className="flex flex-col gap-2">
				<label
					htmlFor="email"
					className="text-sm font-medium tracking-wide text-subtext"
				>
					メールアドレス
				</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					className="rounded-xl border border-primary/20 bg-surface-raised px-4 py-3 text-card-foreground transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
				/>
			</div>

			<div className="flex flex-col gap-2">
				<label
					htmlFor="password"
					className="text-sm font-medium tracking-wide text-subtext"
				>
					パスワード
				</label>
				<div className="relative">
					<input
						type={showPassword ? "text" : "password"}
						id="password"
						name="password"
						required
						className="w-full rounded-xl border border-primary/20 bg-surface-raised px-4 py-3 pr-12 text-card-foreground transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
					/>
					<button
						type="button"
						onClick={() => setShowPassword((prev) => !prev)}
						aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
						aria-pressed={showPassword}
						className="absolute inset-y-0 right-0 flex items-center px-4 text-subtext transition-colors hover:text-primary"
					>
						{showPassword ? (
							<EyeOff className="h-5 w-5" aria-hidden="true" />
						) : (
							<Eye className="h-5 w-5" aria-hidden="true" />
						)}
					</button>
				</div>
			</div>

			{state?.error && <FormError>{state.error}</FormError>}

			<button
				type="submit"
				disabled={isPending}
				className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-strong px-4 py-3 font-medium text-primary-foreground shadow-md transition-all duration-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
			>
				{isPending ? "ログイン中..." : "ログイン"}
			</button>

			<div className="flex flex-col gap-2 text-center text-sm">
				<Link
					href="/signup"
					className="font-medium tracking-wide text-primary transition-colors duration-300 hover:text-primary/80 hover:underline"
				>
					新規登録はこちら
				</Link>
				<Link
					href="/password/forgot"
					className="tracking-wide text-subtext transition-colors duration-300 hover:text-foreground hover:underline"
				>
					パスワードをお忘れの方
				</Link>
			</div>
		</form>
	);
}
