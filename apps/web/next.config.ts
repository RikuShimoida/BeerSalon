import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
