import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventsTab } from "./events-tab";

vi.mock("next/image", () => ({
	default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
		// biome-ignore lint/performance/noImgElement: テスト用next/imageモック
		<img {...props} alt={props.alt} />
	),
}));

const baseEvent = {
	id: "1",
	title: "クラフトビール祭り",
	description: "地元のブルワリーが集まるイベントです",
	startDate: new Date("2026-07-01T18:00:00+09:00"),
	endDate: new Date("2026-07-01T22:00:00+09:00"),
	imageUrl: "/images/event1.jpg",
};

describe("EventsTab", () => {
	describe("イベントが0件の場合", () => {
		it("空状態メッセージが表示される", () => {
			render(<EventsTab events={[]} />);
			expect(
				screen.getByText("イベントはまだ登録されていません。"),
			).toBeInTheDocument();
		});
	});

	describe("イベントが存在する場合", () => {
		it("イベントタイトルが表示される", () => {
			render(<EventsTab events={[baseEvent]} />);
			expect(screen.getByText("クラフトビール祭り")).toBeInTheDocument();
		});

		it("イベント説明が表示される", () => {
			render(<EventsTab events={[baseEvent]} />);
			expect(
				screen.getByText("地元のブルワリーが集まるイベントです"),
			).toBeInTheDocument();
		});

		it("開始日時が表示される", () => {
			render(<EventsTab events={[baseEvent]} />);
			expect(screen.getByText(/開始:/)).toBeInTheDocument();
		});

		it("終了日時が表示される", () => {
			render(<EventsTab events={[baseEvent]} />);
			expect(screen.getByText(/終了:/)).toBeInTheDocument();
		});

		it("画像が表示される", () => {
			render(<EventsTab events={[baseEvent]} />);
			const img = screen.getByAltText("クラフトビール祭り");
			expect(img).toBeInTheDocument();
		});

		it("descriptionがnullの場合は説明が表示されない", () => {
			const event = { ...baseEvent, description: null };
			render(<EventsTab events={[event]} />);
			expect(
				screen.queryByText("地元のブルワリーが集まるイベントです"),
			).not.toBeInTheDocument();
		});

		it("endDateがnullの場合は終了日時が表示されない", () => {
			const event = { ...baseEvent, endDate: null };
			render(<EventsTab events={[event]} />);
			expect(screen.queryByText(/終了:/)).not.toBeInTheDocument();
		});

		it("imageUrlがnullの場合は画像が表示されない", () => {
			const event = { ...baseEvent, imageUrl: null };
			render(<EventsTab events={[event]} />);
			expect(
				screen.queryByAltText("クラフトビール祭り"),
			).not.toBeInTheDocument();
		});

		it("日付が文字列で渡されても正しく表示される", () => {
			const event = {
				...baseEvent,
				startDate: "2026-07-01T09:00:00.000Z",
				endDate: "2026-07-01T13:00:00.000Z",
			};
			render(<EventsTab events={[event]} />);
			expect(screen.getByText(/開始:/)).toBeInTheDocument();
			expect(screen.getByText(/終了:/)).toBeInTheDocument();
		});

		it("複数イベントが表示される", () => {
			const events = [
				baseEvent,
				{
					...baseEvent,
					id: "2",
					title: "IPA特集ナイト",
				},
			];
			render(<EventsTab events={events} />);
			expect(screen.getByText("クラフトビール祭り")).toBeInTheDocument();
			expect(screen.getByText("IPA特集ナイト")).toBeInTheDocument();
		});
	});
});
