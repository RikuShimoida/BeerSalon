"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { FormError } from "@/components/form/form-error";
import { calcPasswordStrength } from "@/lib/auth/password-strength";
import { signUp } from "./actions";

export function SignUpForm() {
	const [state, formAction, isPending] = useActionState(signUp, undefined);
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const strength = calcPasswordStrength(password);

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
						value={password}
						onChange={(e) => setPassword(e.target.value)}
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
				<div
					className="flex gap-1.5"
					data-testid="password-strength"
					data-strength={strength}
				>
					{[0, 1, 2, 3].map((index) => (
						<span
							key={index}
							className={`h-1.5 flex-1 rounded-full transition-colors ${
								index < strength ? "bg-primary" : "bg-secondary"
							}`}
						/>
					))}
				</div>
				<p className="text-xs tracking-wide text-subtext">
					8文字以上、大文字・小文字・数字を含めてください
				</p>
			</div>

			{state?.error && <FormError>{state.error}</FormError>}

			<button
				type="submit"
				disabled={isPending}
				className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-strong px-4 py-3 font-medium text-primary-foreground shadow-md transition-all duration-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
			>
				{isPending ? "登録中..." : "登録"}
			</button>

			<div className="flex items-center gap-3">
				<span className="h-px flex-1 bg-primary/15" />
				<span className="text-xs tracking-wide text-subtext">または</span>
				<span className="h-px flex-1 bg-primary/15" />
			</div>

			{/* Why not OAuth を実装: Google / X 連携は本 Issue のスコープ外（別 Issue）。
			    デザインの配置のみ再現し、動作は持たせないため非活性で表示する。 */}
			<div className="flex flex-col gap-3">
				<button
					type="button"
					disabled
					title="準備中"
					className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-surface-raised px-4 py-3 text-sm font-medium text-subtext opacity-60"
				>
					<span className="font-archivo font-bold text-primary">G</span>
					Googleで登録
				</button>
				<button
					type="button"
					disabled
					title="準備中"
					className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-surface-raised px-4 py-3 text-sm font-medium text-subtext opacity-60"
				>
					<span className="font-archivo font-bold text-primary">X</span>
					Xで登録
				</button>
			</div>

			<div className="flex flex-col gap-2 text-center text-sm">
				<Link
					href="/login"
					className="font-medium tracking-wide text-primary transition-colors duration-300 hover:text-primary/80 hover:underline"
				>
					すでにアカウントをお持ちの方
				</Link>
			</div>
		</form>
	);
}
