"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function ResetPasswordPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const token = searchParams.get("token") ?? "";

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");

		if (!token) {
			setError("再設定リンクが無効です");
			return;
		}
		if (password.length < 8) {
			setError("パスワードは8文字以上で入力してください");
			return;
		}
		if (password !== confirmPassword) {
			setError("パスワードが一致しません");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/auth/password/reset", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "パスワードの再設定に失敗しました");
				return;
			}

			setSuccess(true);
		} catch (_err) {
			setError("パスワードの再設定に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	if (success) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 space-y-6">
					<h1 className="text-center text-2xl font-bold text-gray-900">
						パスワードを再設定しました
					</h1>
					<p className="text-center text-sm text-gray-600">
						新しいパスワードでログインしてください。
					</p>
					<button
						type="button"
						onClick={() => router.push("/login")}
						className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
					>
						ログインへ
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 space-y-6">
				<div>
					<h1 className="text-center text-2xl font-bold text-gray-900">
						新しいパスワードの設定
					</h1>
					<p className="mt-2 text-center text-sm text-gray-600">
						新しいパスワード（8文字以上）を入力してください。
					</p>
				</div>

				{!token && (
					<div className="rounded-md bg-red-50 p-4">
						<p className="text-sm text-red-800">
							再設定リンクが無効です。もう一度お手続きをやり直してください。
						</p>
					</div>
				)}

				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-gray-700"
						>
							新しいパスワード
						</label>
						<input
							id="password"
							name="password"
							type="password"
							autoComplete="new-password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
							placeholder="新しいパスワード"
						/>
					</div>

					<div>
						<label
							htmlFor="confirmPassword"
							className="block text-sm font-medium text-gray-700"
						>
							新しいパスワード（確認）
						</label>
						<input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							autoComplete="new-password"
							required
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
							placeholder="もう一度入力"
						/>
					</div>

					{error && (
						<div className="rounded-md bg-red-50 p-4">
							<p className="text-sm text-red-800">{error}</p>
						</div>
					)}

					<div>
						<button
							type="submit"
							disabled={loading || !token}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? "設定中..." : "パスワードを設定"}
						</button>
					</div>
				</form>

				<div className="text-center">
					<Link href="/login" className="text-sm text-gray-600 hover:underline">
						ログインに戻る
					</Link>
				</div>
			</div>
		</div>
	);
}
