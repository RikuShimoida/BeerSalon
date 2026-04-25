import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "BeerSalonAdmin",
	description: "Beer Salon バーオーナー向け管理画面",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ja">
			<body>{children}</body>
		</html>
	);
}
