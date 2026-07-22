import { describe, expect, it } from "vitest";
import {
	getNextIndex,
	isVideoMedia,
	SLIDE_DURATION_MS,
	shouldAutoSlide,
	shouldLoopVideo,
} from "./hero-slider";

describe("getNextIndex", () => {
	it("中間インデックスから次のインデックスを返す", () => {
		expect(getNextIndex(1, 5)).toBe(2);
	});

	it("最終インデックスから先頭(0)へループする", () => {
		expect(getNextIndex(4, 5)).toBe(0);
	});

	it("メディア1件のとき常に0を返す", () => {
		expect(getNextIndex(0, 1)).toBe(0);
	});

	it("メディア0件のとき0を返す(ゼロ除算を避ける)", () => {
		expect(getNextIndex(0, 0)).toBe(0);
	});
});

describe("isVideoMedia", () => {
	it("videoならtrueを返す", () => {
		expect(isVideoMedia("video")).toBe(true);
	});

	it("imageならfalseを返す", () => {
		expect(isVideoMedia("image")).toBe(false);
	});
});

describe("shouldLoopVideo", () => {
	it("動画かつメディア1件のときループ再生する", () => {
		expect(shouldLoopVideo("video", 1)).toBe(true);
	});

	it("動画でもメディアが複数のときはループしない(オートスライドへ委ねる)", () => {
		expect(shouldLoopVideo("video", 3)).toBe(false);
	});

	it("画像はメディア1件でもループ対象外", () => {
		expect(shouldLoopVideo("image", 1)).toBe(false);
	});
});

describe("shouldAutoSlide", () => {
	it("メディアが2件以上でオートスライドする", () => {
		expect(shouldAutoSlide(2)).toBe(true);
	});

	it("メディア1件ではオートスライドしない", () => {
		expect(shouldAutoSlide(1)).toBe(false);
	});

	it("メディア0件ではオートスライドしない", () => {
		expect(shouldAutoSlide(0)).toBe(false);
	});
});

describe("SLIDE_DURATION_MS", () => {
	it("受入条件どおり1枚あたりの上限が5秒(5000ms)である", () => {
		expect(SLIDE_DURATION_MS).toBe(5000);
	});
});
