"use client";

import { useState } from "react";

type Tab = "top" | "menu" | "posts" | "articles" | "coupons";

interface BarTabsProps {
	children: {
		top: React.ReactNode;
		menu: React.ReactNode;
		posts: React.ReactNode;
		articles: React.ReactNode;
		coupons: React.ReactNode;
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
	];

	return (
		<div className="w-full">
			<div className="border-b border-gray-200 overflow-x-auto">
				<nav className="flex space-x-4 min-w-max px-4">
					{tabs.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => setActiveTab(tab.key)}
							className={`py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
								activeTab === tab.key
									? "border-blue-500 text-blue-600"
									: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
							}`}
						>
							{tab.label}
						</button>
					))}
				</nav>
			</div>

			<div className="p-4">{children[activeTab]}</div>
		</div>
	);
}
