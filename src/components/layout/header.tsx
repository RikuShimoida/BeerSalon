import { Bell, LogOut, User } from "lucide-react";
import Link from "next/link";
import { getUnreadNotificationCount } from "@/actions/notification";
import { logout } from "./actions";

export async function Header() {
	const unreadCount = await getUnreadNotificationCount();

	return (
		<header className="fixed top-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-b border-border/20 z-50 modern-shadow">
			<div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
				<Link
					href="/"
					className="text-xl font-bold text-primary hover:text-primary/80 transition-all duration-300 tracking-tight"
				>
					Beer Salon
				</Link>

				<div className="flex items-center gap-2">
					<Link
						href="/notifications"
						className="p-2.5 text-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-300 relative"
						aria-label="通知"
						data-testid="notification-icon"
					>
						<Bell className="w-5 h-5" />
						{unreadCount > 0 && (
							<span
								data-testid="notification-badge"
								className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full"
							>
								{unreadCount > 99 ? "99+" : unreadCount}
							</span>
						)}
					</Link>

					<Link
						href="/mypage"
						className="p-2.5 text-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-300"
						aria-label="マイページ"
					>
						<User className="w-5 h-5" />
					</Link>

					<form action={logout}>
						<button
							type="submit"
							className="p-2.5 text-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-300"
							aria-label="ログアウト"
						>
							<LogOut className="w-5 h-5" />
						</button>
					</form>
				</div>
			</div>
		</header>
	);
}
