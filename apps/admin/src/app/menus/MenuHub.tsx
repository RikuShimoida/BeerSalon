"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Bar } from "@/types/database";

interface MenuHubProps {
	userRole: string;
}

export default function MenuHub({ userRole }: MenuHubProps) {
	const [bars, setBars] = useState<Bar[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const fetchBars = async () => {
			try {
				const response = await fetch("/api/bars");
				if (response.ok) {
					const data = await response.json();
					setBars(data);
				}
			} catch (_error) {
			} finally {
				setLoading(false);
			}
		};
		fetchBars();
	}, []);

	useEffect(() => {
		if (loading) return;
		if (userRole === "bar_owner" && bars.length === 1) {
			router.push(`/bars/${bars[0].id}/menus/beers`);
		}
	}, [loading, bars, userRole, router]);

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

	if (bars.length === 0) {
		return (
			<div className="p-6">
				<h1 className="text-2xl font-bold text-gray-900 mb-6">
					メニュー管理
				</h1>
				<div className="bg-white shadow rounded-lg p-12 text-center">
					<p className="text-gray-500">バーが登録されていません</p>
				</div>
			</div>
		);
	}

	if (userRole === "bar_owner" && bars.length === 1) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-gray-200 rounded w-1/4" />
					<div className="h-32 bg-gray-200 rounded" />
				</div>
			</div>
		);
	}

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold text-gray-900 mb-6">
				メニュー管理
			</h1>
			<p className="text-gray-600 mb-6">
				メニューを管理するバーを選択してください
			</p>
			<div className="space-y-4">
				{bars.map((bar) => (
					<div
						key={bar.id}
						className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
					>
						<div className="flex items-start justify-between">
							<div className="flex items-center space-x-4">
								{bar.preview_image_url ? (
									<img
										src={bar.preview_image_url}
										alt={bar.name}
										className="w-24 h-24 object-cover rounded-lg"
									/>
								) : (
									<div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
										<span className="text-4xl">🏪</span>
									</div>
								)}
								<div>
									<h2 className="text-xl font-semibold text-gray-900 mb-2">
										{bar.name}
									</h2>
									{(bar.prefecture || bar.city) && (
										<p className="text-sm text-gray-600">
											📍 {bar.prefecture} {bar.city}
										</p>
									)}
								</div>
							</div>
							<div className="flex items-start space-x-2 ml-4">
								<button
									onClick={() =>
										router.push(`/bars/${bar.id}/menus/beers`)
									}
									className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								>
									ビールメニュー管理
								</button>
								<button
									onClick={() =>
										router.push(`/bars/${bar.id}/menus/foods`)
									}
									className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								>
									フードメニュー管理
								</button>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
