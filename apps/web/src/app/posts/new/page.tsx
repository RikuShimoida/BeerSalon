import Link from "next/link";
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

	const params = await searchParams;
	const barIdParam = params.barId;

	const bar =
		barIdParam && /^\d+$/.test(barIdParam)
			? await prisma.bar.findFirst({
					where: {
						id: BigInt(barIdParam),
						isActive: true,
					},
					select: {
						id: true,
						name: true,
						prefecture: true,
						city: true,
					},
				})
			: null;

	return (
		<AuthenticatedLayout>
			<div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-semibold text-foreground">投稿を作成</h1>
				</div>

				<div className="bg-card p-8 rounded-lg shadow-md">
					{bar ? (
						<PostForm bar={bar} />
					) : (
						<div className="flex flex-col items-center gap-6 text-center">
							<p className="text-foreground">
								投稿する店舗の詳細ページから「このお店に投稿する」を押して投稿してください。
							</p>
							<Link
								href="/"
								className="px-6 py-3 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700 transition-colors"
							>
								店舗を探す
							</Link>
						</div>
					)}
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
