import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma";

const pool = new Pool({
	connectionString:
		process.env.DATABASE_URL ||
		"postgresql://postgres:postgres@127.0.0.1:54322/postgres",
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
	adapter,
});

async function main() {
	console.log("Starting seed...");

	const beerCategory = await prisma.beerCategory.create({
		data: {
			name: "IPA",
		},
	});

	const brewery = await prisma.brewery.create({
		data: {
			name: "静岡クラフトビール",
			country: "日本",
			region: "静岡県",
		},
	});

	const beer = await prisma.beer.create({
		data: {
			name: "静岡ペールエール",
			beerCategoryId: beerCategory.id,
			breweryId: brewery.id,
			origin: "静岡県",
			abv: "5.5",
			ibu: 40,
			description: "静岡産ホップを使用した爽やかなペールエール",
		},
	});

	const bar = await prisma.bar.create({
		data: {
			name: "ビアバー サンプル",
			prefecture: "静岡県",
			city: "静岡市",
			addressLine1: "葵区紺屋町1-1",
			latitude: "34.9756",
			longitude: "138.3828",
			phoneNumber: "054-123-4567",
			openingTime: new Date("1970-01-01T17:00:00Z"),
			endingTime: new Date("1970-01-01T24:00:00Z"),
			regularHoliday: "月曜日",
			access: "JR静岡駅から徒歩5分",
			websiteUrl: "https://example.com",
			description:
				"静岡駅近くのクラフトビール専門店です。\n常時20種類以上のクラフトビールを取り揃えております。",
		},
	});

	await prisma.barBeerMenu.create({
		data: {
			barId: bar.id,
			beerId: beer.id,
			price: 800,
			size: "パイント",
			description: "おすすめの一杯",
		},
	});

	await prisma.barFoodMenu.create({
		data: {
			barId: bar.id,
			name: "フライドポテト",
			price: 500,
			description: "ビールに合うカリカリポテト",
		},
	});

	await prisma.coupon.create({
		data: {
			barId: bar.id,
			title: "初回来店クーポン",
			description: "初回来店時にビール1杯無料",
			conditions: "会計時にこのクーポンを提示してください",
			validFrom: new Date(),
			validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		},
	});

	await prisma.article.create({
		data: {
			barId: bar.id,
			title: "新しいビールが入荷しました！",
			body: "今週、新しいクラフトビールが入荷しました。\n静岡産のホップを使用した爽やかなIPAです。\nぜひお試しください！",
			isPublished: true,
			publishedAt: new Date(),
		},
	});

	console.log("Seed completed!");
	console.log(`Created bar with ID: ${bar.id}`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
		await pool.end();
	});
