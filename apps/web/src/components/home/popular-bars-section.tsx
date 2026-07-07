import Image from "next/image";
import Link from "next/link";

type PopularBar = {
	id: number;
	name: string;
	rank: number;
	href: string;
	imageUrl?: string;
};

type PopularBarsSectionProps = {
	title: string;
	bars: PopularBar[];
};

export function PopularBarsSection({ title, bars }: PopularBarsSectionProps) {
	if (bars.length === 0) {
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
				return "bg-[#3d2b17] text-[#c4a878]";
		}
	};

	return (
		<section className="w-full">
			<h2 className="text-2xl md:text-3xl font-bold mb-6">{title}</h2>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{bars.map((bar) => (
					<Link
						key={bar.id}
						href={bar.href}
						className="group relative block h-48 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
					>
						{bar.imageUrl ? (
							<Image
								src={bar.imageUrl}
								alt={bar.name}
								fill
								className="object-cover group-hover:scale-105 transition-transform duration-300"
							/>
						) : (
							<div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-700" />
						)}
						<div className="absolute inset-0 bg-black/30" />
						<div className="absolute top-4 left-4">
							<span
								className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold ${getRankBadgeColor(bar.rank)} shadow-lg`}
							>
								{bar.rank}
							</span>
						</div>
						<div className="absolute inset-0 flex items-center justify-center px-4">
							<h3 className="text-white text-xl md:text-2xl font-bold text-center drop-shadow-lg">
								{bar.name}
							</h3>
						</div>
						<div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
					</Link>
				))}
			</div>
		</section>
	);
}
