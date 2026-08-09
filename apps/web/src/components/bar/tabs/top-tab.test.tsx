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
	latitude: null as string | null | undefined,
	longitude: null as string | null | undefined,
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

describe("TopTab 営業時間の翌日跨ぎ判定", () => {
	// openTime / closeTime は `@db.Time` の「壁時計の時刻」で、Prisma は
	// 1970-01-01T<時刻>Z として返す。表示・判定ともに UTC getter で読むのが正しく、
	// ローカル TZ getter を混ぜると実行環境の TZ 分だけ判定がずれる。
	const renderWithHours = (openTime: Date, closeTime: Date) =>
		render(
			<TopTab
				bar={{
					...baseBar,
					openingHours: [{ ...openingHour, openTime, closeTime }],
				}}
			/>,
		);

	it("閉店時刻が開店時刻より前の深夜営業は「翌」を付けて表示する", () => {
		renderWithHours(
			new Date("1970-01-01T23:00:00Z"),
			new Date("1970-01-01T03:00:00Z"),
		);

		expect(screen.getByText(/月曜日: 23:00～翌03:00/)).toBeInTheDocument();
	});

	it("日付を跨がない営業時間には「翌」を付けない", () => {
		renderWithHours(
			new Date("1970-01-01T17:00:00Z"),
			new Date("1970-01-01T23:00:00Z"),
		);

		expect(screen.getByText(/月曜日: 17:00～23:00/)).toBeInTheDocument();
		expect(screen.queryByText(/翌/)).not.toBeInTheDocument();
	});

	it("閉店が 00:00 ちょうどの場合も「翌」を付けない（24時間営業と誤判定しない）", () => {
		renderWithHours(
			new Date("1970-01-01T18:00:00Z"),
			new Date("1970-01-01T00:00:00Z"),
		);

		expect(screen.getByText(/月曜日: 18:00～翌00:00/)).toBeInTheDocument();
	});

	it("00:00〜23:59 は24時間営業として表示する", () => {
		renderWithHours(
			new Date("1970-01-01T00:00:00Z"),
			new Date("1970-01-01T23:59:00Z"),
		);

		expect(screen.getByText(/月曜日: 24時間営業/)).toBeInTheDocument();
	});
});

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

describe("TopTab 住所の地図アプリ導線", () => {
	it("緯度経度が登録済みのとき、Apple/Google 両方の経路案内リンクを座標付きで表示する", () => {
		render(
			<TopTab
				bar={{
					...baseBar,
					latitude: "35.1614",
					longitude: "138.6764",
				}}
			/>,
		);

		const apple = screen.getByRole("link", { name: /^マップで開く$/ });
		expect(apple).toHaveAttribute(
			"href",
			"https://maps.apple.com/?daddr=35.1614%2C138.6764",
		);

		const google = screen.getByRole("link", { name: /Googleマップで開く/ });
		expect(google).toHaveAttribute(
			"href",
			"https://www.google.com/maps/dir/?api=1&destination=35.1614%2C138.6764",
		);
	});

	it("緯度経度が未登録でも住所ベースで導線を表示する", () => {
		render(
			<TopTab
				bar={{
					...baseBar,
					prefecture: "東京都",
					city: "渋谷区",
					addressLine1: "道玄坂1-2-3",
					latitude: null,
					longitude: null,
				}}
			/>,
		);

		const expected = encodeURIComponent("東京都渋谷区道玄坂1-2-3");
		const google = screen.getByRole("link", { name: /Googleマップで開く/ });
		expect(google).toHaveAttribute(
			"href",
			`https://www.google.com/maps/dir/?api=1&destination=${expected}`,
		);
	});

	it("導線リンクは新規タブで開く（target=_blank + rel）", () => {
		render(
			<TopTab bar={{ ...baseBar, latitude: "35.1", longitude: "138.6" }} />,
		);

		const apple = screen.getByRole("link", { name: /^マップで開く$/ });
		expect(apple).toHaveAttribute("target", "_blank");
		expect(apple).toHaveAttribute("rel", "noopener noreferrer");
	});
});

describe("TopTab SNSリンクの表示（アイコンのみ・URLテキスト非表示）", () => {
	const snsBar = {
		...baseBar,
		instagramUrl: "https://instagram.com/shizuoka_beer",
		xUrl: "https://x.com/shizuoka_x",
		facebookUrl: "https://facebook.com/shizuoka_fb",
		lineUrl: "https://line.me/shizuoka_line",
	};

	it("各SNSが設定されているとき、対応するリンクをアイコンのみで表示し href を維持する", () => {
		render(<TopTab bar={snsBar} />);

		const instagram = screen.getByLabelText("Instagramで見る");
		expect(instagram).toHaveAttribute(
			"href",
			"https://instagram.com/shizuoka_beer",
		);

		const x = screen.getByLabelText("Xで見る");
		expect(x).toHaveAttribute("href", "https://x.com/shizuoka_x");

		const facebook = screen.getByLabelText("Facebookで見る");
		expect(facebook).toHaveAttribute(
			"href",
			"https://facebook.com/shizuoka_fb",
		);

		const line = screen.getByLabelText("LINEで見る");
		expect(line).toHaveAttribute("href", "https://line.me/shizuoka_line");
	});

	it("各SNSリンクにアカウント名テキスト（@xxx）を表示しない", () => {
		render(<TopTab bar={snsBar} />);

		expect(screen.queryByText("@shizuoka_beer")).not.toBeInTheDocument();
		expect(screen.queryByText("@shizuoka_x")).not.toBeInTheDocument();
		expect(screen.queryByText("@shizuoka_fb")).not.toBeInTheDocument();
		expect(screen.queryByText("@shizuoka_line")).not.toBeInTheDocument();
	});

	it("未設定のSNSはリンク自体を表示しない", () => {
		render(<TopTab bar={{ ...baseBar, instagramUrl: null }} />);

		expect(screen.queryByLabelText("Instagramで見る")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("Xで見る")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("Facebookで見る")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("LINEで見る")).not.toBeInTheDocument();
	});
});
