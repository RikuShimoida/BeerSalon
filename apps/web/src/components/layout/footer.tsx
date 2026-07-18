"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export function Footer() {
	const pathname = usePathname();

	const isActive = (path: string) => pathname === path;

	return (
		<footer className="fixed bottom-0 left-0 right-0 bg-surface-panel backdrop-blur-xl border-t border-border/20 z-50 md:hidden">
			<nav
				aria-label="メインナビゲーション"
				className="max-w-7xl mx-auto px-4 flex items-center justify-around h-16"
			>
				{NAV_ITEMS.map((item) => {
					const active = isActive(item.href);
					const Icon = item.icon;

					// 中央の「投稿」はアンバーグラデの丸 FAB として一段浮かせる。
					if (item.isPost) {
						return (
							<Link
								key={item.href}
								href={item.href}
								aria-label={item.label}
								aria-current={active ? "page" : undefined}
								className="flex flex-col items-center gap-1"
							>
								<span className="flex items-center justify-center w-11 h-11 -mt-6 rounded-full bg-gradient-to-br from-primary to-primary-strong text-primary-foreground shadow-lg">
									<Icon className="w-6 h-6" strokeWidth={2.6} />
								</span>
							</Link>
						);
					}

					return (
						<Link
							key={item.href}
							href={item.href}
							aria-label={item.label}
							aria-current={active ? "page" : undefined}
							className="flex flex-col items-center gap-1 transition-colors"
						>
							<Icon
								className={`w-6 h-6 ${active ? "text-primary fill-primary" : "text-subtext"}`}
							/>
							<span
								className={`text-[10px] font-medium tracking-wide ${active ? "text-primary" : "text-subtext"}`}
							>
								{item.label}
							</span>
						</Link>
					);
				})}
			</nav>
		</footer>
	);
}
