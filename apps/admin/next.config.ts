import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "http",
				hostname: "127.0.0.1",
				port: "54421",
			},
			{
				protocol: "https",
				hostname: "**.supabase.co",
			},
		],
		unoptimized: process.env.NODE_ENV === "development",
	},
};

export default nextConfig;
