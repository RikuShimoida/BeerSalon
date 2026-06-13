"use client";

import { Clock, FileText, PlusCircle, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
	const pathname = usePathname();

	const isActive = (path: string) => pathname === path;

	return (
		<footer
			className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t border-border/20 z-50 modern-shadow"
			style={{ backgroundColor: "#f0e68c" }}
		>
			<div className="max-w-7xl mx-auto px-4">
				<nav className="flex items-center justify-around h-16">
					<Link
						href="/favorites/bars"
						className="flex flex-col items-center gap-1 transition-all duration-300"
					>
						<div
							className={`p-2 rounded-full transition-all duration-300 ${
								isActive("/favorites/bars")
									? "bg-white scale-110"
									: "bg-white/80 hover:bg-white hover:scale-105"
							}`}
						>
							<Star
								className={`w-6 h-6 transition-all duration-300 text-foreground ${isActive("/favorites/bars") ? "fill-primary text-primary" : ""}`}
							/>
						</div>
						<span className="text-xs font-medium tracking-wide text-foreground">
							お気に入り
						</span>
					</Link>

					<Link
						href="/timeline"
						className="flex flex-col items-center gap-1 transition-all duration-300"
					>
						<div
							className={`p-2 rounded-full transition-all duration-300 ${
								isActive("/timeline")
									? "bg-white scale-110"
									: "bg-white/80 hover:bg-white hover:scale-105"
							}`}
						>
							<FileText
								className={`w-6 h-6 text-foreground ${isActive("/timeline") ? "text-primary" : ""}`}
							/>
						</div>
						<span className="text-xs font-medium tracking-wide text-foreground">
							タイムライン
						</span>
					</Link>

					<Link
						href="/posts/new"
						className="flex flex-col items-center gap-1 transition-all duration-300"
					>
						<div
							className={`p-2 rounded-full transition-all duration-300 ${
								isActive("/posts/new")
									? "bg-white scale-110"
									: "bg-white/80 hover:bg-white hover:scale-105"
							}`}
						>
							<PlusCircle
								className={`w-6 h-6 text-foreground ${isActive("/posts/new") ? "text-primary" : ""}`}
							/>
						</div>
						<span className="text-xs font-medium tracking-wide text-foreground">
							投稿
						</span>
					</Link>

					<Link
						href="/history/bars"
						className="flex flex-col items-center gap-1 transition-all duration-300"
					>
						<div
							className={`p-2 rounded-full transition-all duration-300 ${
								isActive("/history/bars")
									? "bg-white scale-110"
									: "bg-white/80 hover:bg-white hover:scale-105"
							}`}
						>
							<Clock
								className={`w-6 h-6 text-foreground ${isActive("/history/bars") ? "text-primary" : ""}`}
							/>
						</div>
						<span className="text-xs font-medium tracking-wide text-foreground">
							閲覧履歴
						</span>
					</Link>
				</nav>
			</div>
		</footer>
	);
}
