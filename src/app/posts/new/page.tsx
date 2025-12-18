import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "./post-form";

export default async function NewPostPage({
	searchParams,
}: {
	searchParams: Promise<{ barId?: string }>;
}) {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	const bars = await prisma.bar.findMany({
		where: {
			isActive: true,
		},
		select: {
			id: true,
			name: true,
			prefecture: true,
			city: true,
		},
		orderBy: {
			name: "asc",
		},
	});

	const params = await searchParams;
	const selectedBarId = params.barId;

	return (
		<div className="min-h-screen bg-gray-50 pb-20">
			<div className="max-w-2xl mx-auto px-4 py-8">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900">投稿を作成</h1>
				</div>

				<div className="bg-white p-8 rounded-lg shadow-md">
					<PostForm bars={bars} selectedBarId={selectedBarId} />
				</div>
			</div>
		</div>
	);
}
