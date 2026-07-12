"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Bar, BarImage, BarOpeningHour } from "@/types/database";

function PaymentManagementCard({ barId }: { barId: string }) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleClick = async () => {
		setLoading(true);
		setError("");

		try {
			const response = await fetch(`/api/bars/${barId}/portal`, {
				method: "POST",
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "エラーが発生しました");
				return;
			}

			window.location.href = data.url;
		} catch (_e) {
			setError("通信エラーが発生しました");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="border border-gray-200 rounded-lg p-4">
			<button
				type="button"
				onClick={handleClick}
				disabled={loading}
				className="w-full text-left hover:opacity-80 transition-opacity disabled:opacity-50"
			>
				<h3 className="font-medium text-gray-900">支払い方法管理</h3>
				<p className="text-sm text-gray-500 mt-1">
					{loading
						? "Stripe Customer Portalを開いています..."
						: "Stripe Customer Portal（外部サイト）"}
				</p>
			</button>
			{error && <p className="text-sm text-red-600 mt-2">{error}</p>}
		</div>
	);
}

function DeleteBarModal({
	barName,
	onCancel,
	onConfirm,
	deleting,
	error,
}: {
	barName: string;
	onCancel: () => void;
	onConfirm: () => void;
	deleting: boolean;
	error: string;
}) {
	const [confirmName, setConfirmName] = useState("");
	const nameMatches = confirmName === barName;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
				<h2 className="text-lg font-bold text-gray-900">店舗を削除</h2>
				<p className="mt-2 text-sm text-gray-600">
					この操作は店舗をユーザー画面・管理画面から非表示にします。運用中の店舗の場合、オーナーに影響します。
				</p>
				<label
					htmlFor="delete-bar-confirm"
					className="mt-4 block text-sm text-gray-700"
				>
					削除するには店舗名「{barName}」を入力してください
				</label>
				<input
					id="delete-bar-confirm"
					type="text"
					value={confirmName}
					onChange={(e) => setConfirmName(e.target.value)}
					disabled={deleting}
					className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none disabled:opacity-50"
				/>
				{error && <p className="mt-2 text-sm text-red-600">{error}</p>}
				<div className="mt-6 flex justify-end gap-3">
					<button
						type="button"
						onClick={onCancel}
						disabled={deleting}
						className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
					>
						キャンセル
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={!nameMatches || deleting}
						className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600"
					>
						{deleting ? "削除中..." : "削除する"}
					</button>
				</div>
			</div>
		</div>
	);
}

interface BarDetailProps {
	barId: string;
	userRole: "bar_owner" | "admin";
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

function formatOpeningHours(hours: BarOpeningHour[]): string[] {
	const lines: string[] = [];

	for (let day = 0; day < 7; day++) {
		const dayHours = hours
			.filter((h) => h.day_of_week === day)
			.sort((a, b) => a.sort_order - b.sort_order);

		if (dayHours.length === 0) {
			lines.push(`${DAY_NAMES[day]}: 未設定`);
			continue;
		}

		if (dayHours[0].is_closed) {
			lines.push(`${DAY_NAMES[day]}: 定休日`);
			continue;
		}

		const timeSlots = dayHours
			.filter((h) => !h.is_closed && h.open_time && h.close_time)
			.map(
				(h) => `${h.open_time.substring(0, 5)}~${h.close_time.substring(0, 5)}`,
			);

		if (timeSlots.length === 0) {
			lines.push(`${DAY_NAMES[day]}: 未設定`);
		} else {
			lines.push(`${DAY_NAMES[day]}: ${timeSlots.join(", ")}`);
		}
	}

	return lines;
}

export default function BarDetail({ barId, userRole }: BarDetailProps) {
	const router = useRouter();
	const [bar, setBar] = useState<Bar | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [currentSlide, setCurrentSlide] = useState(0);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);

	const handleDelete = useCallback(async () => {
		setDeleting(true);
		setDeleteError("");

		try {
			const response = await fetch(`/api/bars/${barId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				setDeleteError(data.error || "店舗の削除に失敗しました");
				return;
			}

			router.push("/bars");
		} catch (_error) {
			setDeleteError("店舗の削除に失敗しました");
		} finally {
			setDeleting(false);
		}
	}, [barId, router]);

	const handleScroll = useCallback(() => {
		if (!scrollRef.current) return;
		const container = scrollRef.current;
		const slideWidth = container.offsetWidth;
		if (slideWidth === 0) return;
		const index = Math.round(container.scrollLeft / slideWidth);
		setCurrentSlide(index);
	}, []);

	const scrollToSlide = useCallback((direction: "prev" | "next") => {
		if (!scrollRef.current) return;
		const container = scrollRef.current;
		const slideWidth = container.offsetWidth;
		container.scrollBy({
			left: direction === "next" ? slideWidth : -slideWidth,
			behavior: "smooth",
		});
	}, []);

	const fetchBar = useCallback(async () => {
		try {
			const response = await fetch(`/api/bars/${barId}`);

			if (!response.ok) {
				if (response.status === 403) {
					setError("アクセス権限がありません");
				} else if (response.status === 404) {
					setError("店舗が見つかりません");
				} else {
					setError("店舗情報の取得に失敗しました");
				}
				return;
			}

			const data = await response.json();
			setBar(data);
		} catch (_error) {
			setError("店舗情報の取得に失敗しました");
		} finally {
			setLoading(false);
		}
	}, [barId]);

	useEffect(() => {
		fetchBar();
	}, [fetchBar]);

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-gray-200 rounded w-1/3" />
					<div className="h-48 bg-gray-200 rounded" />
					<div className="h-32 bg-gray-200 rounded" />
				</div>
			</div>
		);
	}

	if (error || !bar) {
		return (
			<div className="p-6">
				<div className="rounded-md bg-red-50 border border-red-200 p-4">
					<p className="text-sm text-red-800">
						{error || "店舗が見つかりません"}
					</p>
				</div>
			</div>
		);
	}

	const openingHoursLines = bar.opening_hours
		? formatOpeningHours(bar.opening_hours)
		: [];

	const address = [
		bar.prefecture,
		bar.city,
		bar.address_line1,
		bar.address_line2,
	]
		.filter(Boolean)
		.join(" ");

	const manageMenuItems = [
		{
			label: "メニュー管理",
			href: `/bars/${barId}/menus`,
			description: "ビール・食事メニューの管理",
		},
		{
			label: "記事管理",
			href: `/bars/${barId}/articles`,
			description: "お店からの投稿の管理",
		},
		{
			label: "クーポン管理",
			href: `/bars/${barId}/coupons`,
			description: "クーポンの作成・管理",
		},
		{
			label: "イベント管理",
			href: `/bars/${barId}/events`,
			description: "イベントの作成・管理",
		},
	];

	return (
		<div className="p-6 max-w-3xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold text-gray-900">{bar.name}</h1>
				<div className="flex items-center gap-2">
					<Link
						href={`/bars/${barId}/edit`}
						className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800"
					>
						編集
					</Link>
					{userRole === "admin" && (
						<button
							type="button"
							onClick={() => {
								setDeleteError("");
								setShowDeleteModal(true);
							}}
							className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
						>
							店舗を削除
						</button>
					)}
				</div>
			</div>

			{showDeleteModal && (
				<DeleteBarModal
					barName={bar.name}
					deleting={deleting}
					error={deleteError}
					onCancel={() => setShowDeleteModal(false)}
					onConfirm={handleDelete}
				/>
			)}

			{/* Store info card */}
			<section className="border border-gray-200 rounded-lg p-6 mb-8 space-y-4">
				{bar.bar_images && bar.bar_images.length > 0 ? (
					<div className="mb-4">
						<div className="relative">
							<div
								ref={scrollRef}
								onScroll={handleScroll}
								className="flex overflow-x-auto snap-x snap-mandatory"
								style={{
									scrollbarWidth: "none",
									msOverflowStyle: "none",
								}}
							>
								{bar.bar_images.map((img: BarImage, index: number) => (
									<div
										key={img.id}
										className="flex-shrink-0 w-full snap-center relative h-64"
									>
										{img.media_type === "image" ? (
											<Image
												src={img.image_url}
												alt={`${bar.name} 画像 ${index + 1}`}
												fill
												className="object-cover rounded-lg"
											/>
										) : (
											<>
												{/* biome-ignore lint/a11y/useMediaCaption: 店舗スライダーのプレビュー用動画 */}
												<video
													src={img.image_url}
													className="w-full h-full object-cover rounded-lg"
													controls
												/>
											</>
										)}
									</div>
								))}
							</div>
							{bar.bar_images.length > 1 && (
								<>
									<button
										type="button"
										onClick={() => scrollToSlide("prev")}
										disabled={currentSlide === 0}
										className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center ${
											currentSlide === 0
												? "bg-black/20 text-white/50 cursor-not-allowed"
												: "bg-black/50 text-white hover:bg-black/70"
										}`}
									>
										&lt;
									</button>
									<button
										type="button"
										onClick={() => scrollToSlide("next")}
										disabled={
											currentSlide === (bar.bar_images?.length ?? 1) - 1
										}
										className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center ${
											currentSlide === (bar.bar_images?.length ?? 1) - 1
												? "bg-black/20 text-white/50 cursor-not-allowed"
												: "bg-black/50 text-white hover:bg-black/70"
										}`}
									>
										&gt;
									</button>
								</>
							)}
						</div>
						{bar.bar_images.length > 1 && (
							<div className="flex justify-center gap-1.5 mt-2">
								{bar.bar_images.map((img: BarImage, index: number) => (
									<div
										key={img.id}
										className={`w-2 h-2 rounded-full ${
											index === currentSlide ? "bg-gray-900" : "bg-gray-300"
										}`}
									/>
								))}
							</div>
						)}
					</div>
				) : bar.preview_image_url ? (
					<div className="mb-4 relative w-full h-64">
						<Image
							src={bar.preview_image_url}
							alt={bar.name}
							fill
							className="object-cover rounded-lg"
						/>
					</div>
				) : null}

				{bar.description && (
					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-1">説明</h3>
						<p className="text-gray-900 whitespace-pre-wrap">
							{bar.description}
						</p>
					</div>
				)}

				{openingHoursLines.length > 0 && (
					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-1">営業時間</h3>
						<div className="space-y-0.5">
							{openingHoursLines.map((line) => (
								<p key={line} className="text-sm text-gray-900">
									{line}
								</p>
							))}
						</div>
					</div>
				)}

				{bar.access && (
					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-1">アクセス</h3>
						<p className="text-gray-900">{bar.access}</p>
					</div>
				)}

				{bar.phone_number && (
					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-1">電話番号</h3>
						<a
							href={`tel:${bar.phone_number}`}
							className="text-gray-900 underline"
						>
							{bar.phone_number}
						</a>
					</div>
				)}

				{address && (
					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-1">住所</h3>
						<p className="text-gray-900">{address}</p>
					</div>
				)}

				{bar.website_url && (
					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-1">
							ホームページ
						</h3>
						<a
							href={bar.website_url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-gray-900 underline break-all"
						>
							{bar.website_url}
						</a>
					</div>
				)}

				{bar.instagram_url && (
					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-1">
							Instagram
						</h3>
						<a
							href={bar.instagram_url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-gray-900 underline break-all"
						>
							{bar.instagram_url}
						</a>
					</div>
				)}

				{bar.x_url && (
					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-1">X</h3>
						<a
							href={bar.x_url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-gray-900 underline break-all"
						>
							{bar.x_url}
						</a>
					</div>
				)}

				{bar.facebook_url && (
					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-1">Facebook</h3>
						<a
							href={bar.facebook_url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-gray-900 underline break-all"
						>
							{bar.facebook_url}
						</a>
					</div>
				)}

				{bar.line_url && (
					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-1">LINE</h3>
						<a
							href={bar.line_url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-gray-900 underline break-all"
						>
							{bar.line_url}
						</a>
					</div>
				)}
			</section>

			{/* Management menu */}
			<section>
				<h2 className="text-lg font-bold text-gray-900 mb-4">管理メニュー</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{manageMenuItems.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className="block border border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-colors"
						>
							<h3 className="font-medium text-gray-900">{item.label}</h3>
							<p className="text-sm text-gray-500 mt-1">{item.description}</p>
							{userRole === "admin" && (
								<span className="inline-block mt-2 text-xs text-gray-400">
									参照のみ
								</span>
							)}
						</Link>
					))}
					<PaymentManagementCard barId={barId} />
				</div>
			</section>
		</div>
	);
}
