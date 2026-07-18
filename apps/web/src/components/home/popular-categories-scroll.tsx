import { Beer } from "lucide-react";
import Link from "next/link";

// Why not DB マスタ参照: このセクションは検索フォームのカテゴリ語彙（BEER_CATEGORIES）への
// 導線であり、選択で /?cat=<name> の検索へ飛ばすだけのため、検索側と同一の固定語彙で足りる。
const POPULAR_CATEGORIES = [
	"IPA",
	"ピルスナー",
	"スタウト",
	"ヴァイツェン",
	"ペールエール",
];

export function PopularCategoriesScroll() {
	return (
		<section className="w-full">
			<div className="mb-4 flex items-end justify-between">
				<h2 className="font-mincho text-lg font-bold text-heading md:text-xl">
					人気のカテゴリ
				</h2>
				<span className="font-archivo text-xs uppercase tracking-[0.16em] text-muted-foreground">
					Popular
				</span>
			</div>

			<div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible lg:grid-cols-5">
				{POPULAR_CATEGORIES.map((category) => (
					<Link
						key={category}
						href={`/?cat=${encodeURIComponent(category)}`}
						className="group relative flex h-[110px] w-40 shrink-0 flex-col justify-end overflow-hidden rounded-2xl border border-border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 md:h-[130px] md:w-auto"
						style={{
							background: "linear-gradient(160deg,#8a5a2a,#5a3818)",
						}}
					>
						<Beer className="absolute right-3 top-3 h-6 w-6 text-primary/50 transition-transform duration-300 group-hover:scale-110" />
						<span className="relative font-mincho text-base font-bold text-heading">
							{category}
						</span>
					</Link>
				))}
			</div>
		</section>
	);
}
