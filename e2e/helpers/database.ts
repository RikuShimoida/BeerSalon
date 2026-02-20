import { prisma } from "../../src/lib/prisma";

export async function ensureBarWithInstagram(): Promise<bigint> {
	const bars = await prisma.bar.findMany({
		select: { id: true, name: true, instagramUrl: true },
		take: 5,
	});

	console.log("Available bars:", bars);

	if (bars.length === 0) {
		throw new Error("No bars found in database");
	}

	const barId = bars[0].id;

	const result = await prisma.bar.updateMany({
		where: { id: barId },
		data: { instagramUrl: "https://www.instagram.com/beersalon_test/" },
	});

	console.log(`Updated ${result.count} bar(s) with Instagram URL (ID: ${barId})`);

	const updatedBar = await prisma.bar.findUnique({
		where: { id: barId },
		select: { id: true, name: true, instagramUrl: true },
	});

	console.log("Updated bar data:", updatedBar);

	return barId;
}

export async function ensureBarWithoutInstagram(): Promise<bigint> {
	const bars = await prisma.bar.findMany({
		select: { id: true, name: true, instagramUrl: true },
		skip: 1,
		take: 1,
	});

	if (bars.length === 0) {
		console.log("Only one bar exists, using the same bar for both tests");
		const firstBar = await prisma.bar.findFirst({
			select: { id: true },
		});
		return firstBar?.id ?? 1n;
	}

	const barId = bars[0].id;

	const result = await prisma.bar.updateMany({
		where: { id: barId },
		data: { instagramUrl: null },
	});

	console.log(
		`Updated ${result.count} bar(s) to remove Instagram URL (ID: ${barId})`,
	);

	const updatedBar = await prisma.bar.findUnique({
		where: { id: barId },
		select: { id: true, name: true, instagramUrl: true },
	});

	console.log("Updated bar data:", updatedBar);

	return barId;
}

export async function cleanup() {
	await prisma.$disconnect();
}
