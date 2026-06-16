import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "./reset-form";

export default async function ResetPasswordPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/password/forgot?error=session_expired");
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-md animate-fade-in">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-primary mb-2 tracking-tight">
						Beer Salon
					</h1>
					<p className="text-muted-foreground tracking-wide">
						パスワード再設定
					</p>
				</div>

				<div className="glass-card p-8 rounded-2xl modern-shadow">
					<p className="text-sm text-muted-foreground mb-4 tracking-wide">
						新しいパスワードを入力してください。
					</p>
					<ResetForm />
				</div>
			</div>
		</div>
	);
}
