import Link from "next/link";

export function LearnAboutCraftBeerCard() {
	return (
		<section className="w-full">
			<Link
				href="/articles/craft-beer-guide"
				className="relative block h-48 md:h-64 rounded-lg overflow-hidden group"
			>
				<div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-800" />
				<div className="absolute inset-0 flex items-center justify-center">
					<h2 className="text-white text-2xl md:text-3xl font-bold drop-shadow-lg">
						クラフトビールについて知る
					</h2>
				</div>
				<div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
			</Link>
		</section>
	);
}
