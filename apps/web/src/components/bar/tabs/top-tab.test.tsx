import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TopTab } from "./top-tab";

const baseBar = {
	name: "テストバー",
	description: "PR文です",
	openingTime: null,
	endingTime: null,
	regularHoliday: null as string | null,
	access: null,
	phoneNumber: null,
	prefecture: "静岡県",
	city: "静岡市",
	addressLine1: "1-2-3",
	addressLine2: null,
	websiteUrl: null,
	instagramUrl: null,
	xUrl: null,
	facebookUrl: null,
	lineUrl: null,
	paymentMethods: [],
	openingHours: [],
};

const openingHour = {
	id: "1",
	barId: "1",
	dayOfWeek: 0,
	openTime: new Date("1970-01-01T17:00:00Z"),
	closeTime: new Date("1970-01-01T23:00:00Z"),
	sortOrder: 0,
	isClosed: false,
};

describe("TopTab 定休日補足（regularHoliday）の表示", () => {
	it("曜日別営業時間があっても regularHoliday を併記表示する（排他ではない）", () => {
		render(
			<TopTab
				bar={{
					...baseBar,
					regularHoliday: "不定休 / 第2・第4月曜定休",
					openingHours: [openingHour],
				}}
			/>,
		);

		// 曜日別営業時間ブロックが表示されている
		expect(screen.getByText(/月曜日/)).toBeInTheDocument();
		// かつ regularHoliday も併記されている
		expect(
			screen.getByText("定休日: 不定休 / 第2・第4月曜定休"),
		).toBeInTheDocument();
	});

	it("曜日別営業時間が0件でも regularHoliday を表示する（フォールバックと併記）", () => {
		render(
			<TopTab
				bar={{
					...baseBar,
					regularHoliday: "年末年始休業",
					openingHours: [],
				}}
			/>,
		);

		expect(screen.getByText("定休日: 年末年始休業")).toBeInTheDocument();
	});

	it("regularHoliday が未設定のときは定休日補足を表示しない", () => {
		render(
			<TopTab
				bar={{
					...baseBar,
					regularHoliday: null,
					openingHours: [openingHour],
				}}
			/>,
		);

		expect(screen.queryByText(/^定休日:/)).not.toBeInTheDocument();
	});
});
