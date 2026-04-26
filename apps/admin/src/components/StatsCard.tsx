interface StatsCardProps {
	icon: string;
	title: string;
	value: string | number;
	loading?: boolean;
}

export default function StatsCard({
	icon,
	title,
	value,
	loading = false,
}: StatsCardProps) {
	return (
		<div className="bg-white overflow-hidden shadow rounded-lg">
			<div className="p-5">
				<div className="flex items-center">
					<div className="flex-shrink-0">
						<div className="text-3xl">{icon}</div>
					</div>
					<div className="ml-5 w-0 flex-1">
						<dl>
							<dt className="text-sm font-medium text-gray-500 truncate">
								{title}
							</dt>
							<dd className="text-3xl font-semibold text-gray-900">
								{loading ? (
									<div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
								) : (
									value
								)}
							</dd>
						</dl>
					</div>
				</div>
			</div>
		</div>
	);
}
