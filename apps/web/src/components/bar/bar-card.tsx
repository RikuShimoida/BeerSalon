import { Beer, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface BarCardProps {
	id: string;
	name: string;
	prefecture: string;
	city: string;
	imageUrl?: string;
}

export function BarCard({
	id,
	name,
	prefecture,
	city,
	imageUrl,
}: BarCardProps) {
	return (
		<Link
			href={`/bars/${id}`}
			className="group block overflow-hidden rounded-2xl border border-border bg-card modern-shadow transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30"
		>
			<div className="relative aspect-[4/3] overflow-hidden bg-surface-raised">
				{imageUrl ? (
					<Image
						src={imageUrl}
						alt={name}
						fill
						className="object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-raised to-surface-deep text-primary/40">
						<Beer className="h-14 w-14" />
					</div>
				)}
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-deep/40 to-transparent" />
			</div>

			<div className="p-4">
				<h3 className="mb-2 font-mincho text-[15px] font-bold text-heading">
					{name}
				</h3>
				<span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-subtext">
					<MapPin className="h-3 w-3 text-primary" />
					{prefecture} {city}
				</span>
			</div>
		</Link>
	);
}
