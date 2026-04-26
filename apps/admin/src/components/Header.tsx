"use client";

import { useRouter } from "next/navigation";

interface HeaderProps {
	userName: string;
	userRole: "bar_owner" | "admin";
}

export default function Header({ userName, userRole }: HeaderProps) {
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
		<header className="bg-white shadow">
			<div className="flex items-center justify-between h-16 px-6">
				<div className="flex items-center">
					<h1 className="text-xl font-semibold text-gray-900">
						BeerSalonAdmin
					</h1>
				</div>

				<div className="flex items-center space-x-4">
					<div className="text-sm">
						<p className="font-medium text-gray-900">{userName}</p>
						<p className="text-gray-500">
							{userRole === "admin" ? "管理者" : "バーオーナー"}
						</p>
					</div>
					<button
						onClick={handleLogout}
						className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
					>
						ログアウト
					</button>
				</div>
			</div>
		</header>
	);
}
