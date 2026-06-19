import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormError } from "./form-error";

describe("FormError", () => {
	it("children を渡すとメッセージが表示される", () => {
		render(<FormError>エラーが発生しました</FormError>);

		expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
	});

	it("role='alert' を持つ", () => {
		render(<FormError>エラーが発生しました</FormError>);

		expect(screen.getByRole("alert")).toHaveTextContent("エラーが発生しました");
	});

	it("children が空文字のとき何もレンダリングしない", () => {
		const { container } = render(<FormError>{""}</FormError>);

		expect(container).toBeEmptyDOMElement();
	});

	it("className 指定でクラスが追加される", () => {
		render(<FormError className="mt-4">エラー</FormError>);

		expect(screen.getByRole("alert")).toHaveClass("mt-4");
	});
});
