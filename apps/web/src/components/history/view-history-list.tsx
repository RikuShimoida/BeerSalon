import { Beer, ChevronRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
	groupViewHistories,
	type ViewHistoryItem,
} from "@/lib/history/group-view-histories";

interface ViewHistoryListProps {
	histories: ViewHistoryItem[];
}

export function ViewHistoryList({ histories }: ViewHistoryListProps) {
	const groups = groupViewHistories(histories);

	return (
		<div className="flex flex-col gap-8">
			{groups.map((group) => (
				<section key={group.key}>
					<h2 className="mb-3 font-archivo text-sm font-semibold uppercase tracking-wider text-primary">
						{group.label}
					</h2>
					<ul className="flex flex-col gap-2">
						{group.items.map((item) => (
							<li key={item.id}>
								<Link
									href={`/bars/${item.bar.id}`}
									className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all duration-300 hover:border-primary/30"
								>
									<div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-surface-raised">
										{item.bar.imageUrl ? (
											<Image
												src={item.bar.imageUrl}
												alt={item.bar.name}
												fill
												className="object-cover"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-raised to-surface-deep text-primary/40">
												<Beer className="h-6 w-6" />
											</div>
										)}
									</div>

									<div className="min-w-0 flex-1">
										<h3 className="truncate font-mincho text-[15px] font-bold text-heading">
											{item.bar.name}
										</h3>
										<span className="mt-1 inline-flex items-center gap-1 text-xs text-subtext">
											<MapPin className="h-3 w-3 text-primary" />
											{item.bar.prefecture} {item.bar.city}
										</span>
									</div>

									<ChevronRight className="h-5 w-5 flex-shrink-0 text-subtext transition-colors group-hover:text-primary" />
								</Link>
							</li>
						))}
					</ul>
				</section>
			))}
		</div>
	);
}
