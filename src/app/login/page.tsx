import { LoginForm } from "./login-form";

export default function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-primary mb-2">Beer Salon</h1>
					<p className="text-muted-foreground">ログイン</p>
				</div>

				<div className="bg-card p-8 rounded-lg shadow-md border border-border">
					<LoginForm />
				</div>
			</div>
		</div>
	);
}
