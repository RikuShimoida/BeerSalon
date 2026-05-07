"use client";

import { useEffect, useState } from "react";
import BarForm from "@/components/BarForm";
import type { Bar } from "@/types/database";

export default function BarEditForm({ barId }: { barId: string }) {
	const [bar, setBar] = useState<Bar | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		fetchBar();
	}, [barId]);

	const fetchBar = async () => {
		try {
			const response = await fetch(`/api/bars/${barId}`);

			if (!response.ok) {
				if (response.status === 403) {
					setError("アクセス権限がありません");
				} else if (response.status === 404) {
					setError("バーが見つかりません");
				} else {
					setError("バー情報の取得に失敗しました");
				}
				return;
			}

			const data = await response.json();
			setBar(data);
		} catch (error) {
			setError("バー情報の取得に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-gray-200 rounded w-1/4"></div>
					<div className="h-64 bg-gray-200 rounded"></div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6">
				<div className="rounded-md bg-red-50 p-4">
					<p className="text-sm text-red-800">{error}</p>
				</div>
			</div>
		);
	}

	if (!bar) {
		return (
			<div className="p-6">
				<p className="text-gray-500">バーが見つかりません</p>
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">バー編集</h1>
				<p className="mt-1 text-sm text-gray-600">バー情報を編集してください</p>
			</div>

			<div className="bg-white shadow rounded-lg p-6">
				<BarForm bar={bar} isEdit={true} />
			</div>
		</div>
	);
}
