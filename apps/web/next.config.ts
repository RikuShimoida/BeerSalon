import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Why not トップレベル serverActions: next@16 の NextConfig 型では serverActions は experimental 配下にあり、
	// トップレベルに置くと型エラー(TS2353)になる。アプリ側の画像バリデーション(5MB)とフレームワーク制限を揃える。
	experimental: {
		serverActions: {
			bodySizeLimit: "5mb",
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**.supabase.co",
			},
			{
				protocol: "http",
				hostname: "127.0.0.1",
				port: "54421",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
			{
				protocol: "https",
				hostname: "placehold.co",
			},
		],
		// ローカル開発環境ではプライベートIPへのアクセスを許可
		dangerouslyAllowSVG: true,
		unoptimized: process.env.NODE_ENV === "development",
	},
};

export default nextConfig;
