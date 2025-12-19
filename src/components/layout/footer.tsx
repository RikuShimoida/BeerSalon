"use client";

import { Clock, FileText, PlusCircle, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
	const pathname = usePathname();

	const isActive = (path: string) => pathname === path;

	return (
		<footer className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border/20 z-50 modern-shadow">
			<div className="max-w-7xl mx-auto px-4">
				<nav className="flex items-center justify-around h-16">
					<Link
						href="/favorites/bars"
						className={`flex flex-col items-center gap-1 transition-all duration-300 ${
							isActive("/favorites/bars")
								? "text-primary scale-110"
								: "text-foreground hover:text-primary hover:scale-105"
						}`}
					>
						<Star
							className={`w-6 h-6 transition-all duration-300 ${isActive("/favorites/bars") ? "fill-primary" : ""}`}
						/>
						<span className="text-xs font-medium tracking-wide">
							お気に入り
						</span>
					</Link>

					<Link
						href="/timeline"
						className={`flex flex-col items-center gap-1 transition-all duration-300 ${
							isActive("/timeline")
								? "text-primary scale-110"
								: "text-foreground hover:text-primary hover:scale-105"
						}`}
					>
						<FileText className="w-6 h-6" />
						<span className="text-xs font-medium tracking-wide">
							タイムライン
						</span>
					</Link>

					<Link
						href="/posts/new"
						className={`flex flex-col items-center gap-1 transition-all duration-300 ${
							isActive("/posts/new")
								? "text-primary scale-110"
								: "text-foreground hover:text-primary hover:scale-105"
						}`}
					>
						<PlusCircle className="w-6 h-6" />
						<span className="text-xs font-medium tracking-wide">投稿</span>
					</Link>

					<Link
						href="/history/bars"
						className={`flex flex-col items-center gap-1 transition-all duration-300 ${
							isActive("/history/bars")
								? "text-primary scale-110"
								: "text-foreground hover:text-primary hover:scale-105"
						}`}
					>
						<Clock className="w-6 h-6" />
						<span className="text-xs font-medium tracking-wide">閲覧履歴</span>
					</Link>
				</nav>
			</div>
		</footer>
	);
}
