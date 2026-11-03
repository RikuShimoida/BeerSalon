import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MapErrorBoundary } from "./map-error-boundary";

function ThrowOnRender(): never {
	throw new Error("描画中の失敗");
}

function ThrowInEffect() {
	useEffect(() => {
		throw new Error("エフェクト内の失敗");
	}, []);
	return <p>地図本体</p>;
}

describe("MapErrorBoundary", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("子が例外を投げなければ子をそのまま表示し、差し替え表示は出さない", () => {
		render(
			<MapErrorBoundary fallback={<p>地図を表示できませんでした</p>}>
				<p>地図本体</p>
			</MapErrorBoundary>,
		);

		expect(screen.getByText("地図本体")).toBeInTheDocument();
		expect(
			screen.queryByText("地図を表示できませんでした"),
		).not.toBeInTheDocument();
	});

	it("子が描画中に例外を投げたら差し替え表示を出す", () => {
		render(
			<MapErrorBoundary fallback={<p>地図を表示できませんでした</p>}>
				<ThrowOnRender />
			</MapErrorBoundary>,
		);

		expect(screen.getByText("地図を表示できませんでした")).toBeInTheDocument();
	});

	it("子がエフェクト内で例外を投げても（Google 地図のピン描画失敗と同じ経路）差し替え表示に切り替わる", () => {
		render(
			<MapErrorBoundary fallback={<p>地図を表示できませんでした</p>}>
				<ThrowInEffect />
			</MapErrorBoundary>,
		);

		expect(screen.getByText("地図を表示できませんでした")).toBeInTheDocument();
		expect(screen.queryByText("地図本体")).not.toBeInTheDocument();
	});

	it("例外は枠の外に広がらず、枠の外の兄弟要素は表示されたまま残る", () => {
		render(
			<div>
				<MapErrorBoundary fallback={<p>地図を表示できませんでした</p>}>
					<ThrowInEffect />
				</MapErrorBoundary>
				<p>店舗一覧</p>
			</div>,
		);

		expect(screen.getByText("地図を表示できませんでした")).toBeInTheDocument();
		expect(screen.getByText("店舗一覧")).toBeInTheDocument();
	});
});
