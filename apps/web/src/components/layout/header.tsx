import { Bell, LogOut, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getUnreadNotificationCount } from "@/actions/notification";
import { logout } from "./actions";
import { HeaderNav } from "./header-nav";

export async function Header() {
	const unreadCount = await getUnreadNotificationCount();

	// 通知ベル・マイページ・ログアウトに共通の丸ボタン（#241a0e 丸 + アンバー薄ボーダー）。
	const iconButtonClass =
		"flex items-center justify-center w-10 h-10 text-foreground bg-surface-raised border border-primary/20 rounded-full transition-colors hover:border-primary/40 relative";

	return (
		<header className="fixed top-0 left-0 right-0 bg-surface-panel backdrop-blur-xl border-b border-border/20 z-50">
			<div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
				<div className="flex items-center gap-11">
					<Link
						href="/"
						className="hover:opacity-80 transition-opacity"
						aria-label="Beer Salon ホーム"
					>
						<Image
							src="/beer-salon-logo-a.svg"
							alt="Beer Salon"
							width={240}
							height={52}
							priority
							className="h-10 w-auto"
						/>
					</Link>

					<HeaderNav />
				</div>

				<div className="flex items-center gap-2">
					<Link
						href="/notifications"
						className={iconButtonClass}
						aria-label="通知"
						data-testid="notification-icon"
					>
						<Bell className="w-5 h-5" />
						{unreadCount > 0 && (
							<span
								data-testid="notification-badge"
								className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center bg-destructive text-white text-xs font-bold rounded-full"
							>
								{unreadCount > 99 ? "99+" : unreadCount}
							</span>
						)}
					</Link>

					<Link
						href="/mypage"
						className={iconButtonClass}
						aria-label="マイページ"
					>
						<User className="w-5 h-5" />
					</Link>

					<form action={logout}>
						<button
							type="submit"
							className={iconButtonClass}
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
