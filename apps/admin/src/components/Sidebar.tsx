"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
	userRole: "bar_owner" | "admin";
}

export default function Sidebar({ userRole }: SidebarProps) {
	const pathname = usePathname();

	const navigation = [
		{ name: "ダッシュボード", href: "/", icon: "📊" },
		{ name: "バー管理", href: "/bars", icon: "🏪" },
		{ name: "メニュー", href: "/menus", icon: "🍺" },
		{ name: "記事", href: "/articles", icon: "📝" },
		{ name: "クーポン", href: "/coupons", icon: "🎫" },
		{ name: "課金情報", href: "/billing", icon: "💳" },
	];

	const adminNavigation = [{ name: "マスタ管理", href: "/admin", icon: "⚙️" }];

	const isActive = (href: string) => {
		if (href === "/") {
			return pathname === href;
		}
		return pathname.startsWith(href);
	};

	return (
		<div className="flex flex-col w-64 bg-gray-800">
			<div className="flex items-center justify-center h-16 bg-gray-900">
				<span className="text-white text-xl font-bold">🍺 BeerSalon</span>
			</div>
			<nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
				{navigation.map((item) => (
					<Link
						key={item.name}
						href={item.href}
						className={`
              flex items-center py-3 text-sm font-medium rounded-md
              ${
								isActive(item.href)
									? "bg-gray-700 text-white border-l-4 border-blue-500 pl-3"
									: "text-gray-300 hover:bg-gray-700 hover:text-white pl-4"
							}
            `}
					>
						<span className="mr-3 text-xl">{item.icon}</span>
						{item.name}
					</Link>
				))}

				{userRole === "admin" && (
					<>
						<div className="pt-4 mt-4 border-t border-gray-700">
							<p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
								管理者メニュー
							</p>
						</div>
						{adminNavigation.map((item) => (
							<Link
								key={item.name}
								href={item.href}
								className={`
                  flex items-center py-3 text-sm font-medium rounded-md
                  ${
										isActive(item.href)
											? "bg-gray-700 text-white border-l-4 border-blue-500 pl-3"
											: "text-gray-300 hover:bg-gray-700 hover:text-white pl-4"
									}
                `}
							>
								<span className="mr-3 text-xl">{item.icon}</span>
								{item.name}
							</Link>
						))}
					</>
				)}
			</nav>
		</div>
	);
}
