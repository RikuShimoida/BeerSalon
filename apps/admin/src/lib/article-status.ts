import type { ArticleStatus } from "@/lib/validators";

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
	draft: "下書き",
	published: "公開",
	scheduled: "予約公開",
};

export const ARTICLE_STATUS_BADGE_CLASSES: Record<ArticleStatus, string> = {
	draft: "bg-gray-100 text-gray-700",
	published: "bg-green-100 text-green-800",
	scheduled: "bg-blue-100 text-blue-800",
};
