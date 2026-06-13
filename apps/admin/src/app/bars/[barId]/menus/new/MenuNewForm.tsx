"use client";

import { useState } from "react";
import BeerMenuCreateForm from "./BeerMenuCreateForm";
import FoodMenuCreateForm from "./FoodMenuCreateForm";

interface MenuNewFormProps {
	barId: string;
}

type TabType = "beer" | "food";

export default function MenuNewForm({ barId }: MenuNewFormProps) {
	const [activeTab, setActiveTab] = useState<TabType>("beer");

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-gray-900">メニュー登録</h1>

			<div className="border-b border-gray-200">
				<nav className="flex gap-0">
					<button
						type="button"
						onClick={() => setActiveTab("beer")}
						className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
							activeTab === "beer"
								? "border-black text-black"
								: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
						}`}
					>
						ビールメニュー
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("food")}
						className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
							activeTab === "food"
								? "border-black text-black"
								: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
						}`}
					>
						食事メニュー
					</button>
				</nav>
			</div>

			{activeTab === "beer" ? (
				<BeerMenuCreateForm barId={barId} />
			) : (
				<FoodMenuCreateForm barId={barId} />
			)}
		</div>
	);
}
