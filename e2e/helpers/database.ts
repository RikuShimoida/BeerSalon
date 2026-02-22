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

export async function cleanup() {
	await prisma.$disconnect();
}
