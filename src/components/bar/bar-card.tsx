import Link from "next/link";
import { MapPin } from "lucide-react";

interface BarCardProps {
	id: string;
	name: string;
	prefecture: string;
	city: string;
	imageUrl?: string;
}

export function BarCard({ id, name, prefecture, city, imageUrl }: BarCardProps) {
	return (
		<Link
			href={`/bars/${id}`}
			className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
		>
			<div className="aspect-video bg-gray-200 relative">
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={name}
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-gray-400">
						<MapPin className="w-12 h-12" />
					</div>
				)}
			</div>

			<div className="p-4">
				<h3 className="font-bold text-lg text-gray-900 mb-2">{name}</h3>
				<p className="text-sm text-gray-600">
					{prefecture} {city}
				</p>
			</div>
		</Link>
	);
}
