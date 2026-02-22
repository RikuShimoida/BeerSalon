import { Instagram } from "lucide-react";
import { XIcon } from "@/components/icons/x-icon";

interface PaymentMethod {
	id: string;
	name: string;
	displayOrder: number;
}

interface OpeningHour {
	id: string;
	barId: string;
	dayOfWeek: number;
	openTime: Date;
	closeTime: Date;
	sortOrder: number;
	isClosed: boolean;
}

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
	instagramUrl: string | null;
	xUrl: string | null;
	paymentMethods: PaymentMethod[];
	openingHours: OpeningHour[];
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

const DAY_NAMES = [
	"月曜日",
	"火曜日",
	"水曜日",
	"木曜日",
	"金曜日",
	"土曜日",
	"日曜日",
];

function formatOpeningHours(openingHours: OpeningHour[]): string {
	const grouped = new Map<number, OpeningHour[]>();

	for (const hour of openingHours) {
		const existing = grouped.get(hour.dayOfWeek) || [];
		existing.push(hour);
		grouped.set(hour.dayOfWeek, existing);
	}

	const lines: string[] = [];

	for (let day = 0; day <= 6; day++) {
		const dayHours = grouped.get(day) || [];
		const dayName = DAY_NAMES[day];

		if (dayHours.length === 0) {
			lines.push(`${dayName}: -`);
		} else if (dayHours.some((h) => h.isClosed)) {
			lines.push(`${dayName}: 定休日`);
		} else {
			const timeRanges = dayHours
				.map((h) => {
					const open = formatTime(h.openTime);
					const close = formatTime(h.closeTime);

					if (open === "00:00" && close === "23:59") {
						return "24時間営業";
					}

					const openHour = new Date(h.openTime).getHours();
					const closeHour = new Date(h.closeTime).getHours();

					if (closeHour < openHour || (closeHour === 0 && close !== "00:00")) {
						return `${open}～翌${close}`;
					}

					return `${open}～${close}`;
				})
				.join("、");

			lines.push(`${dayName}: ${timeRanges}`);
		}
	}

	return lines.join("\n");
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
				<div className="md:col-span-2">
					<h3 className="text-sm font-semibold text-gray-700 mb-1">営業時間</h3>
					{bar.openingHours.length > 0 ? (
						<p className="text-gray-900 whitespace-pre-line">
							{formatOpeningHours(bar.openingHours)}
						</p>
					) : (
						<p className="text-gray-900">
							{formatTime(bar.openingTime)} - {formatTime(bar.endingTime)}
							{bar.regularHoliday && (
								<>
									<br />
									定休日: {bar.regularHoliday}
								</>
							)}
						</p>
					)}
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
						支払い方法
					</h3>
					{bar.paymentMethods.length > 0 ? (
						<p className="text-gray-900">
							{bar.paymentMethods.map((pm) => pm.name).join("、")}
						</p>
					) : (
						<p className="text-gray-900">-</p>
					)}
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

				{bar.instagramUrl && (
					<div>
						<h3 className="text-sm font-semibold text-gray-700 mb-1">
							Instagram
						</h3>
						<a
							href={bar.instagramUrl}
							target="_blank"
							rel="nofollow noopener"
							className="inline-flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors"
							aria-label="Instagramで見る"
						>
							<Instagram className="w-6 h-6" />
							<span className="text-sm">
								@{bar.instagramUrl.split("/").filter(Boolean).pop()}
							</span>
						</a>
					</div>
				)}

				{bar.xUrl && (
					<div>
						<h3 className="text-sm font-semibold text-gray-700 mb-1">
							X（Twitter）
						</h3>
						<a
							href={bar.xUrl}
							target="_blank"
							rel="nofollow noopener"
							className="inline-flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
							aria-label="Xで見る"
						>
							<XIcon className="w-6 h-6" />
							<span className="text-sm">
								@{bar.xUrl.split("/").filter(Boolean).pop()}
							</span>
						</a>
					</div>
				)}
			</section>
		</div>
	);
}
