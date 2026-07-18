"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

// PC ヘッダーの横ナビ + 「投稿する」プライマリボタン。
// Why not Header に直書き: アクティブ判定に usePathname が要る（Client）が、
// 未読数取得は Server の Header に残したいため、横ナビ部だけを子 Client に切り出す。
export function HeaderNav() {
	const pathname = usePathname();
	const isActive = (path: string) => pathname === path;

	const linkItems = NAV_ITEMS.filter((item) => !item.isPost);
	const postItem = NAV_ITEMS.find((item) => item.isPost);

	return (
		<div className="hidden md:flex items-center gap-8">
			<nav
				aria-label="メインナビゲーション"
				className="flex items-center gap-7"
			>
				{linkItems.map((item) => {
					const active = isActive(item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							aria-current={active ? "page" : undefined}
							className={`text-sm transition-colors pb-1 border-b-2 ${
								active
									? "text-primary font-bold border-primary"
									: "text-subtext border-transparent hover:text-foreground"
							}`}
						>
							{item.label === "履歴" ? "閲覧履歴" : item.label}
						</Link>
					);
				})}
			</nav>

			{postItem && (
				<Link
					href={postItem.href}
					className="flex items-center gap-2 bg-gradient-to-br from-primary to-primary-strong text-primary-foreground font-bold text-sm px-4 py-2 rounded-xl transition-opacity hover:opacity-90"
				>
					<Plus className="w-4 h-4" strokeWidth={2.6} />
					投稿する
				</Link>
			)}
		</div>
	);
}
