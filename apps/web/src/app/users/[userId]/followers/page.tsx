import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getUserById, getUserFollowers } from "@/actions/user";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

type UserFollowersPageProps = {
	params: Promise<{
		userId: string;
	}>;
};

export default async function UserFollowersPage({
	params,
}: UserFollowersPageProps) {
	const { userId } = await params;
	const currentUser = await getCurrentUser();

	if (!currentUser) {
		redirect("/login");
	}

	const user = await getUserById(userId);

	if (!user) {
		redirect("/");
	}

	const followers = await getUserFollowers(userId);

	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="glass-card rounded-2xl modern-shadow overflow-hidden animate-fade-in">
					<div className="p-6 border-b border-border/50">
						<h1 className="text-2xl font-bold text-card-foreground tracking-tight">
							{user.nickname}のフォロワー
						</h1>
					</div>

					{followers.length === 0 ? (
						<div className="p-8 text-center">
							<p className="text-muted-foreground tracking-wide">
								フォロワーはいません
							</p>
						</div>
					) : (
						<div className="divide-y divide-border/50">
							{followers.map((follower) => (
								<Link
									key={follower.id}
									href={`/users/${follower.id}`}
									className="flex items-center justify-between p-4 hover:bg-primary/10 transition-all duration-300"
								>
									<div className="flex flex-col">
										<span className="text-card-foreground font-medium tracking-wide">
											{follower.nickname}
										</span>
										<span className="text-sm text-muted-foreground tracking-wide">
											{follower.lastName} {follower.firstName}
										</span>
									</div>
									<svg
										className="w-5 h-5 text-muted-foreground"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										role="img"
										aria-label="次へ"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</Link>
							))}
						</div>
					)}
				</div>
			</div>
		</AuthenticatedLayout>
	);
}
