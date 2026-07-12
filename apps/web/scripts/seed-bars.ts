import { SHIZUOKA_MUNICIPALITIES } from "@beersalon/shared";
import { prisma } from "../src/lib/prisma";

type BeerCategoryName =
	| "IPA"
	| "ピルスナー"
	| "スタウト"
	| "ヴァイツェン"
	| "ペールエール";

const beerCategoryNames: BeerCategoryName[] = [
	"IPA",
	"ピルスナー",
	"スタウト",
	"ヴァイツェン",
	"ペールエール",
];

// Why not: seed 独自の市町村リストを持たない。区付き（「静岡市（葵区）」等）で
// bars.city を生成すると、区なしの市町村フィルターと一致せず Issue #419 を再生産する。
// 検索・登録と同一マスタ（@beersalon/shared）を使い、区なし粒度で揃える。
const cities = [...SHIZUOKA_MUNICIPALITIES];

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

const barNames = [
	"クラフトビアバー",
	"ブルワリータップ",
	"ビアホール",
	"ビアパブ",
	"タップルーム",
	"ブルーパブ",
	"ビアカフェ",
	"クラフトビール専門店",
	"ビアスタンド",
	"ビールバー",
];

const breweryPrefixes = [
	"地ビール工房",
	"クラフトブルワリー",
	"麦酒醸造所",
	"ビール工房",
	"ブルワリー",
];

const exteriorImages = [
	"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop",
	"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop",
	"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
	"https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop",
	"https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=600&fit=crop",
];

const interiorImages = [
	"https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&h=600&fit=crop",
	"https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&h=600&fit=crop",
	"https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=800&h=600&fit=crop",
	"https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop",
	"https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=800&h=600&fit=crop",
];

const beerImages = [
	"https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&h=600&fit=crop",
	"https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&h=600&fit=crop",
	"https://images.unsplash.com/photo-1618183479302-1e0aa382c36b?w=800&h=600&fit=crop",
	"https://images.unsplash.com/photo-1612528443702-f6741f70a049?w=800&h=600&fit=crop",
	"https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=800&h=600&fit=crop",
];

const foodImages = [
	"https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&h=600&fit=crop",
	"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop",
	"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop",
	"https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop",
	"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",
];

async function main() {
	console.log("Start seeding bars...");

	const japan = await prisma.country.findFirst({
		where: { name: "日本" },
	});

	if (!japan) {
		throw new Error(
			"Japan country not found. Please run seed-regions.ts first.",
		);
	}

	const beerCategories: Record<BeerCategoryName, { id: bigint }> = {
		IPA: { id: BigInt(0) },
		ピルスナー: { id: BigInt(0) },
		スタウト: { id: BigInt(0) },
		ヴァイツェン: { id: BigInt(0) },
		ペールエール: { id: BigInt(0) },
	};

	for (const categoryName of beerCategoryNames) {
		const category = await prisma.beerCategory.upsert({
			where: { name: categoryName },
			update: {},
			create: { name: categoryName },
		});
		beerCategories[categoryName] = category;
	}

	console.log("Beer categories created");

	const allRegions: Array<{
		id: bigint;
		name: string;
		countryName: string;
	}> = [];

	for (const [countryName, regionNames] of Object.entries(regionsByCountry)) {
		const country = await prisma.country.findFirst({
			where: { name: countryName },
		});

		if (!country) {
			console.warn(`Country ${countryName} not found, skipping regions`);
			continue;
		}

		for (const regionName of regionNames) {
			const region = await prisma.region.findFirst({
				where: {
					countryId: country.id,
					name: regionName,
				},
			});

			if (region) {
				allRegions.push({
					id: region.id,
					name: regionName,
					countryName,
				});
			}
		}
	}

	console.log(`Found ${allRegions.length} regions`);

	const totalBars = 51;

	for (let i = 0; i < totalBars; i++) {
		const cityIndex = i % cities.length;
		const city = cities[cityIndex];

		const categoryIndex = i % beerCategoryNames.length;
		const categoryName = beerCategoryNames[categoryIndex];
		const category = beerCategories[categoryName];

		const regionIndex = i % allRegions.length;
		const region = allRegions[regionIndex];

		const barNameIndex = i % barNames.length;
		const barName =
			i === 0
				? "クラフトビアバー 静岡"
				: `${barNames[barNameIndex]} ${city.replace("市", "")} ${i + 1}号店`;

		const breweryName =
			i === 0
				? "静岡ブルワリー"
				: `${breweryPrefixes[i % breweryPrefixes.length]} ${region.name} ${i + 1}`;
		const breweryWebsiteUrl =
			i === 0
				? "https://shizuoka-brewery.example.com"
				: `https://brewery-${i + 1}.example.com`;

		const brewery = await prisma.brewery.upsert({
			where: { name: breweryName },
			update: {},
			create: {
				name: breweryName,
				regionId: region.id,
				websiteUrl: breweryWebsiteUrl,
			},
		});

		const beerName =
			i === 0 ? "静岡IPA" : `${region.name} ${categoryName} ${i + 1}`;
		const beerAbv = i === 0 ? 6.5 : 4.5 + (i % 6) * 0.5;
		const beerIbu = i === 0 ? 60 : 20 + (i % 8) * 10;
		const beerDescription =
			i === 0
				? "静岡県産ホップを使用した華やかな香りのIPA。柑橘系の香りと程よい苦味が特徴です。"
				: `${region.countryName}・${region.name}産の${categoryName}。${i % 3 === 0 ? "華やかな香り" : i % 3 === 1 ? "爽やかな味わい" : "深いコク"}が特徴です。`;

		const beer = await prisma.beer.create({
			data: {
				name: beerName,
				beerCategoryId: category.id,
				breweryId: brewery.id,
				regionId: region.id,
				abv: beerAbv,
				ibu: beerIbu,
				description: beerDescription,
			},
		});

		const addressLine1 =
			i === 0
				? "葵区紺屋町1-1"
				: `${city.replace("市", "")}中心街${i + 1}-${(i % 10) + 1}`;
		const addressLine2 =
			i === 0
				? "ビルディング2F"
				: i % 3 === 0
					? `ビル${(i % 5) + 1}F`
					: undefined;

		const baseLatitude = 34.5 + (cityIndex * 0.5) / cities.length;
		const baseLongitude = 137.5 + (cityIndex * 1.5) / cities.length;

		const latitude = i === 0 ? 34.9756 : baseLatitude + (i % 100) * 0.001;
		const longitude = i === 0 ? 138.3828 : baseLongitude + (i % 100) * 0.001;

		const access =
			i === 0
				? "JR静岡駅北口から徒歩5分"
				: `JR${city.replace("市", "")}駅から徒歩${(i % 15) + 1}分`;

		const websiteUrl =
			i === 0
				? "https://craft-beer-shizuoka.example.com"
				: `https://bar-${i + 1}.example.com`;

		const description =
			i === 0
				? "静岡駅近くのクラフトビール専門店です。常時20種類以上の国内外のクラフトビールを取り揃えております。静岡県産のクラフトビールも多数ご用意しています。"
				: `${city}にある${categoryName}が充実したクラフトビール専門店です。常時${15 + (i % 10)}種類以上のクラフトビールを取り揃えております。${region.countryName}産のビールも豊富にご用意しています。`;

		const bar = await prisma.bar.create({
			data: {
				name: barName,
				prefecture: "静岡県",
				city: city,
				addressLine1: addressLine1,
				addressLine2: addressLine2,
				latitude: latitude,
				longitude: longitude,
				phoneNumber: `054-${String(100 + i).padStart(3, "0")}-${String(1000 + ((i * 7) % 9000)).padStart(4, "0")}`,
				openingTime: new Date(`1970-01-01T${16 + (i % 3)}:00:00Z`),
				endingTime: new Date(`1970-01-01T${23 + (i % 2)}:00:00Z`),
				regularHoliday:
					i % 7 === 0
						? "月曜日"
						: i % 7 === 1
							? "火曜日"
							: i % 7 === 2
								? "水曜日"
								: i % 7 === 3
									? "木曜日"
									: i % 7 === 4
										? "なし"
										: i % 7 === 5
											? "日曜日"
											: "不定休",
				access: access,
				websiteUrl: websiteUrl,
				description: description,
			},
		});

		const menuPrice = i === 0 ? 900 : 700 + (i % 10) * 100;
		const menuSize =
			i === 0
				? "パイント（473ml）"
				: i % 4 === 0
					? "パイント（473ml）"
					: i % 4 === 1
						? "ハーフパイント（237ml）"
						: i % 4 === 2
							? "グラス（300ml）"
							: "ジョッキ（500ml）";
		const menuDescription =
			i === 0
				? "当店おすすめの静岡産IPA"
				: `当店おすすめの${region.name}産${categoryName}`;

		await prisma.barBeerMenu.create({
			data: {
				barId: bar.id,
				beerId: beer.id,
				price: menuPrice,
				size: menuSize,
				description: menuDescription,
			},
		});

		const foodMenus = [
			{
				name: i % 5 === 0 ? "フライドポテト" : "フィッシュ&チップス",
				price: 500 + (i % 3) * 100,
				description:
					i % 5 === 0
						? "ビールに合うカリカリポテト"
						: "イギリス風のフィッシュ&チップス",
			},
			{
				name: i % 4 === 0 ? "エビのアヒージョ" : "ソーセージ盛り合わせ",
				price: 800 + (i % 4) * 100,
				description:
					i % 4 === 0
						? "ニンニクとオリーブオイルで煮込んだエビ"
						: "各種ソーセージの盛り合わせ",
			},
			{
				name: i % 3 === 0 ? "チーズ盛り合わせ" : "生ハム盛り合わせ",
				price: 1200 + (i % 5) * 100,
				description:
					i % 3 === 0 ? "3種類のチーズの盛り合わせ" : "厳選生ハムの盛り合わせ",
			},
		];

		await prisma.barFoodMenu.createMany({
			data: foodMenus.map((menu) => ({
				barId: bar.id,
				...menu,
			})),
		});

		await prisma.barImage.createMany({
			data: [
				{
					barId: bar.id,
					imageType: "exterior",
					imageUrl: exteriorImages[i % exteriorImages.length],
					sortOrder: 1,
				},
				{
					barId: bar.id,
					imageType: "interior",
					imageUrl: interiorImages[i % interiorImages.length],
					sortOrder: 2,
				},
				{
					barId: bar.id,
					imageType: "beer",
					imageUrl: beerImages[i % beerImages.length],
					sortOrder: 3,
				},
				{
					barId: bar.id,
					imageType: "food",
					imageUrl: foodImages[i % foodImages.length],
					sortOrder: 4,
				},
			],
		});

		if (i % 3 === 0) {
			await prisma.coupon.create({
				data: {
					barId: bar.id,
					title: i % 6 === 0 ? "初回来店クーポン" : "週末限定クーポン",
					description:
						i % 6 === 0
							? "初回来店時にビール1杯無料"
							: "週末限定！ビール全品10%OFF",
					conditions:
						i % 6 === 0
							? "会計時にこのクーポンを提示してください"
							: "土日祝日のみ有効。会計時に提示してください",
					validFrom: new Date(),
					validUntil: new Date(
						Date.now() + (30 + (i % 30)) * 24 * 60 * 60 * 1000,
					),
				},
			});
		}

		if (i % 2 === 0) {
			const articleTitle =
				i === 0
					? "静岡IPAが新登場！"
					: i % 4 === 0
						? `${categoryName}新入荷のお知らせ`
						: `${city}で楽しむクラフトビール`;

			const articleBody =
				i === 0
					? "当店自慢の静岡IPAが新しく入荷しました。\n静岡県産のホップを使用した華やかな香りが特徴のIPAです。\n柑橘系の爽やかな香りと程よい苦味のバランスが絶妙です。\nぜひお試しください！"
					: i % 4 === 0
						? `当店自慢の${beerName}が新しく入荷しました。\n${region.countryName}・${region.name}産の${categoryName}で、${i % 3 === 0 ? "華やかな香り" : i % 3 === 1 ? "爽やかな味わい" : "深いコク"}が特徴です。\nぜひお試しください！`
						: `${city}の中心街にある当店では、常時${15 + (i % 10)}種類以上のクラフトビールをご用意しています。\n今月のおすすめは${beerName}です。\n皆様のご来店をお待ちしております！`;

			await prisma.article.create({
				data: {
					barId: bar.id,
					title: articleTitle,
					body: articleBody,
					isPublished: true,
					publishedAt: new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000),
				},
			});
		}

		console.log(`Created bar ${i + 1}/${totalBars}: ${barName}`);
	}

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
