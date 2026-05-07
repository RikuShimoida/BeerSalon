import Link from "next/link";

export default function MasterDataPage() {
	const masterDataCategories = [
		{
			title: "ビアスタイル",
			description: "ビアスタイル（IPA、ラガーなど）の管理",
			href: "/admin/master/beer-styles",
			icon: "🍺",
		},
		{
			title: "醸造所",
			description: "醸造所情報の管理",
			href: "/admin/master/breweries",
			icon: "🏭",
		},
		{
			title: "フードカテゴリ",
			description: "フードメニューカテゴリの管理",
			href: "/admin/master/food-categories",
			icon: "🍽️",
		},
		{
			title: "イベントカテゴリ",
			description: "イベントカテゴリの管理",
			href: "/admin/master/event-categories",
			icon: "🎉",
		},
	];

	return (
		<div className="p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">マスタデータ管理</h1>
				<p className="mt-1 text-sm text-gray-600">
					各種マスタデータの追加・編集ができます
				</p>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{masterDataCategories.map((category) => (
					<Link
						key={category.href}
						href={category.href}
						className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
					>
						<div className="flex items-center mb-2">
							<span className="text-3xl mr-3">{category.icon}</span>
							<h2 className="text-xl font-semibold">{category.title}</h2>
						</div>
						<p className="text-gray-600">{category.description}</p>
					</Link>
				))}
			</div>
		</div>
	);
}
