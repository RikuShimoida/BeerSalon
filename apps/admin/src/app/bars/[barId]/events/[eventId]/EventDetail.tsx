"use client";

import { formatDateTimeLongJst } from "@beersalon/shared";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { BarEvent } from "@/types/database";

interface EventDetailProps {
	barId: string;
	eventId: string;
	userRole: "bar_owner" | "admin";
}

export default function EventDetail({
	barId,
	eventId,
	userRole,
}: EventDetailProps) {
	const router = useRouter();
	const [event, setEvent] = useState<BarEvent | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const isBarOwner = userRole === "bar_owner";

	const fetchEvent = useCallback(async () => {
		try {
			const res = await fetch(`/api/bars/${barId}/events/${eventId}`);
			if (!res.ok) {
				if (res.status === 404) {
					setError("イベントが見つかりません");
				} else {
					setError("イベントの取得に失敗しました");
				}
				return;
			}
			const data = await res.json();
			setEvent(data.event);
		} catch (_error) {
			setError("イベントの取得に失敗しました");
		} finally {
			setLoading(false);
		}
	}, [barId, eventId]);

	useEffect(() => {
		fetchEvent();
	}, [fetchEvent]);

	const handleDelete = async () => {
		if (!confirm("このイベントを削除してもよろしいですか？")) return;

		try {
			const res = await fetch(`/api/bars/${barId}/events/${eventId}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				alert("削除に失敗しました");
				return;
			}
			router.push(`/bars/${barId}/events`);
		} catch (_error) {
			alert("削除に失敗しました");
		}
	};

	if (loading) {
		return (
			<div className="animate-pulse space-y-4">
				<div className="h-8 bg-gray-200 rounded w-1/3" />
				<div className="h-64 bg-gray-200 rounded" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-md bg-red-50 p-4">
				<p className="text-sm text-red-800">{error}</p>
			</div>
		);
	}

	if (!event) return null;

	return (
		<div className="space-y-6 max-w-2xl">
			<div className="flex items-center gap-2">
				<Link
					href={`/bars/${barId}/events`}
					className="text-sm text-gray-500 hover:text-black transition-colors"
				>
					イベント管理
				</Link>
				<span className="text-sm text-gray-400">/</span>
				<span className="text-sm text-gray-700">イベント詳細</span>
			</div>

			<h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>

			{event.image_url && (
				<div className="relative w-full h-64 md:h-80">
					<Image
						src={event.image_url}
						alt={event.title}
						fill
						className="object-cover rounded-lg border border-gray-200"
					/>
				</div>
			)}

			<div className="border border-gray-200 rounded-lg p-6 space-y-4">
				<div>
					<h3 className="text-sm font-medium text-gray-500 mb-1">開始日時</h3>
					<p className="text-sm text-gray-900">
						{formatDateTimeLongJst(event.start_date)}
					</p>
				</div>

				{event.end_date && (
					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-1">終了日時</h3>
						<p className="text-sm text-gray-900">
							{formatDateTimeLongJst(event.end_date)}
						</p>
					</div>
				)}

				{event.description && (
					<div>
						<h3 className="text-sm font-medium text-gray-500 mb-1">説明</h3>
						<p className="text-sm text-gray-900 whitespace-pre-wrap">
							{event.description}
						</p>
					</div>
				)}
			</div>

			{isBarOwner && (
				<div className="flex gap-3 pt-4 border-t border-gray-200">
					<Link
						href={`/bars/${barId}/events/${eventId}/edit`}
						className="flex-1 text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
					>
						編集
					</Link>
					<button
						type="button"
						onClick={handleDelete}
						className="flex-1 px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 transition-colors"
					>
						削除
					</button>
				</div>
			)}
		</div>
	);
}
