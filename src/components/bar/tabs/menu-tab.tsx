import Image from "next/image";

interface BeerMenu {
	id: string;
	price: number | null;
	size: string | null;
	description: string | null;
	imageUrl: string | null;
	beer: {
		name: string;
		description: string | null;
		origin: string | null;
		brewery: {
			name: string;
		} | null;
	};
}

interface FoodMenu {
	id: string;
	name: string;
	price: number | null;
	description: string | null;
	imageUrl: string | null;
}

interface MenuTabProps {
	beerMenus: BeerMenu[];
	foodMenus: FoodMenu[];
}

const getBeerFallbackImage = (index: number) => {
	const seed = index % 10;
	return `https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&h=600&fit=crop&crop=center&auto=format&q=80&seed=${seed}`;
};

const getFoodFallbackImage = (index: number) => {
	const seed = index % 10;
	return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&crop=center&auto=format&q=80&seed=${seed}`;
};

export function MenuTab({ beerMenus, foodMenus }: MenuTabProps) {
	return (
		<div className="space-y-8">
			<section>
				<h2 className="text-xl font-bold text-gray-900 mb-4">Beers</h2>
				{beerMenus.length === 0 ? (
					<p className="text-gray-500">
						ビールメニューはまだ登録されていません。
					</p>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{beerMenus.map((menu, index) => (
							<div
								key={menu.id}
								className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
							>
								<div className="relative w-full h-48 mb-3 rounded-md overflow-hidden bg-gray-100">
									<Image
										src={menu.imageUrl || getBeerFallbackImage(index)}
										alt={menu.beer.name}
										fill
										className="object-cover"
									/>
								</div>
								<h3 className="font-bold text-lg text-gray-900 mb-1">
									{menu.beer.name}
								</h3>
								{menu.beer.brewery && (
									<p className="text-sm text-gray-600 mb-1">
										醸造所: {menu.beer.brewery.name}
									</p>
								)}
								{menu.beer.origin && (
									<p className="text-sm text-gray-600 mb-1">
										産地: {menu.beer.origin}
									</p>
								)}
								{menu.size && (
									<p className="text-sm text-gray-600 mb-1">
										サイズ: {menu.size}
									</p>
								)}
								{menu.price !== null && (
									<p className="text-sm font-semibold text-gray-900 mb-2">
										¥{menu.price.toLocaleString()}
									</p>
								)}
								{(menu.description || menu.beer.description) && (
									<p className="text-sm text-gray-700">
										{menu.description || menu.beer.description}
									</p>
								)}
							</div>
						))}
					</div>
				)}
			</section>

			<section>
				<h2 className="text-xl font-bold text-gray-900 mb-4">Meals</h2>
				{foodMenus.length === 0 ? (
					<p className="text-gray-500">
						料理メニューはまだ登録されていません。
					</p>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{foodMenus.map((menu, index) => (
							<div
								key={menu.id}
								className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
							>
								<div className="relative w-full h-48 mb-3 rounded-md overflow-hidden bg-gray-100">
									<Image
										src={menu.imageUrl || getFoodFallbackImage(index)}
										alt={menu.name}
										fill
										className="object-cover"
									/>
								</div>
								<h3 className="font-bold text-lg text-gray-900 mb-1">
									{menu.name}
								</h3>
								{menu.price !== null && (
									<p className="text-sm font-semibold text-gray-900 mb-2">
										¥{menu.price.toLocaleString()}
									</p>
								)}
								{menu.description && (
									<p className="text-sm text-gray-700">{menu.description}</p>
								)}
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
