"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

export default function BarRegisterForm() {
	const [barManageId, setBarManageId] = useState("");
	const [password, setPassword] = useState("");
	const [contactEmail, setContactEmail] = useState("");
	const [contactPhone, setContactPhone] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");

		if (!barManageId || !password || !contactEmail || !contactPhone) {
			setError("すべての項目を入力してください");
			return;
		}

		if (password.length < 8) {
			setError("パスワードは8文字以上で入力してください");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/bars/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					bar_manage_id: barManageId,
					password,
					contact_email: contactEmail,
					contact_phone: contactPhone,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "登録に失敗しました");
				return;
			}

			setSubmitted(true);
		} catch (_err) {
			setError("登録に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	if (submitted) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 space-y-6 text-center">
					<h1 className="text-2xl font-bold text-gray-900">
						お申し込みを受け付けました
					</h1>
					<p className="text-sm text-gray-600">
						ご登録内容を審査中です。承認され次第、ご登録の店舗IDとパスワードでログインできるようになります。
					</p>
					<Link
						href="/login"
						className="inline-block w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
					>
						ログイン画面へ
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 space-y-6">
				<div>
					<h1 className="text-center text-2xl font-bold text-gray-900">
						Beer Salon Admin
					</h1>
					<p className="mt-2 text-center text-sm text-gray-600">
						店舗登録の申し込み
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
							<p className="mt-1 text-xs text-gray-500">
								半角英数字とハイフンのみ使用できます（例: fuji-beer-bar）
							</p>
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
								autoComplete="new-password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
								placeholder="8文字以上"
							/>
						</div>

						<div>
							<label
								htmlFor="contactEmail"
								className="block text-sm font-medium text-gray-700"
							>
								管理者メールアドレス
							</label>
							<input
								id="contactEmail"
								name="contactEmail"
								type="email"
								autoComplete="email"
								required
								value={contactEmail}
								onChange={(e) => setContactEmail(e.target.value)}
								className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
							/>
						</div>

						<div>
							<label
								htmlFor="contactPhone"
								className="block text-sm font-medium text-gray-700"
							>
								管理者電話番号
							</label>
							<input
								id="contactPhone"
								name="contactPhone"
								type="tel"
								autoComplete="tel"
								required
								value={contactPhone}
								onChange={(e) => setContactPhone(e.target.value)}
								className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
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
							{loading ? "送信中..." : "登録を申し込む"}
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
