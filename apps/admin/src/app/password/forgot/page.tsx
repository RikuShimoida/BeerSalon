"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
	const [barManageId, setBarManageId] = useState("");
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");
		setMessage("");

		if (!barManageId) {
			setError("店舗IDを入力してください");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/auth/password/forgot", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ barManageId }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "リクエストの処理に失敗しました");
				return;
			}

			setMessage(data.message);
			setBarManageId("");
		} catch (_err) {
			setError("リクエストの処理に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 space-y-6">
				<div>
					<h1 className="text-center text-2xl font-bold text-gray-900">
						パスワード再設定
					</h1>
					<p className="mt-2 text-center text-sm text-gray-600">
						登録済みの店舗IDを入力してください。ご登録のメールアドレス宛に再設定リンクを送信します。
					</p>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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

					{message && (
						<div className="rounded-md bg-green-50 p-4">
							<p className="text-sm text-green-800">{message}</p>
						</div>
					)}

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
							{loading ? "送信中..." : "再設定メールを送信"}
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
