import { Bell, LogOut, User } from "lucide-react";
import Link from "next/link";
import { logout } from "./actions";

export function Header() {
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
						className="p-2.5 text-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-300"
						aria-label="通知"
					>
						<Bell className="w-5 h-5" />
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
