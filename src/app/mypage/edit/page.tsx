import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/user";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { ProfileEditForm } from "./profile-edit-form";
import { GENDERS } from "@/lib/constants/prefectures";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileEditPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/login");
	}

	const supabase = await createClient();
	const {
		data: { user: authUser },
	} = await supabase.auth.getUser();

	if (!authUser) {
		redirect("/login");
	}

	const userProfile = await prisma.userProfile.findUnique({
		where: {
			userAuthId: authUser.id,
		},
	});

	if (!userProfile) {
		redirect("/login");
	}

	const genderLabel =
		GENDERS.find((g) => g.value === userProfile.gender)?.label || "不明";

	return (
		<AuthenticatedLayout>
			<div className="max-w-3xl mx-auto px-4 py-6">
				<div className="glass-card rounded-2xl modern-shadow overflow-hidden animate-fade-in">
					<div className="p-6">
						<h1 className="text-2xl font-bold text-card-foreground mb-6 tracking-tight">
							プロフィール編集
						</h1>

						<ProfileEditForm
							currentProfile={{
								profileImageUrl: userProfile.profileImageUrl || undefined,
								bio: userProfile.bio || undefined,
								nickname: userProfile.nickname,
								lastName: userProfile.lastName,
								firstName: userProfile.firstName,
								email: authUser.email || "",
								birthday: userProfile.birthday.toLocaleDateString("ja-JP", {
									year: "numeric",
									month: "long",
									day: "numeric",
								}),
								gender: genderLabel,
								prefecture: userProfile.prefecture,
							}}
						/>
					</div>
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
