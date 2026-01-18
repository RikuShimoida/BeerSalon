import Image from "next/image";
import { redirect } from "next/navigation";
import { getProfileFromCookie } from "@/app/signup/profile/actions";
import { GENDERS } from "@/lib/constants/prefectures";
import { createClient } from "@/lib/supabase/server";
import { ConfirmForm } from "./confirm-form";

export default async function ConfirmPage() {
	const profileData = await getProfileFromCookie();

	if (!profileData) {
		redirect("/signup/profile");
	}

	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/signup");
	}

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
						{profileData.profileImageUrl && (
							<div className="border-b pb-3 flex flex-col items-center">
								<p className="text-sm text-gray-500 mb-2">プロフィール画像</p>
								<div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary relative">
									<Image
										src={profileData.profileImageUrl}
										alt="プロフィール画像"
										fill
										className="object-cover"
									/>
								</div>
							</div>
						)}

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

						{profileData.bio && (
							<div className="border-b pb-3">
								<p className="text-sm text-gray-500 mb-1">プロフィール文</p>
								<p className="text-base whitespace-pre-wrap">
									{profileData.bio}
								</p>
							</div>
						)}
					</div>

					<ConfirmForm profileData={profileData} />
				</div>
			</div>
		</div>
	);
}
