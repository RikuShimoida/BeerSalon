import Link from "next/link";

type RankingItem = {
	id: string | number;
	name: string;
	rank: number;
	href: string;
};

type PopularRankingSectionProps = {
	title: string;
	items: RankingItem[];
};

export function PopularRankingSection({
	title,
	items,
}: PopularRankingSectionProps) {
	if (items.length === 0) {
		return null;
	}

	const getRankBadgeColor = (rank: number) => {
		switch (rank) {
			case 1:
				return "bg-yellow-500 text-white";
			case 2:
				return "bg-gray-400 text-white";
			case 3:
				return "bg-amber-700 text-white";
			default:
				return "bg-gray-300 text-gray-700";
		}
	};

	return (
		<section className="w-full">
			<h2 className="text-2xl md:text-3xl font-bold mb-6">{title}</h2>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{items.map((item) => (
					<Link
						key={item.id}
						href={item.href}
						className="group relative block h-32 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
					>
						<div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-700" />
						<div className="absolute top-4 left-4">
							<span
								className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold ${getRankBadgeColor(item.rank)}`}
							>
								{item.rank}
							</span>
						</div>
						<div className="absolute inset-0 flex items-center justify-center px-4">
							<h3 className="text-white text-xl md:text-2xl font-bold text-center drop-shadow-lg">
								{item.name}
							</h3>
						</div>
						<div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
					</Link>
				))}
			</div>
		</section>
	);
}
