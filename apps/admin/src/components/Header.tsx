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
		<header className="bg-white shadow-sm">
			<div className="flex items-center justify-between h-16 px-6">
				<div className="flex items-center">
					<h1 className="text-xl font-semibold text-gray-900">
						BeerSalonAdmin
					</h1>
				</div>

				<div className="flex items-center space-x-4">
					<div className="flex items-center space-x-2 text-sm">
						<p className="font-medium text-gray-900">{userName}</p>
						<span
							className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
								userRole === "admin"
									? "bg-purple-100 text-purple-800"
									: "bg-blue-100 text-blue-800"
							}`}
						>
							{userRole === "admin" ? "管理者" : "バーオーナー"}
						</span>
					</div>
					<button
						onClick={handleLogout}
						className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
					>
						ログアウト
					</button>
				</div>
			</div>
		</header>
	);
}
