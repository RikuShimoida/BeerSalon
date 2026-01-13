import { describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { getBeerRegions } from "./bar";

vi.mock("@/lib/prisma", () => ({
	prisma: {
		region: {
			findMany: vi.fn(),
		},
	},
}));

describe("getBeerRegions", () => {
	describe("正常系", () => {
		it("国と地域がグループ化されて取得できる", async () => {
			const mockRegions = [
				{ name: "北海道", country: { name: "日本" } },
				{ name: "青森", country: { name: "日本" } },
				{ name: "カリフォルニア", country: { name: "アメリカ" } },
			];

			vi.mocked(prisma.region.findMany).mockResolvedValue(mockRegions as never);

			const result = await getBeerRegions();

			expect(result).toEqual({
				日本: ["北海道", "青森"],
				アメリカ: ["カリフォルニア"],
			});
			expect(prisma.region.findMany).toHaveBeenCalledWith({
				where: {
					isActive: true,
				},
				include: {
					country: true,
				},
				orderBy: [
					{
						country: {
							name: "asc",
						},
					},
					{
						name: "asc",
					},
				],
			});
		});

		it("特定の国の地域のみが存在する場合も正しく処理できる", async () => {
			const mockRegions = [{ name: "北海道", country: { name: "日本" } }];

			vi.mocked(prisma.region.findMany).mockResolvedValue(mockRegions as never);

			const result = await getBeerRegions();

			expect(result).toEqual({
				日本: ["北海道"],
			});
		});

		it("地域が空の場合、空オブジェクトが返される", async () => {
			vi.mocked(prisma.region.findMany).mockResolvedValue([] as never);

			const result = await getBeerRegions();

			expect(result).toEqual({});
		});
	});

	describe("境界値テスト", () => {
		it("地域名が非常に長い場合でも正しく取得できる", async () => {
			const mockRegions = [
				{
					name: "カリフォルニア州ロサンゼルス郡",
					country: { name: "アメリカ" },
				},
			];

			vi.mocked(prisma.region.findMany).mockResolvedValue(mockRegions as never);

			const result = await getBeerRegions();

			expect(result).toEqual({
				アメリカ: ["カリフォルニア州ロサンゼルス郡"],
			});
		});

		it("地域名に特殊文字が含まれる場合でも正しく取得できる", async () => {
			const mockRegions = [
				{ name: "São Paulo", country: { name: "ブラジル" } },
				{ name: "Québec", country: { name: "カナダ" } },
			];

			vi.mocked(prisma.region.findMany).mockResolvedValue(mockRegions as never);

			const result = await getBeerRegions();

			expect(result).toEqual({
				ブラジル: ["São Paulo"],
				カナダ: ["Québec"],
			});
		});

		it("同じ国に複数の地域がある場合、配列にまとめられる", async () => {
			const mockRegions = [
				{ name: "北海道", country: { name: "日本" } },
				{ name: "青森", country: { name: "日本" } },
				{ name: "岩手", country: { name: "日本" } },
			];

			vi.mocked(prisma.region.findMany).mockResolvedValue(mockRegions as never);

			const result = await getBeerRegions();

			expect(result).toEqual({
				日本: ["北海道", "青森", "岩手"],
			});
		});
	});
});
