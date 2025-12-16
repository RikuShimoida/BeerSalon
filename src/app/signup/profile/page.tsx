import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
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
}
