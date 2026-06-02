"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function LoginPage() {
	const [barManageId, setBarManageId] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");

		if (!barManageId || !password) {
			setError("入力してください");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ barManageId, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "ログインに失敗しました");
				return;
			}

			if (data.user.role === "admin") {
				router.push("/bars");
			} else {
				router.push(`/bars/${data.user.barId}`);
			}
			router.refresh();
		} catch (_err) {
			setError("ログインに失敗しました");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 space-y-6">
				<div>
					<h1 className="text-center text-2xl font-bold text-gray-900">
						Beer Salon Admin
					</h1>
					<p className="mt-2 text-center text-sm text-gray-600">
						管理画面にログイン
					</p>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					<div className="rounded-md shadow-sm space-y-4">
						<div>
							<label
								htmlFor="barManageId"
								className="block text-sm font-medium text-gray-700"
							>
								店舗ID
							</label>
							<input
								id="barManageId"
								name="barManageId"
								type="text"
								autoComplete="username"
								required
								value={barManageId}
								onChange={(e) => setBarManageId(e.target.value)}
								className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
								placeholder="fuji-beer-bar"
							/>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700"
							>
								パスワード
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
								placeholder="パスワード"
							/>
						</div>
					</div>

					{error && (
						<div className="rounded-md bg-red-50 p-4">
							<p className="text-sm text-red-800">{error}</p>
						</div>
					)}

					<div>
						<button
							type="submit"
							disabled={loading}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? "ログイン中..." : "ログイン"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
