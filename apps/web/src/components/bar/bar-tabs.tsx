"use client";

import { useState } from "react";

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
			<div className="sticky top-16 z-10 border-b border-border bg-surface-deep/85 backdrop-blur-md overflow-x-auto">
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

			<div className="p-4">{children[activeTab]}</div>
		</div>
	);
}
