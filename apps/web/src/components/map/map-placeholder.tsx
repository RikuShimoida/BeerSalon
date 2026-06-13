import { MapPin } from "lucide-react";

export function MapPlaceholder() {
	return (
		<div className="glass-card rounded-2xl flex items-center justify-center h-64 md:h-80 modern-shadow overflow-hidden">
			<div className="text-center text-muted-foreground">
				<MapPin className="w-12 h-12 mx-auto mb-2 opacity-60" />
				<p className="text-sm font-medium tracking-wide">ここにマップを表示</p>
				<p className="text-xs mt-1 tracking-wide">Google Maps が表示されます</p>
			</div>
		</div>
	);
}
