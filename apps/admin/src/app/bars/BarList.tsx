"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Bar } from "@/types/database";

type PendingBar = {
	bar_id: number;
	bar_manage_id: string;
	contact_email: string | null;
	contact_phone: string | null;
	created_at: string;
};

export default function BarList() {
	const [bars, setBars] = useState<Bar[]>([]);
	const [pendingBars, setPendingBars] = useState<PendingBar[]>([]);
	const [loading, setLoading] = useState(true);
	const [approvingId, setApprovingId] = useState<number | null>(null);
	const router = useRouter();

	const fetchBars = useCallback(async () => {
		try {
			const [barsRes, pendingRes] = await Promise.all([
				fetch("/api/bars"),
				fetch("/api/bars/pending"),
			]);
			if (barsRes.ok) {
				setBars(await barsRes.json());
			}
			if (pendingRes.ok) {
				setPendingBars(await pendingRes.json());
			}
		} catch (_error) {
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchBars();
	}, [fetchBars]);

	const handleApprove = async (barId: number) => {
		setApprovingId(barId);
		try {
			const response = await fetch(`/api/bars/${barId}/approve`, {
				method: "POST",
			});
			if (response.ok) {
				await fetchBars();
			}
		} catch (_error) {
		} finally {
			setApprovingId(null);
		}
	};

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-gray-200 rounded w-1/4" />
					<div className="h-32 bg-gray-200 rounded" />
					<div className="h-32 bg-gray-200 rounded" />
				</div>
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold text-gray-900">店舗管理</h1>
				<button
					type="button"
					onClick={() => router.push("/bars/new")}
					className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
				>
					店舗を登録する
				</button>
			</div>

			{pendingBars.length > 0 && (
				<div className="mb-8">
					<h2 className="text-lg font-bold text-gray-900 mb-3">
						審査中の店舗（{pendingBars.length}）
					</h2>
					<div className="space-y-3">
						{pendingBars.map((pending) => (
							<div
								key={pending.bar_id}
								className="border border-amber-200 bg-amber-50 rounded-lg p-4 flex items-center justify-between gap-4"
							>
								<div className="min-w-0">
									<p className="text-base font-bold text-gray-900 truncate">
										{pending.bar_manage_id}
									</p>
									<p className="text-sm text-gray-600 truncate">
										{pending.contact_email ?? "-"} /{" "}
										{pending.contact_phone ?? "-"}
									</p>
								</div>
								<button
									type="button"
									onClick={() => handleApprove(pending.bar_id)}
									disabled={approvingId === pending.bar_id}
									className="shrink-0 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{approvingId === pending.bar_id ? "承認中..." : "承認する"}
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{bars.length === 0 ? (
				<div className="border border-gray-200 rounded-lg p-12 text-center">
					<p className="text-gray-500 mb-4">登録されている店舗がありません</p>
					<button
						type="button"
						onClick={() => router.push("/bars/new")}
						className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
					>
						最初の店舗を登録する
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{bars.map((bar) => (
						<Link
							key={bar.id}
							href={`/bars/${bar.id}`}
							className="block border border-gray-200 rounded-lg overflow-hidden hover:border-gray-400 transition-colors"
						>
							{bar.preview_image_url ? (
								<div className="aspect-video bg-gray-100 relative">
									<Image
										src={bar.preview_image_url}
										alt={bar.name}
										fill
										className="object-cover"
									/>
								</div>
							) : (
								<div className="aspect-video bg-gray-100 flex items-center justify-center">
									<span className="text-gray-400 text-sm">No Image</span>
								</div>
							)}
							<div className="p-4">
								<h2 className="text-base font-bold text-gray-900">
									{bar.name}
								</h2>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
