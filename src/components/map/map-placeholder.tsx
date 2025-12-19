import { MapPin } from "lucide-react";

export function MapPlaceholder() {
	return (
		<div className="bg-muted rounded-lg flex items-center justify-center h-64 md:h-80 border border-border/50">
			<div className="text-center text-muted-foreground">
				<MapPin className="w-12 h-12 mx-auto mb-2" />
				<p className="text-sm font-medium">ここにマップを表示</p>
				<p className="text-xs mt-1">Google Maps が表示されます</p>
			</div>
		</div>
	);
}
