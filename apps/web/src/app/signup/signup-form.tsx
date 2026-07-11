"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormError } from "@/components/form/form-error";
import { TextField } from "@/components/form/text-field";
import { signUp } from "./actions";

export function SignUpForm() {
	const [state, formAction, isPending] = useActionState(signUp, undefined);

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
				hint="8文字以上、大文字・小文字・数字を含めてください"
			/>

			{state?.error && <FormError>{state.error}</FormError>}

			<button
				type="submit"
				disabled={isPending}
				className="w-full px-4 py-3 text-primary-foreground gradient-primary rounded-xl font-medium hover:shadow-lg hover:scale-105 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all duration-300 shadow-md"
			>
				{isPending ? "登録中..." : "登録"}
			</button>

			<div className="flex flex-col gap-2 text-sm text-center">
				<Link
					href="/login"
					className="text-primary hover:text-primary/80 hover:underline font-medium tracking-wide transition-colors duration-300"
				>
					ログインはこちら
				</Link>
			</div>
		</form>
	);
}
