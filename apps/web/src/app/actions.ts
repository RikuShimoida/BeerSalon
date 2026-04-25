"use server";

import { prisma } from "@/lib/prisma";

export type BarLocation = {
	id: number;
	name: string;
	latitude: number;
	longitude: number;
	prefecture: string;
	city: string;
	addressLine1: string;
	addressLine2: string | null;
};

export async function getActiveBarsWithLocation(): Promise<BarLocation[]> {
	const bars = await prisma.bar.findMany({
		where: {
			isActive: true,
			latitude: {
				not: null,
			},
			longitude: {
				not: null,
			},
		},
		select: {
			id: true,
			name: true,
			latitude: true,
			longitude: true,
			prefecture: true,
			city: true,
			addressLine1: true,
			addressLine2: true,
		},
	});

	return bars.map((bar) => ({
		id: Number(bar.id),
		name: bar.name,
		latitude: Number(bar.latitude),
		longitude: Number(bar.longitude),
		prefecture: bar.prefecture,
		city: bar.city,
		addressLine1: bar.addressLine1,
		addressLine2: bar.addressLine2,
	}));
}

export async function getFilteredBarsWithLocation(filters: {
	city?: string;
	categoryId?: number;
}): Promise<BarLocation[]> {
	const { city, categoryId } = filters;

	const where: {
		isActive: boolean;
		latitude: { not: null };
		longitude: { not: null };
		city?: string;
		beerMenus?: {
			some: {
				beer: {
					beerCategoryId: number;
				};
			};
		};
	} = {
		isActive: true,
		latitude: {
			not: null,
		},
		longitude: {
			not: null,
		},
	};

	if (city) {
		where.city = city;
	}

	if (categoryId) {
		where.beerMenus = {
			some: {
				beer: {
					beerCategoryId: categoryId,
				},
			},
		};
	}

	const bars = await prisma.bar.findMany({
		where,
		select: {
			id: true,
			name: true,
			latitude: true,
			longitude: true,
			prefecture: true,
			city: true,
			addressLine1: true,
			addressLine2: true,
		},
	});

	return bars.map((bar) => ({
		id: Number(bar.id),
		name: bar.name,
		latitude: Number(bar.latitude),
		longitude: Number(bar.longitude),
		prefecture: bar.prefecture,
		city: bar.city,
		addressLine1: bar.addressLine1,
		addressLine2: bar.addressLine2,
	}));
}
