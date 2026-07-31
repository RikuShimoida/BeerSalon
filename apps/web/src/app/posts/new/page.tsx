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
			<div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
				{bar ? (
					<PostForm bar={bar} />
				) : (
					<div className="mb-6">
						<p className="font-archivo text-xs uppercase tracking-[0.2em] text-primary mb-1">
							New Post
						</p>
						<h1 className="font-mincho text-3xl text-heading mb-6">
							投稿を作成
						</h1>
						<div className="bg-card rounded-2xl border border-primary/15 p-8 flex flex-col items-center gap-6 text-center">
							<p className="text-card-foreground">
								投稿する店舗の詳細ページから「このお店に投稿する」を押して投稿してください。
							</p>
							<Link
								href="/"
								className="px-6 py-3 rounded-lg bg-gradient-to-br from-primary to-primary-strong text-primary-foreground font-medium hover:opacity-90 transition-opacity"
							>
								店舗を探す
							</Link>
						</div>
					</div>
				)}
			</div>
		</AuthenticatedLayout>
	);
}
