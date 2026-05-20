"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Article } from "@/types/database";

interface ArticleListProps {
	barId: string;
	userRole: "bar_owner" | "admin";
}

export default function ArticleList({ barId, userRole }: ArticleListProps) {
	const [articles, setArticles] = useState<Article[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const isBarOwner = userRole === "bar_owner";

	const fetchArticles = useCallback(async () => {
		try {
			const res = await fetch(`/api/bars/${barId}/articles`);
			if (!res.ok) {
				setError("記事の取得に失敗しました");
				return;
			}
			const data = await res.json();
			setArticles(data.articles || []);
		} catch (_error) {
			setError("記事の取得に失敗しました");
		} finally {
			setLoading(false);
		}
	}, [barId]);

	useEffect(() => {
		fetchArticles();
	}, [fetchArticles]);

	const truncateText = (text: string, maxLength: number) => {
		if (text.length <= maxLength) return text;
		return `${text.slice(0, maxLength)}...`;
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
				<h1 className="text-2xl font-bold text-gray-900">記事管理</h1>
				{isBarOwner && (
					<Link
						href={`/bars/${barId}/articles/new`}
						className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
					>
						記事を投稿する
					</Link>
				)}
			</div>

			{articles.length === 0 ? (
				<div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
					<p className="text-sm text-gray-500">
						記事がまだ投稿されていません
					</p>
					{isBarOwner && (
						<Link
							href={`/bars/${barId}/articles/new`}
							className="mt-4 inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
						>
							記事を投稿する
						</Link>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{articles.map((article) => (
						<Link
							key={article.id}
							href={`/bars/${barId}/articles/${article.id}`}
							className="block border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
						>
							{article.image_url ? (
								<div className="relative w-full h-40">
									<Image
										src={article.image_url}
										alt={article.title}
										fill
										className="object-cover"
									/>
								</div>
							) : (
								<div
									className="w-full h-40 bg-gray-100 flex items-center justify-center"
									role="img"
									aria-label="画像なし"
								>
									<span className="text-3xl text-gray-300">📝</span>
								</div>
							)}
							<div className="p-4">
								<h3 className="font-bold text-gray-900 truncate">
									{article.title}
								</h3>
								<p className="text-sm text-gray-500 mt-1">
									{truncateText(article.body, 30)}
								</p>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
