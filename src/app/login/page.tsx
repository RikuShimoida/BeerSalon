import { LoginForm } from "./login-form";

export default function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Beer Salon</h1>
					<p className="text-gray-600">ログイン</p>
				</div>

				<div className="bg-white p-8 rounded-lg shadow-md">
					<LoginForm />
				</div>
			</div>
		</div>
	);
}
