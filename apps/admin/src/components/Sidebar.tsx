"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
	userRole: "bar_owner" | "admin";
	barId: number | null;
	isOpen: boolean;
	onClose: () => void;
}

interface NavItem {
	name: string;
	href: string;
}

export default function Sidebar({
	userRole,
	barId,
	isOpen,
	onClose,
}: SidebarProps) {
	const pathname = usePathname();

	const getNavItems = (): NavItem[] => {
		if (userRole === "admin") {
			return [{ name: "店舗一覧", href: "/bars" }];
		}

		if (!barId) return [{ name: "ダッシュボード", href: "/" }];

		return [
			{ name: "ダッシュボード", href: "/" },
			{ name: "店舗情報", href: `/bars/${barId}` },
			{ name: "メニュー管理", href: `/bars/${barId}/menus` },
			{ name: "記事管理", href: `/bars/${barId}/articles` },
			{ name: "クーポン管理", href: `/bars/${barId}/coupons` },
			{ name: "イベント管理", href: `/bars/${barId}/events` },
		];
	};

	const navItems = getNavItems();

	const isActive = (href: string) => {
		if (href === "/bars" && userRole === "admin") {
			return pathname === "/bars" || pathname === "/bars/new";
		}
		// Why not: "/" は startsWith で全パスに前方一致してしまい常時アクティブ扱いになるため、完全一致のみ。
		if (href === "/") {
			return pathname === "/";
		}
		return pathname === href || pathname.startsWith(`${href}/`);
	};

	const navContent = (
		<nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
			{navItems.map((item) => (
				<Link
					key={item.href}
					href={item.href}
					onClick={onClose}
					className={`block px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
						isActive(item.href)
							? "bg-gray-900 text-white"
							: "text-gray-700 hover:bg-gray-100"
					}`}
				>
					{item.name}
				</Link>
			))}
		</nav>
	);

	return (
		<>
			{isOpen && (
				<button
					type="button"
					className="fixed inset-0 bg-black/50 z-40 md:hidden cursor-default"
					onClick={onClose}
					aria-label="メニューを閉じる"
				/>
			)}

			<aside
				className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:shrink-0 ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 md:hidden">
					<span className="text-lg font-bold text-gray-900">メニュー</span>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
						aria-label="メニューを閉じる"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
							role="img"
						>
							<title>閉じる</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
				{navContent}
			</aside>
		</>
	);
}
