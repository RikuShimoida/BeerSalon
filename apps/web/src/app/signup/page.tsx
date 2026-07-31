import { MailCheck } from "lucide-react";
import { SignUpForm } from "./signup-form";

export default async function SignUpPage({
	searchParams,
}: {
	searchParams: Promise<{ success?: string }>;
}) {
	const params = await searchParams;
	const showSuccess = params.success === "true";

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
			<div className="w-full max-w-md animate-fade-in">
				<div className="mb-8 text-center">
					<p className="mb-2 font-archivo text-[11px] uppercase tracking-[0.24em] text-primary">
						Shizuoka Craft Beer
					</p>
					<h1 className="font-mincho text-3xl text-heading">新規登録</h1>
				</div>

				{showSuccess ? (
					<div className="rounded-3xl border border-primary/15 bg-card p-8 shadow-2xl">
						<div className="text-center">
							<div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
								<MailCheck className="h-8 w-8" aria-hidden="true" />
							</div>
							<h2 className="mb-2 font-mincho text-xl text-heading">
								確認メールを送信しました
							</h2>
							<p className="tracking-wide text-subtext">
								メールに記載されたリンクをクリックして、アカウントを有効化してください。
							</p>
						</div>
					</div>
				) : (
					<div className="rounded-3xl border border-primary/15 bg-card p-8 shadow-2xl">
						<SignUpForm />
					</div>
				)}
			</div>
		</div>
	);
}
