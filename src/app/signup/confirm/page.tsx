import { redirect } from "next/navigation";
import { GENDERS } from "@/lib/constants/prefectures";
import { createClient } from "@/lib/supabase/server";
import { ConfirmForm } from "./confirm-form";

export default async function ConfirmPage({
	searchParams,
}: {
	searchParams: Promise<{ data?: string }>;
}) {
	const params = await searchParams;

	if (!params.data) {
		redirect("/signup/profile");
	}

	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/signup");
	}

	const profileData = JSON.parse(decodeURIComponent(params.data));

	const genderLabel =
		GENDERS.find((g) => g.value === profileData.gender)?.label || "不明";

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						登録内容の確認
					</h1>
					<p className="text-gray-600">内容をご確認ください</p>
				</div>

				<div className="bg-white p-8 rounded-lg shadow-md">
					<div className="space-y-4 mb-6">
						<div className="border-b pb-3">
							<p className="text-sm text-gray-500 mb-1">姓</p>
							<p className="text-lg font-medium">{profileData.lastName}</p>
						</div>

						<div className="border-b pb-3">
							<p className="text-sm text-gray-500 mb-1">名</p>
							<p className="text-lg font-medium">{profileData.firstName}</p>
						</div>

						<div className="border-b pb-3">
							<p className="text-sm text-gray-500 mb-1">ニックネーム</p>
							<p className="text-lg font-medium">{profileData.nickname}</p>
						</div>

						<div className="border-b pb-3">
							<p className="text-sm text-gray-500 mb-1">生年月日</p>
							<p className="text-lg font-medium">
								{new Date(profileData.birthday).toLocaleDateString("ja-JP", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</p>
						</div>

						<div className="border-b pb-3">
							<p className="text-sm text-gray-500 mb-1">性別</p>
							<p className="text-lg font-medium">{genderLabel}</p>
						</div>

						<div className="border-b pb-3">
							<p className="text-sm text-gray-500 mb-1">お住まいの都道府県</p>
							<p className="text-lg font-medium">{profileData.prefecture}</p>
						</div>
					</div>

					<ConfirmForm
						profileData={profileData}
						genderLabel={genderLabel}
						backUrl={`/signup/profile?data=${encodeURIComponent(params.data)}`}
					/>
				</div>
			</div>
		</div>
	);
}
