import { redirect } from "next/navigation";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
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
		<AuthenticatedLayout>
			<div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-semibold text-foreground">投稿を作成</h1>
				</div>

				<div className="bg-card p-8 rounded-lg shadow-md">
					<PostForm bars={bars} selectedBarId={selectedBarId} />
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
