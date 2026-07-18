import { Clock, type LucideIcon, Plus, Rss, Star } from "lucide-react";

export type NavItem = {
	href: string;
	label: string;
	icon: LucideIcon;
	// Why not label 単独で判定: PC 横ナビとモバイル FAB で扱いが分かれる「投稿」を
	// アイコン・ラベルの持ち方に依らず一意に識別するため、専用フラグを持たせる。
	isPost?: boolean;
};

// 共通レイアウトのナビ項目。Header（PC 横ナビ）と Footer（モバイルボトムナビ）で共有する。
export const NAV_ITEMS: NavItem[] = [
	{ href: "/favorites/bars", label: "お気に入り", icon: Star },
	{ href: "/timeline", label: "タイムライン", icon: Rss },
	{ href: "/posts/new", label: "投稿", icon: Plus, isPost: true },
	{ href: "/history/bars", label: "履歴", icon: Clock },
];
