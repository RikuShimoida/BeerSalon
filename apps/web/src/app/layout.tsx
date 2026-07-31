import type { Metadata } from "next";
import { Archivo, Zen_Kaku_Gothic_New, Zen_Old_Mincho } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Dark Taproom タイポグラフィ（design_handoff_user_screens/README.md を正とする）
// Zen Old Mincho: 見出し・店名・PR文・記事本文（明朝）
const zenOldMincho = Zen_Old_Mincho({
	variable: "--font-mincho",
	weight: ["700", "900"],
	subsets: ["latin"],
});

// Zen Kaku Gothic New: UI 本文・ラベル・ボタンのデフォルト（ゴシック）
const zenKakuGothicNew = Zen_Kaku_Gothic_New({
	variable: "--font-gothic",
	weight: ["400", "500", "700", "900"],
	subsets: ["latin"],
});

// Archivo: ラテン見出し・ロゴ "Salon"・オーバーライン・カウンタ数字
const archivo = Archivo({
	variable: "--font-archivo",
	weight: ["500", "600", "700", "800"],
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Beer Salon - クラフトビール特化型検索・投稿プラットフォーム",
	description:
		"クラフトビール × 人 × 店舗 をつなぐ。ビアバー検索、投稿、クーポン取得ができるクラフトビール特化型プラットフォーム",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ja">
			<body
				className={`${zenKakuGothicNew.variable} ${zenOldMincho.variable} ${archivo.variable} font-sans antialiased`}
			>
				{children}
				<Toaster />
			</body>
		</html>
	);
}
