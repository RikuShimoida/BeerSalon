import { describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { getBeerOrigins } from "./bar";

vi.mock("@/lib/prisma", () => ({
	prisma: {
		beer: {
			findMany: vi.fn(),
		},
	},
}));

describe("getBeerOrigins", () => {
	describe("正常系", () => {
		it("国と地域がグループ化されて取得できる", async () => {
			const mockBeers = [
				{ origin: "日本/北海道" },
				{ origin: "日本/青森" },
				{ origin: "アメリカ/カリフォルニア" },
			];

			vi.mocked(prisma.beer.findMany).mockResolvedValue(mockBeers as never);

			const result = await getBeerOrigins();

			expect(result).toEqual({
				日本: ["北海道", "青森"],
				アメリカ: ["カリフォルニア"],
			});
			expect(prisma.beer.findMany).toHaveBeenCalledWith({
				where: {
					isActive: true,
					origin: {
						not: null,
					},
				},
				select: {
					origin: true,
				},
				distinct: ["origin"],
				orderBy: {
					origin: "asc",
				},
			});
		});

		it("国のみの産地も正しく処理できる", async () => {
			const mockBeers = [{ origin: "日本/北海道" }, { origin: "ベルギー" }];

			vi.mocked(prisma.beer.findMany).mockResolvedValue(mockBeers as never);

			const result = await getBeerOrigins();

			expect(result).toEqual({
				日本: ["北海道"],
				ベルギー: [],
			});
		});

		it("産地が空の場合、空オブジェクトが返される", async () => {
			vi.mocked(prisma.beer.findMany).mockResolvedValue([] as never);

			const result = await getBeerOrigins();

			expect(result).toEqual({});
		});
	});

	describe("異常系", () => {
		it("NULL値が含まれる場合、NULL値は除外される", async () => {
			const mockBeers = [
				{ origin: "日本/東京" },
				{ origin: null },
				{ origin: "アメリカ/ニューヨーク" },
			];

			vi.mocked(prisma.beer.findMany).mockResolvedValue(mockBeers as never);

			const result = await getBeerOrigins();

			expect(result).toEqual({
				日本: ["東京"],
				アメリカ: ["ニューヨーク"],
			});
		});
	});

	describe("境界値テスト", () => {
		it("地域名が非常に長い場合でも正しく取得できる", async () => {
			const mockBeers = [{ origin: "アメリカ/カリフォルニア州ロサンゼルス郡" }];

			vi.mocked(prisma.beer.findMany).mockResolvedValue(mockBeers as never);

			const result = await getBeerOrigins();

			expect(result).toEqual({
				アメリカ: ["カリフォルニア州ロサンゼルス郡"],
			});
		});

		it("産地名に特殊文字が含まれる場合でも正しく取得できる", async () => {
			const mockBeers = [
				{ origin: "ブラジル/São Paulo" },
				{ origin: "カナダ/Québec" },
			];

			vi.mocked(prisma.beer.findMany).mockResolvedValue(mockBeers as never);

			const result = await getBeerOrigins();

			expect(result).toEqual({
				ブラジル: ["São Paulo"],
				カナダ: ["Québec"],
			});
		});

		it("同じ国に複数の地域がある場合、配列にまとめられる", async () => {
			const mockBeers = [
				{ origin: "日本/北海道" },
				{ origin: "日本/青森" },
				{ origin: "日本/岩手" },
			];

			vi.mocked(prisma.beer.findMany).mockResolvedValue(mockBeers as never);

			const result = await getBeerOrigins();

			expect(result).toEqual({
				日本: ["北海道", "青森", "岩手"],
			});
		});
	});
});
