"use client";

import { useRouter } from "next/navigation";

interface HeaderProps {
	userName: string;
	onToggleSidebar: () => void;
}

export default function Header({ userName, onToggleSidebar }: HeaderProps) {
	const router = useRouter();

	const handleLogout = async () => {
		try {
			const response = await fetch("/api/auth/logout", {
				method: "POST",
			});

			if (response.ok) {
				router.push("/login");
				router.refresh();
			}
		} catch (_error) {}
	};

	return (
		<header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 shrink-0">
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={onToggleSidebar}
					className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
					aria-label="メニューを開く"
				>
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
						role="img"
					>
						<title>メニュー</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>
				<h1 className="text-lg font-bold text-gray-900">Beer Salon Admin</h1>
			</div>

			<div className="flex items-center gap-3">
				<span className="hidden sm:inline text-sm text-gray-600">
					{userName}
				</span>
				<button
					type="button"
					onClick={handleLogout}
					className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
				>
					ログアウト
				</button>
			</div>
		</header>
	);
}
