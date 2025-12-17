interface BarInfo {
	name: string;
	description: string | null;
	openingTime: Date | null;
	endingTime: Date | null;
	regularHoliday: string | null;
	access: string | null;
	phoneNumber: string | null;
	prefecture: string;
	city: string;
	addressLine1: string;
	addressLine2: string | null;
	websiteUrl: string | null;
}

interface TopTabProps {
	bar: BarInfo;
}

function formatTime(date: Date | null): string {
	if (!date) return "-";
	return new Date(date).toLocaleTimeString("ja-JP", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

export function TopTab({ bar }: TopTabProps) {
	return (
		<div className="space-y-6">
			<section>
				<h2 className="text-lg font-bold text-gray-900 mb-2">PR文</h2>
				<p className="text-gray-700 whitespace-pre-wrap">
					{bar.description || "PR文はまだ登録されていません。"}
				</p>
			</section>

			<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<h3 className="text-sm font-semibold text-gray-700 mb-1">営業時間</h3>
					<p className="text-gray-900">
						{formatTime(bar.openingTime)} - {formatTime(bar.endingTime)}
					</p>
				</div>

				<div>
					<h3 className="text-sm font-semibold text-gray-700 mb-1">定休日</h3>
					<p className="text-gray-900">{bar.regularHoliday || "-"}</p>
				</div>

				<div>
					<h3 className="text-sm font-semibold text-gray-700 mb-1">
						交通手段・アクセス
					</h3>
					<p className="text-gray-900">{bar.access || "-"}</p>
				</div>

				<div>
					<h3 className="text-sm font-semibold text-gray-700 mb-1">電話番号</h3>
					{bar.phoneNumber ? (
						<a
							href={`tel:${bar.phoneNumber}`}
							className="text-blue-600 hover:underline"
						>
							{bar.phoneNumber}
						</a>
					) : (
						<p className="text-gray-900">-</p>
					)}
				</div>

				<div>
					<h3 className="text-sm font-semibold text-gray-700 mb-1">住所</h3>
					<p className="text-gray-900">
						{bar.prefecture}
						{bar.city}
						{bar.addressLine1}
						{bar.addressLine2 && ` ${bar.addressLine2}`}
					</p>
				</div>

				<div>
					<h3 className="text-sm font-semibold text-gray-700 mb-1">
						ホームページ
					</h3>
					{bar.websiteUrl ? (
						<a
							href={bar.websiteUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:underline break-all"
						>
							{bar.websiteUrl}
						</a>
					) : (
						<p className="text-gray-900">-</p>
					)}
				</div>
			</section>
		</div>
	);
}
