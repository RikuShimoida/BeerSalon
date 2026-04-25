import Link from "next/link";

export default function MasterDataPage() {
	const masterDataCategories = [
		{
			title: "Beer Styles",
			description: "Manage beer style categories (IPA, Lager, etc.)",
			href: "/admin/master/beer-styles",
			icon: "🍺",
		},
		{
			title: "Breweries",
			description: "Manage brewery information",
			href: "/admin/master/breweries",
			icon: "🏭",
		},
		{
			title: "Food Categories",
			description: "Manage food menu categories",
			href: "/admin/master/food-categories",
			icon: "🍽️",
		},
		{
			title: "Event Categories",
			description: "Manage event categories",
			href: "/admin/master/event-categories",
			icon: "🎉",
		},
	];

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Master Data Management</h1>
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
