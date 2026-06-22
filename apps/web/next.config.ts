import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Why not experimental.serverActions: Next.js 14.0 以降 bodySizeLimit は stable に昇格しており、
	// experimental 配下に書くと無視される。アプリ側の画像バリデーション(5MB)とフレームワーク制限を揃える。
	serverActions: {
		bodySizeLimit: "5mb",
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
