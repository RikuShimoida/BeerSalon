import {
	Clock,
	Instagram,
	MapPin,
	Navigation,
	Phone,
	Wallet,
} from "lucide-react";
import { FacebookIcon } from "@/components/icons/facebook-icon";
import { LineIcon } from "@/components/icons/line-icon";
import { XIcon } from "@/components/icons/x-icon";
import {
	buildDirectionsUrls,
	hasDirectionsTarget,
} from "@/lib/map/directions-url";

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
	latitude: string | null | undefined;
	longitude: string | null | undefined;
	websiteUrl: string | null;
	instagramUrl: string | null;
	xUrl: string | null;
	facebookUrl: string | null;
	lineUrl: string | null;
	paymentMethods: PaymentMethod[];
	openingHours: OpeningHour[];
}

interface TopTabProps {
	bar: BarInfo;
}

function formatTime(date: Date | null): string {
	if (!date) return "-";
	const d = new Date(date);
	const hours = d.getUTCHours();
	const minutes = d.getUTCMinutes();
	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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
		<div className="space-y-6 md:grid md:grid-cols-[1fr_300px] md:items-start md:gap-8 md:space-y-0">
			<div className="space-y-6">
				<section>
					<h2 className="mb-3 font-archivo text-xs uppercase tracking-[0.22em] text-primary">
						About
					</h2>
					<p className="whitespace-pre-wrap font-mincho text-lg leading-relaxed text-heading">
						{bar.description || "PR文はまだ登録されていません。"}
					</p>
				</section>
			</div>

			<div className="space-y-6">
				<section className="rounded-2xl border border-border bg-surface-raised p-5">
					<h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-heading">
						<Clock className="h-4 w-4 text-primary" />
						営業時間
					</h3>
					{bar.openingHours.length > 0 ? (
						<p className="whitespace-pre-line text-sm leading-relaxed text-subtext">
							{formatOpeningHours(bar.openingHours)}
						</p>
					) : (
						<p className="text-sm text-subtext">
							{formatTime(bar.openingTime)} - {formatTime(bar.endingTime)}
						</p>
					)}
					{bar.regularHoliday && (
						<p className="mt-2 whitespace-pre-line text-sm text-subtext">
							定休日: {bar.regularHoliday}
						</p>
					)}
				</section>

				<section className="divide-y divide-border rounded-2xl border border-border bg-surface-raised">
					<div className="flex gap-3 p-5">
						<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
						<div>
							<h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-subtext">
								住所
							</h3>
							<p className="text-sm text-heading">
								{bar.prefecture}
								{bar.city}
								{bar.addressLine1}
								{bar.addressLine2 && ` ${bar.addressLine2}`}
							</p>
							{hasDirectionsTarget(bar) &&
								(() => {
									const directions = buildDirectionsUrls(bar);
									return (
										<div className="mt-3 flex flex-wrap gap-2">
											<a
												href={directions.apple}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-surface-raised px-3 py-1.5 text-xs text-heading transition-colors hover:border-primary/60 hover:text-primary"
											>
												<Navigation className="h-3.5 w-3.5" />
												マップで開く
											</a>
											<a
												href={directions.google}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-surface-raised px-3 py-1.5 text-xs text-heading transition-colors hover:border-primary/60 hover:text-primary"
											>
												<Navigation className="h-3.5 w-3.5" />
												Googleマップで開く
											</a>
										</div>
									);
								})()}
						</div>
					</div>

					<div className="flex gap-3 p-5">
						<Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
						<div>
							<h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-subtext">
								電話番号
							</h3>
							{bar.phoneNumber ? (
								<a
									href={`tel:${bar.phoneNumber}`}
									className="text-sm text-primary hover:underline"
								>
									{bar.phoneNumber}
								</a>
							) : (
								<p className="text-sm text-heading">-</p>
							)}
						</div>
					</div>

					<div className="flex gap-3 p-5">
						<Wallet className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
						<div>
							<h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-subtext">
								支払い方法
							</h3>
							<p className="text-sm text-heading">
								{bar.paymentMethods.length > 0
									? bar.paymentMethods.map((pm) => pm.name).join("、")
									: "-"}
							</p>
						</div>
					</div>

					{bar.access && (
						<div className="flex gap-3 p-5">
							<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
							<div>
								<h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-subtext">
									交通手段・アクセス
								</h3>
								<p className="whitespace-pre-line text-sm text-heading">
									{bar.access}
								</p>
							</div>
						</div>
					)}
				</section>

				{(bar.websiteUrl ||
					bar.instagramUrl ||
					bar.xUrl ||
					bar.facebookUrl ||
					bar.lineUrl) && (
					<section>
						<h3 className="mb-3 text-sm font-semibold text-heading">
							ウェブ・SNS
						</h3>
						<div className="flex flex-wrap items-center gap-3">
							{bar.websiteUrl && (
								<a
									href={bar.websiteUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-surface-raised px-4 py-2 text-sm text-heading transition-colors hover:border-primary/60 hover:text-primary"
								>
									ホームページ
								</a>
							)}
							{bar.instagramUrl && (
								<a
									href={bar.instagramUrl}
									target="_blank"
									rel="nofollow noopener"
									className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-surface-raised text-heading transition-colors hover:border-primary/60 hover:text-primary"
									aria-label="Instagramで見る"
								>
									<Instagram className="h-5 w-5" />
								</a>
							)}
							{bar.xUrl && (
								<a
									href={bar.xUrl}
									target="_blank"
									rel="nofollow noopener"
									className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-surface-raised text-heading transition-colors hover:border-primary/60 hover:text-primary"
									aria-label="Xで見る"
								>
									<XIcon className="h-5 w-5" />
								</a>
							)}
							{bar.facebookUrl && (
								<a
									href={bar.facebookUrl}
									target="_blank"
									rel="nofollow noopener"
									className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-surface-raised text-heading transition-colors hover:border-primary/60 hover:text-primary"
									aria-label="Facebookで見る"
								>
									<FacebookIcon className="h-5 w-5" />
								</a>
							)}
							{bar.lineUrl && (
								<a
									href={bar.lineUrl}
									target="_blank"
									rel="nofollow noopener"
									className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-surface-raised text-heading transition-colors hover:border-primary/60 hover:text-primary"
									aria-label="LINEで見る"
								>
									<LineIcon className="h-5 w-5" />
								</a>
							)}
						</div>
					</section>
				)}
			</div>
		</div>
	);
}
