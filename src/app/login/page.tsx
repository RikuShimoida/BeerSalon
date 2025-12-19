import { LoginForm } from "./login-form";

export default function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-md animate-fade-in">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-primary mb-2 tracking-tight">
						Beer Salon
					</h1>
					<p className="text-muted-foreground tracking-wide">ログイン</p>
				</div>

				<div className="glass-card p-8 rounded-2xl modern-shadow">
					<LoginForm />
				</div>
			</div>
		</div>
	);
}
