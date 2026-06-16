import { ForgotForm } from "./forgot-form";

type SearchParams = {
	error?: string;
};

export default async function ForgotPasswordPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	const params = await searchParams;
	const initialError =
		params.error === "invalid_token" || params.error === "session_expired"
			? params.error
			: undefined;

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
						ご登録のメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
					</p>
					<ForgotForm initialError={initialError} />
				</div>
			</div>
		</div>
	);
}
