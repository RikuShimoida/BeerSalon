import { Bell, LogOut, User } from "lucide-react";
import Link from "next/link";
import { logout } from "./actions";

export function Header() {
	return (
		<header className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border/50 z-50">
			<div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
				<Link
					href="/"
					className="text-xl font-semibold text-primary hover:text-primary/80 transition-colors"
				>
					Beer Salon
				</Link>

				<div className="flex items-center gap-2">
					<Link
						href="/notifications"
						className="p-2 text-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
						aria-label="通知"
					>
						<Bell className="w-5 h-5" />
					</Link>

					<Link
						href="/mypage"
						className="p-2 text-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
						aria-label="マイページ"
					>
						<User className="w-5 h-5" />
					</Link>

					<form action={logout}>
						<button
							type="submit"
							className="p-2 text-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
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
