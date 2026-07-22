import { LoginForm } from "./login-form";

type SearchParams = {
	reset?: string;
};

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	const params = await searchParams;
	const resetSuccess = params.reset === "success";

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
			<div className="w-full max-w-md animate-fade-in md:max-w-[860px]">
				<div className="overflow-hidden rounded-3xl border border-primary/15 bg-card shadow-2xl md:grid md:grid-cols-[400px_1fr]">
					{/* ブランドビジュアル（モバイルは上部ヒーロー、PC は左カラム） */}
					<div className="relative overflow-hidden bg-gradient-to-br from-surface-raised to-surface-deep px-8 py-12 md:flex md:flex-col md:justify-center md:px-10 md:py-14">
						<div
							className="pointer-events-none absolute inset-0 opacity-[0.06]"
							style={{
								backgroundImage:
									"repeating-linear-gradient(135deg, #e0a341 0, #e0a341 1px, transparent 1px, transparent 14px)",
							}}
							aria-hidden="true"
						/>
						<div
							className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl"
							aria-hidden="true"
						/>
						<div className="relative text-center md:text-left">
							<p className="mb-3 font-archivo text-[11px] uppercase tracking-[0.24em] text-primary">
								Shizuoka Craft Beer
							</p>
							<h1 className="mb-4 leading-none">
								<span className="block font-mincho text-4xl text-heading md:text-5xl">
									Beer
								</span>
								<span className="block font-archivo text-4xl font-bold tracking-tight text-primary md:text-5xl">
									Salon
								</span>
							</h1>
							<p className="font-mincho text-base text-subtext md:text-lg">
								今夜の一杯を、この街で見つける。
							</p>
						</div>
					</div>

					{/* フォームカラム */}
					<div className="px-8 py-10 md:flex md:flex-col md:justify-center md:px-12">
						<div className="mb-6">
							<h2 className="font-mincho text-2xl text-heading">
								おかえりなさい
							</h2>
							<p className="mt-1 text-sm text-subtext">
								アカウントにログインしてください
							</p>
						</div>
						<LoginForm resetSuccess={resetSuccess} />
					</div>
				</div>
			</div>
		</div>
	);
}
