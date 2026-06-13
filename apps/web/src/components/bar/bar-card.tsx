import { Beer } from "lucide-react";
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
			className="block bg-card rounded-2xl border border-border hover:border-secondary hover:bg-accent/5 transition-all duration-200 overflow-hidden group shadow-sm hover:shadow-md"
		>
			<div className="aspect-video bg-muted relative overflow-hidden">
				{imageUrl ? (
					<Image
						src={imageUrl}
						alt={name}
						fill
						className="object-cover group-hover:scale-105 transition-transform duration-300"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
						<Beer className="w-16 h-16" />
					</div>
				)}
			</div>

			<div className="p-4">
				<h3 className="font-bold text-base text-card-foreground mb-1.5">
					{name}
				</h3>
				<p className="text-sm text-muted-foreground">
					{prefecture} {city}
				</p>
			</div>
		</Link>
	);
}
