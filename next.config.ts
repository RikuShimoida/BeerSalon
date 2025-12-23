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
				port: "54321",
			},
		],
	},
};

export default nextConfig;
