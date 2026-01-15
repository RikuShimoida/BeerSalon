import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	try {
		const supabase = await createClient();
		const params = await searchParams;

		if (params.error) {
			throw new Error(
				`認証エラー: ${params.error_description || params.error}`,
			);
		}

		const {
			data: { user },
			error,
		} = await supabase.auth.getUser();

		if (error) {
			console.error("[ProfilePage] Failed to get user:", error);
			throw new Error(`認証エラー: ${error.message}`);
		}

		if (!user) {
			console.warn("[ProfilePage] No user found, redirecting to /signup");
			redirect("/signup");
		}

		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
				<div className="w-full max-w-md">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							プロフィール入力
						</h1>
						<p className="text-gray-600">あと少しで完了です</p>
					</div>

					<div className="bg-white p-8 rounded-lg shadow-md">
						<ProfileForm />
					</div>
				</div>
			</div>
		);
	} catch (error) {
		console.error("[ProfilePage] Unexpected error:", error);

		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
				<div className="w-full max-w-md">
					<div className="bg-white p-8 rounded-lg shadow-md">
						<div className="text-center">
							<h1 className="text-2xl font-bold text-red-600 mb-4">
								エラーが発生しました
							</h1>
							<p className="text-gray-700 mb-4">
								プロフィール入力ページの読み込みに失敗しました。
							</p>
							<p className="text-sm text-gray-600 mb-6">
								{error instanceof Error
									? error.message
									: "不明なエラーが発生しました"}
							</p>
							<a
								href="/signup"
								className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
							>
								新規登録ページに戻る
							</a>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
