import Image from "next/image";

interface BarEvent {
	id: string;
	title: string;
	description: string | null;
	startDate: Date;
	endDate: Date | null;
	imageUrl: string | null;
}

interface EventsTabProps {
	events: BarEvent[];
}

function formatEventDateTime(date: Date): string {
	return new Date(date).toLocaleString("ja-JP", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function EventsTab({ events }: EventsTabProps) {
	if (events.length === 0) {
		return (
			<div className="text-center py-8">
				<p className="text-gray-500">イベントはまだ登録されていません。</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{events.map((event) => (
				<div
					key={event.id}
					className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
				>
					{event.imageUrl && (
						<div className="relative w-full h-48">
							<Image
								src={event.imageUrl}
								alt={event.title}
								fill
								className="object-cover"
							/>
						</div>
					)}
					<div className="p-4">
						<h3 className="font-bold text-lg text-gray-900 mb-2">
							{event.title}
						</h3>
						{event.description && (
							<p className="text-gray-700 mb-3">{event.description}</p>
						)}
						<div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
							<p>開始: {formatEventDateTime(event.startDate)}</p>
							{event.endDate && (
								<p>終了: {formatEventDateTime(event.endDate)}</p>
							)}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
