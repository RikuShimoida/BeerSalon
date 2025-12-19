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
			className="block bg-card rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden group"
		>
			<div className="aspect-video bg-muted relative">
				{imageUrl ? (
					<Image src={imageUrl} alt={name} fill className="object-cover" />
				) : (
					<div className="w-full h-full flex items-center justify-center text-muted-foreground">
						<MapPin className="w-12 h-12" />
					</div>
				)}
			</div>

			<div className="p-5">
				<h3 className="font-semibold text-lg text-card-foreground mb-2 group-hover:text-primary transition-colors">
					{name}
				</h3>
				<p className="text-sm text-muted-foreground">
					{prefecture} {city}
				</p>
			</div>
		</Link>
	);
}
