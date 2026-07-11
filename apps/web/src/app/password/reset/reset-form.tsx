"use client";

import { useActionState } from "react";
import { FormError } from "@/components/form/form-error";
import { TextField } from "@/components/form/text-field";
import { resetPasswordAction } from "./actions";

export function ResetForm() {
	const [state, formAction, isPending] = useActionState(
		resetPasswordAction,
		undefined,
	);

	return (
		<form action={formAction} className="flex flex-col gap-4 w-full">
			<TextField
				id="password"
				name="password"
				label="新しいパスワード"
				type="password"
				required
				hint="8文字以上、大文字・小文字・数字を含めてください"
			/>

			<TextField
				id="confirmPassword"
				name="confirmPassword"
				label="新しいパスワード（確認用）"
				type="password"
				required
			/>

			{state?.error && <FormError>{state.error}</FormError>}

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
