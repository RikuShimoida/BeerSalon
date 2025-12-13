import { Bell, LogOut, User } from "lucide-react";
import Link from "next/link";
import { logout } from "./actions";

export function Header() {
	return (
		<header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
			<div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
				<Link href="/" className="text-xl font-bold text-gray-900">
					Beer Salon
				</Link>

				<div className="flex items-center gap-4">
					<Link
						href="/notifications"
						className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
						aria-label="通知"
					>
						<Bell className="w-5 h-5" />
					</Link>

					<Link
						href="/mypage"
						className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
						aria-label="マイページ"
					>
						<User className="w-5 h-5" />
					</Link>

					<form action={logout}>
						<button
							type="submit"
							className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
