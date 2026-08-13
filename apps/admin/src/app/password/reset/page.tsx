import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-form";

// Why not page 本体を "use client" にする: useSearchParams を使うクライアントコンポーネントは
// 本番ビルドの静的プリレンダリングで Suspense 境界を要求される。境界が無いと
// /password/reset のプリレンダリングが失敗する。フォーム本体を切り出し Suspense で包む。
export default function ResetPasswordPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-gray-50" />
			}
		>
			<ResetPasswordForm />
		</Suspense>
	);
}
