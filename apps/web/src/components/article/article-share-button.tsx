"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

type ArticleShareButtonProps = {
	title: string;
};

export function ArticleShareButton({ title }: ArticleShareButtonProps) {
	const handleShare = async () => {
		const url = window.location.href;
		try {
			if (navigator.share) {
				await navigator.share({ title, url });
				return;
			}
			await navigator.clipboard.writeText(url);
			toast.success("リンクをコピーしました");
		} catch {
			// Why not: ネイティブ共有シートを閉じただけの AbortError をエラー表示しないため、
			// bar-hero と同様に失敗トーストは出さない
		}
	};

	return (
		<button
			type="button"
			onClick={handleShare}
			aria-label="共有する"
			className="flex items-center gap-2 text-subtext transition-colors hover:text-primary"
		>
			<Share2 className="h-5 w-5" aria-hidden="true" />
			<span className="text-sm">シェア</span>
		</button>
	);
}
