export function BarCardSkeleton() {
	return (
		<div className="block overflow-hidden rounded-2xl border border-border bg-card">
			<div className="aspect-[4/3] animate-pulse bg-surface-raised" />

			<div className="space-y-2 p-4">
				<div className="h-5 w-3/4 animate-pulse rounded bg-surface-raised" />
				<div className="h-6 w-1/2 animate-pulse rounded-full bg-surface-raised" />
			</div>
		</div>
	);
}
