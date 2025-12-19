"use client";

import { Clock, FileText, PlusCircle, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
	const pathname = usePathname();

	const isActive = (path: string) => pathname === path;

	return (
		<footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 z-50">
			<div className="max-w-7xl mx-auto px-4">
				<nav className="flex items-center justify-around h-16">
					<Link
						href="/favorites/bars"
						className={`flex flex-col items-center gap-1 transition-colors ${
							isActive("/favorites/bars")
								? "text-primary"
								: "text-foreground hover:text-primary"
						}`}
					>
						<Star
							className={`w-6 h-6 ${isActive("/favorites/bars") ? "fill-primary" : ""}`}
						/>
						<span className="text-xs font-medium">お気に入り</span>
					</Link>

					<Link
						href="/timeline"
						className={`flex flex-col items-center gap-1 transition-colors ${
							isActive("/timeline")
								? "text-primary"
								: "text-foreground hover:text-primary"
						}`}
					>
						<FileText className="w-6 h-6" />
						<span className="text-xs font-medium">タイムライン</span>
					</Link>

					<Link
						href="/posts/new"
						className={`flex flex-col items-center gap-1 transition-colors ${
							isActive("/posts/new")
								? "text-primary"
								: "text-foreground hover:text-primary"
						}`}
					>
						<PlusCircle className="w-6 h-6" />
						<span className="text-xs font-medium">投稿</span>
					</Link>

					<Link
						href="/history/bars"
						className={`flex flex-col items-center gap-1 transition-colors ${
							isActive("/history/bars")
								? "text-primary"
								: "text-foreground hover:text-primary"
						}`}
					>
						<Clock className="w-6 h-6" />
						<span className="text-xs font-medium">閲覧履歴</span>
					</Link>
				</nav>
			</div>
		</footer>
	);
}
