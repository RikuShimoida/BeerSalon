import { Beer, Factory, UtensilsCrossed } from "lucide-react";
import Image from "next/image";

interface BeerMenuSize {
	id: string;
	sizeName: string;
	price: number | null;
	sortOrder: number;
}

interface BeerMenu {
	id: string;
	sizes: BeerMenuSize[];
	description: string | null;
	imageUrl: string | null;
	beer: {
		name: string;
		description: string | null;
		origin: string | null;
		abv?: string;
		brewery: {
			name: string;
		} | null;
		beerCategory: {
			name: string;
		};
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

export function MenuTab({ beerMenus, foodMenus }: MenuTabProps) {
	return (
		<div className="space-y-10">
			<section>
				<div className="mb-4 flex items-center gap-3">
					<h2 className="font-archivo text-xl font-bold uppercase tracking-wide text-heading">
						Beers
					</h2>
					<span className="h-px flex-1 bg-border" />
					{beerMenus.length > 0 && (
						<span className="text-xs font-medium text-primary">
							On Tap {beerMenus.length}
						</span>
					)}
				</div>
				{beerMenus.length === 0 ? (
					<p className="text-sm text-subtext">
						ビールメニューはまだ登録されていません。
					</p>
				) : (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{beerMenus.map((menu) => (
							<div
								key={menu.id}
								className="flex gap-4 rounded-2xl border border-border bg-surface-raised p-4"
							>
								<div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-deep">
									{menu.imageUrl ? (
										<Image
											src={menu.imageUrl}
											alt={menu.beer.name}
											fill
											className="object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-raised to-surface-deep text-primary/40">
											<Beer className="h-8 w-8" />
										</div>
									)}
								</div>
								<div className="min-w-0 flex-1">
									<h3 className="font-mincho text-base font-bold text-heading">
										{menu.beer.name}
									</h3>
									<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
										<span className="text-xs text-subtext">
											{menu.beer.beerCategory.name}
										</span>
										{menu.beer.abv && (
											<span className="text-xs font-semibold text-primary">
												ABV {menu.beer.abv}%
											</span>
										)}
									</div>
									{(menu.description || menu.beer.description) && (
										<p className="mt-2 text-sm leading-relaxed text-subtext">
											{menu.description || menu.beer.description}
										</p>
									)}
									{(menu.beer.brewery || menu.beer.origin) && (
										<p className="mt-2 flex items-center gap-1.5 text-xs text-subtext">
											<Factory className="h-3.5 w-3.5 text-primary" />
											{[menu.beer.brewery?.name, menu.beer.origin]
												.filter(Boolean)
												.join(" / ")}
										</p>
									)}
									{menu.sizes.length > 0 && (
										<div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
											{menu.sizes.map((size) => (
												<span key={size.id} className="text-xs text-subtext">
													{size.sizeName}
													{size.price !== null && (
														<span className="ml-1 font-semibold text-heading">
															¥{size.price.toLocaleString()}
														</span>
													)}
												</span>
											))}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			<section>
				<div className="mb-4 flex items-center gap-3">
					<h2 className="font-archivo text-xl font-bold uppercase tracking-wide text-heading">
						Meals
					</h2>
					<span className="h-px flex-1 bg-border" />
				</div>
				{foodMenus.length === 0 ? (
					<p className="text-sm text-subtext">
						料理メニューはまだ登録されていません。
					</p>
				) : (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{foodMenus.map((menu) => (
							<div
								key={menu.id}
								className="overflow-hidden rounded-2xl border border-border bg-surface-raised"
							>
								<div className="relative aspect-[4/3] w-full bg-surface-deep">
									{menu.imageUrl ? (
										<Image
											src={menu.imageUrl}
											alt={menu.name}
											fill
											className="object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-raised to-surface-deep text-primary/40">
											<UtensilsCrossed className="h-10 w-10" />
										</div>
									)}
								</div>
								<div className="p-4">
									<h3 className="font-mincho text-base font-bold text-heading">
										{menu.name}
									</h3>
									{menu.price !== null && (
										<p className="mt-1 text-sm font-semibold text-primary">
											¥{menu.price.toLocaleString()}
										</p>
									)}
									{menu.description && (
										<p className="mt-2 text-sm leading-relaxed text-subtext">
											{menu.description}
										</p>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
