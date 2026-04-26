import { SignUpForm } from "./signup-form";

export default async function SignUpPage({
	searchParams,
}: {
	searchParams: Promise<{ success?: string }>;
}) {
	const params = await searchParams;
	const showSuccess = params.success === "true";

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-md animate-fade-in">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-primary mb-2 tracking-tight">
						Beer Salon
					</h1>
					<p className="text-muted-foreground tracking-wide">新規登録</p>
				</div>

				{showSuccess ? (
					<div className="glass-card p-8 rounded-2xl modern-shadow">
						<div className="text-center">
							<div className="mb-4 text-primary">
								<svg
									className="w-16 h-16 mx-auto"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>成功</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<h2 className="text-xl font-semibold text-card-foreground mb-2 tracking-tight">
								確認メールを送信しました
							</h2>
							<p className="text-muted-foreground mb-6 tracking-wide">
								メールに記載されたリンクをクリックして、アカウントを有効化してください。
							</p>
						</div>
					</div>
				) : (
					<div className="glass-card p-8 rounded-2xl modern-shadow">
						<SignUpForm />
					</div>
				)}
			</div>
		</div>
	);
}
