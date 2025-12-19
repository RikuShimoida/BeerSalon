import Link from "next/link";
import { redirect } from "next/navigation";
import { getFollowingUsers } from "@/actions/user";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

export default async function FollowingPage() {
	const followingUsers = await getFollowingUsers();

	if (followingUsers === null) {
		redirect("/login");
	}

	return (
		<AuthenticatedLayout>
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="glass-card rounded-2xl modern-shadow overflow-hidden animate-fade-in">
					<div className="p-6 border-b border-border/50">
						<h1 className="text-2xl font-bold text-card-foreground tracking-tight">
							フォロー
						</h1>
					</div>

					{followingUsers.length === 0 ? (
						<div className="p-8 text-center">
							<p className="text-muted-foreground tracking-wide">
								フォローしているユーザーはいません
							</p>
						</div>
					) : (
						<div className="divide-y divide-border/50">
							{followingUsers.map((user) => (
								<Link
									key={user.id}
									href={`/users/${user.id}`}
									className="flex items-center justify-between p-4 hover:bg-primary/10 transition-all duration-300"
								>
									<div className="flex flex-col">
										<span className="text-card-foreground font-medium tracking-wide">
											{user.nickname}
										</span>
										<span className="text-sm text-muted-foreground tracking-wide">
											{user.lastName} {user.firstName}
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
