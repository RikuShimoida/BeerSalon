interface Activity {
	id: string;
	type: string;
	title: string;
	date: string;
}

interface ActivityTimelineProps {
	activities: Activity[];
	loading?: boolean;
}

export default function ActivityTimeline({
	activities,
	loading = false,
}: ActivityTimelineProps) {
	if (loading) {
		return (
			<div className="bg-white shadow rounded-lg p-6">
				<h2 className="text-lg font-medium text-gray-900 mb-4">最近の活動</h2>
				<div className="space-y-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="animate-pulse flex space-x-4">
							<div className="flex-1 space-y-2">
								<div className="h-4 bg-gray-200 rounded w-3/4"></div>
								<div className="h-3 bg-gray-200 rounded w-1/4"></div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	const getIcon = (type: string) => {
		switch (type) {
			case "article":
				return "📝";
			case "coupon":
				return "🎫";
			case "menu":
				return "🍺";
			case "bar":
				return "🏪";
			default:
				return "📌";
		}
	};

	return (
		<div className="bg-white shadow rounded-lg p-6">
			<h2 className="text-lg font-medium text-gray-900 mb-4">最近の活動</h2>

			{activities.length === 0 ? (
				<p className="text-gray-500 text-sm">活動履歴がありません</p>
			) : (
				<div className="flow-root">
					<ul className="-mb-8">
						{activities.map((activity, activityIdx) => (
							<li key={activity.id}>
								<div className="relative pb-8">
									{activityIdx !== activities.length - 1 && (
										<span
											className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
											aria-hidden="true"
										/>
									)}
									<div className="relative flex items-start space-x-3">
										<div className="relative">
											<div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
												<span className="text-xl">
													{getIcon(activity.type)}
												</span>
											</div>
										</div>
										<div className="min-w-0 flex-1">
											<div>
												<p className="text-sm text-gray-900">
													{activity.title}
												</p>
												<p className="mt-0.5 text-sm text-gray-500">
													{activity.date}
												</p>
											</div>
										</div>
									</div>
								</div>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
