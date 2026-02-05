import { prisma } from "../src/lib/prisma";

const regionsByCountry = {
	日本: ["静岡", "東京", "神奈川", "北海道", "大阪", "京都", "愛知"],
	アメリカ: [
		"カリフォルニア",
		"オレゴン",
		"ワシントン",
		"コロラド",
		"ニューヨーク",
	],
	イギリス: ["イングランド", "スコットランド"],
	ベルギー: ["ブリュッセル", "フランダース"],
	ドイツ: ["バイエルン"],
	韓国: ["ソウル", "釜山"],
	中国: ["上海", "北京"],
};

async function main() {
	console.log("Start seeding countries and regions...");

	for (const [countryName, regionNames] of Object.entries(regionsByCountry)) {
		const country = await prisma.country.upsert({
			where: { name: countryName },
			update: {},
			create: { name: countryName },
		});

		console.log(`Created/found country: ${countryName}`);

		for (const regionName of regionNames) {
			await prisma.region.upsert({
				where: {
					countryId_name: {
						countryId: country.id,
						name: regionName,
					},
				},
				update: {},
				create: {
					name: regionName,
					countryId: country.id,
				},
			});

			console.log(`  - Created/found region: ${regionName}`);
		}
	}

	console.log("Seeding countries and regions completed successfully!");
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
