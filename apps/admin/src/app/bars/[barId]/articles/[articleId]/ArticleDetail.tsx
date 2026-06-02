"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Article } from "@/types/database";

interface ArticleDetailProps {
	barId: string;
	articleId: string;
	userRole: "bar_owner" | "admin";
}

export default function ArticleDetail({
	barId,
	articleId,
	userRole,
}: ArticleDetailProps) {
	const router = useRouter();
	const [article, setArticle] = useState<Article | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const isBarOwner = userRole === "bar_owner";

	const fetchArticle = useCallback(async () => {
		try {
			const res = await fetch(`/api/bars/${barId}/articles/${articleId}`);
			if (!res.ok) {
				if (res.status === 404) {
					setError("記事が見つかりません");
				} else {
					setError("記事の取得に失敗しました");
				}
				return;
			}
			const data = await res.json();
			setArticle(data.article);
		} catch (_error) {
			setError("記事の取得に失敗しました");
		} finally {
			setLoading(false);
		}
	}, [barId, articleId]);

	useEffect(() => {
		fetchArticle();
	}, [fetchArticle]);

	const handleDelete = async () => {
		if (!confirm("この記事を削除してもよろしいですか？")) return;

		try {
			const res = await fetch(`/api/bars/${barId}/articles/${articleId}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				alert("削除に失敗しました");
				return;
			}
			router.push(`/bars/${barId}/articles`);
		} catch (_error) {
			alert("削除に失敗しました");
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleString("ja-JP", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
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

	if (!article) return null;

	const imageUrls = [
		article.image_url,
		article.image_url_2,
		article.image_url_3,
	].filter(Boolean) as string[];

	return (
		<div className="space-y-6 max-w-2xl">
			<div className="flex items-center gap-2">
				<Link
					href={`/bars/${barId}/articles`}
					className="text-sm text-gray-500 hover:text-black transition-colors"
				>
					記事管理
				</Link>
				<span className="text-sm text-gray-400">/</span>
				<span className="text-sm text-gray-700">記事詳細</span>
			</div>

			<h1 className="text-2xl font-bold text-gray-900">{article.title}</h1>

			<p className="text-sm text-gray-500">
				{article.published_at
					? formatDate(article.published_at)
					: formatDate(article.created_at)}
			</p>

			{imageUrls.length > 0 && (
				<div className="flex flex-wrap gap-4">
					{imageUrls.map((url, index) => (
						<div key={url} className="relative w-full h-64 md:h-80">
							<Image
								src={url}
								alt={`${article.title} 画像${index + 1}`}
								fill
								className="object-cover rounded-lg border border-gray-200"
							/>
						</div>
					))}
				</div>
			)}

			<div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
				{article.body}
			</div>

			{isBarOwner && (
				<div className="flex gap-3 pt-4 border-t border-gray-200">
					<Link
						href={`/bars/${barId}/articles/${articleId}/edit`}
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
