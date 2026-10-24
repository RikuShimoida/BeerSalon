import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationCard } from "./notification-card";

vi.mock("@/actions/notification", () => ({
	markNotificationAsRead: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn() }),
}));

const NOW = new Date("2026-07-19T12:00:00Z");

const baseProps = {
	id: "notification-1",
	type: "post_liked",
	title: "いいねされました",
	message: "たろうさんがあなたの投稿にいいねしました",
	linkUrl: "/timeline",
	isRead: false,
};

// Why not props で now を注入するか: NotificationCard は表示専用で now を受け取らず、
// 注入用の props を増やすと本番コードにテスト都合の口を開けることになるため、
// システム時刻の固定で決定的にする。
beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(NOW);
});

afterEach(() => {
	vi.useRealTimers();
});

describe("NotificationCard", () => {
	describe("正常系 - 相対時刻の表示", () => {
		it("7日未満は相対表記（3日前）を表示する", () => {
			render(
				<NotificationCard
					{...baseProps}
					createdAt={new Date("2026-07-16T12:00:00Z")}
				/>,
			);

			expect(screen.getByText("3日前")).toBeInTheDocument();
		});

		it("7日を超えると日数表記ではなく日付表記にフォールバックする", () => {
			render(
				<NotificationCard
					{...baseProps}
					createdAt={new Date("2026-07-10T12:00:00Z")}
				/>,
			);

			expect(screen.getByText("2026/7/10")).toBeInTheDocument();
			expect(screen.queryByText("9日前")).not.toBeInTheDocument();
		});

		it("6日は境界内のため相対表記のままにする", () => {
			render(
				<NotificationCard
					{...baseProps}
					createdAt={new Date("2026-07-13T12:00:00Z")}
				/>,
			);

			expect(screen.getByText("6日前")).toBeInTheDocument();
		});

		it("7日超かつ JST 早朝のデータで日付が前日に巻き戻らない", () => {
			// JST 2026-07-10 08:00（= UTC 07-09 23:00）。TZ 指定が漏れると 2026/7/9 になる。
			render(
				<NotificationCard
					{...baseProps}
					createdAt={new Date("2026-07-10T08:00:00+09:00")}
				/>,
			);

			expect(screen.getByText("2026/7/10")).toBeInTheDocument();
		});
	});

	describe("正常系 - 基本表示", () => {
		it("タイトルと本文を表示する", () => {
			render(
				<NotificationCard
					{...baseProps}
					createdAt={new Date("2026-07-19T11:00:00Z")}
				/>,
			);

			expect(screen.getByText("いいねされました")).toBeInTheDocument();
			expect(
				screen.getByText("たろうさんがあなたの投稿にいいねしました"),
			).toBeInTheDocument();
			expect(screen.getByText("1時間前")).toBeInTheDocument();
		});
	});
});
