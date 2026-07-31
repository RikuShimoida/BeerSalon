"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Tab = "top" | "menu" | "posts" | "articles" | "coupons" | "events";

interface BarTabsProps {
	children: {
		top: React.ReactNode;
		menu: React.ReactNode;
		posts: React.ReactNode;
		articles: React.ReactNode;
		coupons: React.ReactNode;
		events: React.ReactNode;
	};
}

export function BarTabs({ children }: BarTabsProps) {
	const [activeTab, setActiveTab] = useState<Tab>("top");
	const scrollRef = useRef<HTMLDivElement>(null);
	const [showLeftFade, setShowLeftFade] = useState(false);
	const [showRightFade, setShowRightFade] = useState(false);

	const updateFades = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;
		const { scrollLeft, scrollWidth, clientWidth } = el;
		setShowLeftFade(scrollLeft > 0);
		// 端数丸め誤差で右端到達を取りこぼさないよう 1px の許容を持たせる
		setShowRightFade(scrollLeft + clientWidth < scrollWidth - 1);
	}, []);

	useEffect(() => {
		updateFades();
		window.addEventListener("resize", updateFades);
		return () => window.removeEventListener("resize", updateFades);
	}, [updateFades]);

	const tabs: { key: Tab; label: string }[] = [
		{ key: "top", label: "基本情報" },
		{ key: "menu", label: "メニュー" },
		{ key: "posts", label: "タグ付けされた投稿" },
		{ key: "articles", label: "お店からの投稿" },
		{ key: "coupons", label: "クーポン" },
		{ key: "events", label: "イベント" },
	];

	return (
		<div className="w-full">
			<div className="sticky top-16 z-10 border-b border-border bg-surface-deep/85 backdrop-blur-md">
				<div className="relative" data-testid="bar-tabs">
					<div
						ref={scrollRef}
						onScroll={updateFades}
						data-testid="bar-tabs-scroller"
						className="overflow-x-auto"
					>
						<nav className="flex min-w-max gap-1 px-4">
							{tabs.map((tab) => {
								const isActive = activeTab === tab.key;
								return (
									<button
										key={tab.key}
										type="button"
										onClick={() => setActiveTab(tab.key)}
										aria-current={isActive ? "page" : undefined}
										className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
											isActive
												? "border-primary text-primary"
												: "border-transparent text-subtext hover:text-heading"
										}`}
									>
										{tab.label}
									</button>
								);
							})}
						</nav>
					</div>
					<div
						aria-hidden="true"
						className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-surface-deep to-transparent transition-opacity duration-200 ${
							showLeftFade ? "opacity-100" : "opacity-0"
						}`}
					/>
					<div
						aria-hidden="true"
						className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface-deep to-transparent transition-opacity duration-200 ${
							showRightFade ? "opacity-100" : "opacity-0"
						}`}
					/>
				</div>
			</div>

			<div className="p-4">{children[activeTab]}</div>
		</div>
	);
}
