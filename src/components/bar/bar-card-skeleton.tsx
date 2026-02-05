export function BarCardSkeleton() {
	return (
		<div className="block bg-card rounded-2xl border border-border overflow-hidden">
			<div className="aspect-video bg-muted animate-pulse" />

			<div className="p-4 space-y-2">
				<div className="h-5 bg-muted rounded animate-pulse w-3/4" />
				<div className="h-4 bg-muted rounded animate-pulse w-1/2" />
			</div>
		</div>
	);
}
