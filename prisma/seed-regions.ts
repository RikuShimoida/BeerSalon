import { prisma } from "../src/lib/prisma";

async function main() {
	console.log("Start seeding countries and regions...");

	// Create countries
	const japan = await prisma.country.upsert({
		where: { name: "日本" },
		update: {},
		create: {
			name: "日本",
		},
	});

	const usa = await prisma.country.upsert({
		where: { name: "アメリカ" },
		update: {},
		create: {
			name: "アメリカ",
		},
	});

	const belgium = await prisma.country.upsert({
		where: { name: "ベルギー" },
		update: {},
		create: {
			name: "ベルギー",
		},
	});

	const germany = await prisma.country.upsert({
		where: { name: "ドイツ" },
		update: {},
		create: {
			name: "ドイツ",
		},
	});

	const uk = await prisma.country.upsert({
		where: { name: "イギリス" },
		update: {},
		create: {
			name: "イギリス",
		},
	});

	console.log("Countries created");

	// Create regions for Japan
	const japaneseRegions = [
		"北海道",
		"青森",
		"岩手",
		"宮城",
		"秋田",
		"山形",
		"福島",
		"茨城",
		"栃木",
		"群馬",
		"埼玉",
		"千葉",
		"東京",
		"神奈川",
		"新潟",
		"富山",
		"石川",
		"福井",
		"山梨",
		"長野",
		"岐阜",
		"静岡",
		"愛知",
		"三重",
		"滋賀",
		"京都",
		"大阪",
		"兵庫",
		"奈良",
		"和歌山",
		"鳥取",
		"島根",
		"岡山",
		"広島",
		"山口",
		"徳島",
		"香川",
		"愛媛",
		"高知",
		"福岡",
		"佐賀",
		"長崎",
		"熊本",
		"大分",
		"宮崎",
		"鹿児島",
		"沖縄",
	];

	for (const regionName of japaneseRegions) {
		await prisma.region.upsert({
			where: {
				countryId_name: {
					countryId: japan.id,
					name: regionName,
				},
			},
			update: {},
			create: {
				name: regionName,
				countryId: japan.id,
			},
		});
	}

	console.log("Japanese regions created");

	// Create regions for USA
	const usaRegions = [
		"カリフォルニア",
		"オレゴン",
		"ワシントン",
		"コロラド",
		"テキサス",
		"ニューヨーク",
		"マサチューセッツ",
		"フロリダ",
		"イリノイ",
		"ペンシルベニア",
	];

	for (const regionName of usaRegions) {
		await prisma.region.upsert({
			where: {
				countryId_name: {
					countryId: usa.id,
					name: regionName,
				},
			},
			update: {},
			create: {
				name: regionName,
				countryId: usa.id,
			},
		});
	}

	console.log("USA regions created");

	// Create regions for Belgium
	const belgiumRegions = ["ブリュッセル", "フランダース", "ワロン"];

	for (const regionName of belgiumRegions) {
		await prisma.region.upsert({
			where: {
				countryId_name: {
					countryId: belgium.id,
					name: regionName,
				},
			},
			update: {},
			create: {
				name: regionName,
				countryId: belgium.id,
			},
		});
	}

	console.log("Belgium regions created");

	// Create regions for Germany
	const germanyRegions = [
		"バイエルン",
		"ベルリン",
		"ノルトライン・ヴェストファーレン",
	];

	for (const regionName of germanyRegions) {
		await prisma.region.upsert({
			where: {
				countryId_name: {
					countryId: germany.id,
					name: regionName,
				},
			},
			update: {},
			create: {
				name: regionName,
				countryId: germany.id,
			},
		});
	}

	console.log("Germany regions created");

	// Create regions for UK
	const ukRegions = [
		"イングランド",
		"スコットランド",
		"ウェールズ",
		"北アイルランド",
	];

	for (const regionName of ukRegions) {
		await prisma.region.upsert({
			where: {
				countryId_name: {
					countryId: uk.id,
					name: regionName,
				},
			},
			update: {},
			create: {
				name: regionName,
				countryId: uk.id,
			},
		});
	}

	console.log("UK regions created");
	console.log("Seeding completed successfully!");
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
