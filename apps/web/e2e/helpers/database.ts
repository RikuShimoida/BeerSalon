import { prisma } from "../../src/lib/prisma";

export async function ensureBarWithInstagram(): Promise<bigint> {
	const bars = await prisma.bar.findMany({
		select: { id: true, name: true, instagramUrl: true },
		take: 5,
	});

	if (bars.length === 0) {
		throw new Error("No bars found in database");
	}

	const barId = bars[0].id;

	await prisma.bar.updateMany({
		where: { id: barId },
		data: { instagramUrl: "https://www.instagram.com/beersalon_test/" },
	});

	return barId;
}

export async function ensureBarWithoutInstagram(): Promise<bigint> {
	const bars = await prisma.bar.findMany({
		select: { id: true, name: true, instagramUrl: true },
		skip: 1,
		take: 1,
	});

	if (bars.length === 0) {
		const firstBar = await prisma.bar.findFirst({
			select: { id: true },
		});
		return firstBar?.id ?? 1n;
	}

	const barId = bars[0].id;

	await prisma.bar.updateMany({
		where: { id: barId },
		data: { instagramUrl: null },
	});

	return barId;
}

export async function ensureBarWithXUrl(): Promise<bigint> {
	const bars = await prisma.bar.findMany({
		select: { id: true, name: true, xUrl: true },
		take: 5,
	});

	if (bars.length === 0) {
		throw new Error("No bars found in database");
	}

	const barId = bars[0].id;

	await prisma.bar.updateMany({
		where: { id: barId },
		data: { xUrl: "https://x.com/beersalon_test" },
	});

	return barId;
}

export async function ensureBarWithoutXUrl(): Promise<bigint> {
	const bars = await prisma.bar.findMany({
		select: { id: true, name: true, xUrl: true },
		skip: 1,
		take: 1,
	});

	if (bars.length === 0) {
		const firstBar = await prisma.bar.findFirst({
			select: { id: true },
		});
		return firstBar?.id ?? 1n;
	}

	const barId = bars[0].id;

	await prisma.bar.updateMany({
		where: { id: barId },
		data: { xUrl: null },
	});

	return barId;
}

export async function ensureBarWithFacebookUrl(): Promise<bigint> {
	const bars = await prisma.bar.findMany({
		select: { id: true, name: true, facebookUrl: true },
		take: 5,
	});

	if (bars.length === 0) {
		throw new Error("No bars found in database");
	}

	const barId = bars[0].id;

	await prisma.bar.updateMany({
		where: { id: barId },
		data: { facebookUrl: "https://www.facebook.com/beersalon.test" },
	});

	return barId;
}

export async function ensureBarWithoutFacebookUrl(): Promise<bigint> {
	const bars = await prisma.bar.findMany({
		select: { id: true, name: true, facebookUrl: true },
		skip: 1,
		take: 1,
	});

	if (bars.length === 0) {
		const firstBar = await prisma.bar.findFirst({
			select: { id: true },
		});
		return firstBar?.id ?? 1n;
	}

	const barId = bars[0].id;

	await prisma.bar.updateMany({
		where: { id: barId },
		data: { facebookUrl: null },
	});

	return barId;
}

// Why not: seed.e2e.sql の bar(100001/100002) を書き換えると、city="静岡市"/"渋谷区" を
// 前提にした既存テストの独立性が壊れる。マップピン用に seed を触らず、CITY_COORDINATES に
// 一致する city と座標を持つ専用 bar を都度作成し、テスト後に削除する。
const GEO_BAR_NAME = "e2e-map-pin-bar";
const GEO_BAR_CITY = "静岡市（葵区）";

export async function createBarWithGeo(): Promise<{
	barId: bigint;
	name: string;
	city: string;
	latitude: number;
	longitude: number;
}> {
	// 前回失敗などで残っていた場合に備え、先に掃除してから作る
	await prisma.bar.deleteMany({ where: { name: GEO_BAR_NAME } });

	const bar = await prisma.bar.create({
		data: {
			name: GEO_BAR_NAME,
			prefecture: "静岡県",
			city: GEO_BAR_CITY,
			addressLine1: "e2e-map-pin-address",
			latitude: 34.9756,
			longitude: 138.3833,
			isActive: true,
		},
	});

	return {
		barId: bar.id,
		name: bar.name,
		city: bar.city,
		latitude: 34.9756,
		longitude: 138.3833,
	};
}

export async function removeBarWithGeo(): Promise<void> {
	await prisma.bar.deleteMany({ where: { name: GEO_BAR_NAME } });
}

export async function cleanup() {
	await prisma.$disconnect();
}
