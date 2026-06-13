"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { BarEvent } from "@/types/database";

interface EventListProps {
	barId: string;
	userRole: "bar_owner" | "admin";
}

export default function EventList({ barId, userRole }: EventListProps) {
	const [events, setEvents] = useState<BarEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const isBarOwner = userRole === "bar_owner";

	const fetchEvents = useCallback(async () => {
		try {
			const res = await fetch(`/api/bars/${barId}/events`);
			if (!res.ok) {
				setError("イベントの取得に失敗しました");
				return;
			}
			const data = await res.json();
			setEvents(data.events || []);
		} catch (_error) {
			setError("イベントの取得に失敗しました");
		} finally {
			setLoading(false);
		}
	}, [barId]);

	useEffect(() => {
		fetchEvents();
	}, [fetchEvents]);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("ja-JP", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (loading) {
		return (
			<div className="animate-pulse space-y-6">
				<div className="h-8 bg-gray-200 rounded w-1/4" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-48 bg-gray-200 rounded" />
					))}
				</div>
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

	return (
		<div className="space-y-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="text-2xl font-bold text-gray-900">イベント管理</h1>
				{isBarOwner && (
					<Link
						href={`/bars/${barId}/events/new`}
						className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
					>
						イベントを追加する
					</Link>
				)}
			</div>

			{events.length === 0 ? (
				<div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
					<p className="text-sm text-gray-500">
						イベントがまだ登録されていません
					</p>
					{isBarOwner && (
						<Link
							href={`/bars/${barId}/events/new`}
							className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
						>
							イベントを追加する
						</Link>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{events.map((event) => (
						<Link
							key={event.id}
							href={`/bars/${barId}/events/${event.id}`}
							className="block border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
						>
							{event.image_url ? (
								<div className="relative w-full h-40">
									<Image
										src={event.image_url}
										alt={event.title}
										fill
										className="object-cover"
									/>
								</div>
							) : (
								<div className="w-full h-40 bg-gray-100 flex items-center justify-center">
									<span className="text-gray-400 text-sm">画像なし</span>
								</div>
							)}
							<div className="p-4">
								<h3 className="font-bold text-gray-900 truncate">
									{event.title}
								</h3>
								<p className="text-sm text-gray-600 mt-1">
									{formatDate(event.start_date)}
								</p>
								{event.end_date && (
									<p className="text-xs text-gray-500">
										〜 {formatDate(event.end_date)}
									</p>
								)}
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
