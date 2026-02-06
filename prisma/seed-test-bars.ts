import { prisma } from "../src/lib/prisma";

async function main() {
	console.log("Start seeding test bars...");

	const testBars = [
		{
			name: "クラフトビアバー 静岡",
			prefecture: "静岡県",
			city: "静岡市（葵区）",
			addressLine1: "葵区紺屋町1-1",
			addressLine2: null,
			latitude: 34.9756,
			longitude: 138.3833,
			phoneNumber: "054-123-4567",
			description: "静岡駅から徒歩5分。クラフトビール20種類以上を提供。",
			isActive: true,
		},
		{
			name: "ブルワリータップ 浜松",
			prefecture: "静岡県",
			city: "浜松市（中央区）",
			addressLine1: "中央区旭町10-1",
			addressLine2: null,
			latitude: 34.7108,
			longitude: 137.7262,
			phoneNumber: "053-456-7890",
			description: "自家醸造のクラフトビールを楽しめるブルワリー併設店。",
			isActive: true,
		},
		{
			name: "ビアホール 沼津",
			prefecture: "静岡県",
			city: "沼津市",
			addressLine1: "大手町1-1-1",
			addressLine2: null,
			latitude: 35.0965,
			longitude: 138.8631,
			phoneNumber: "055-987-6543",
			description: "沼津港近くの開放的なビアホール。新鮮な海の幸と一緒に。",
			isActive: true,
		},
	];

	for (const barData of testBars) {
		const bar = await prisma.bar.upsert({
			where: {
				id: BigInt(0),
			},
			update: {},
			create: barData,
		});
		console.log(`Created bar: ${bar.name} (ID: ${bar.id})`);
	}

	console.log("Seeding completed.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
