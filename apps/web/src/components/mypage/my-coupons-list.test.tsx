import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MyCouponsList } from "./my-coupons-list";

vi.mock("@/actions/coupon", () => ({
	redeemCoupon: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

const baseCoupon = {
	id: "1",
	title: "生ビール1杯無料",
	description: "ご来店時に提示してください",
	barName: "テストバー",
	validFrom: null,
	validUntil: null,
	usageLimit: null,
	usedCount: 0,
	isUsed: false,
};

describe("MyCouponsList", () => {
	it("0件時は空状態メッセージを表示する", () => {
		render(<MyCouponsList coupons={[]} />);

		expect(
			screen.getByText("取得済みのクーポンはありません"),
		).toBeInTheDocument();
	});

	it("利用可能なクーポンは活性の利用ボタンを表示する", () => {
		render(<MyCouponsList coupons={[baseCoupon]} />);

		const button = screen.getByRole("button", { name: "クーポンを利用する" });
		expect(button).toBeEnabled();
	});

	it("使用済みクーポンは利用ボタンを表示せず「使用済み」バッジを表示する", () => {
		render(<MyCouponsList coupons={[{ ...baseCoupon, isUsed: true }]} />);

		expect(screen.getByText("使用済み")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "クーポンを利用する" }),
		).not.toBeInTheDocument();
	});

	it("有効期限外（開始前）のクーポンはボタンが非活性で「有効期限外」を表示する", () => {
		const future = new Date();
		future.setFullYear(future.getFullYear() + 1);
		render(<MyCouponsList coupons={[{ ...baseCoupon, validFrom: future }]} />);

		const button = screen.getByRole("button", { name: "有効期限外" });
		expect(button).toBeDisabled();
	});

	it("有効期限外（終了後）のクーポンはボタンが非活性で「有効期限外」を表示する", () => {
		const past = new Date();
		past.setFullYear(past.getFullYear() - 1);
		render(<MyCouponsList coupons={[{ ...baseCoupon, validUntil: past }]} />);

		const button = screen.getByRole("button", { name: "有効期限外" });
		expect(button).toBeDisabled();
	});

	it("利用上限到達のクーポンはボタンが非活性で「利用上限に達しています」を表示する", () => {
		render(
			<MyCouponsList
				coupons={[{ ...baseCoupon, usageLimit: 5, usedCount: 5 }]}
			/>,
		);

		const button = screen.getByRole("button", {
			name: "利用上限に達しています",
		});
		expect(button).toBeDisabled();
	});
});
