import { MapPin } from "lucide-react";
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
			className="block glass-card rounded-2xl modern-shadow hover-lift overflow-hidden group"
		>
			<div className="aspect-video bg-muted relative overflow-hidden">
				{imageUrl ? (
					<Image
						src={imageUrl}
						alt={name}
						fill
						className="object-cover group-hover:scale-110 transition-transform duration-500"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-muted/50">
						<MapPin className="w-12 h-12" />
					</div>
				)}
			</div>

			<div className="p-6">
				<h3 className="font-semibold text-lg text-card-foreground mb-2 group-hover:text-primary transition-colors duration-300 tracking-tight">
					{name}
				</h3>
				<p className="text-sm text-muted-foreground tracking-wide">
					{prefecture} {city}
				</p>
			</div>
		</Link>
	);
}
