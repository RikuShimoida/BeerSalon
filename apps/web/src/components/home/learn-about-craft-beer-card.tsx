import Image from "next/image";
import Link from "next/link";

export function LearnAboutCraftBeerCard() {
	return (
		<section className="w-full">
			<Link
				href="/articles/craft-beer-guide"
				className="relative block h-48 md:h-64 rounded-lg overflow-hidden group"
			>
				<Image
					src="https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=1200&h=600&fit=crop"
					alt="クラフトビールについて知る"
					fill
					className="object-cover"
				/>
				<div className="absolute inset-0 bg-black/40" />
				<div className="absolute inset-0 flex items-center justify-center">
					<h2 className="text-white text-2xl md:text-3xl font-bold drop-shadow-lg">
						クラフトビールについて知る
					</h2>
				</div>
				<div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
			</Link>
		</section>
	);
}
