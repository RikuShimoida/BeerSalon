import { render, screen } from "@testing-library/react";
import { type ReactNode, useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BarSummary } from "@/components/bar/bar-summary";
import { GoogleMap } from "./google-map";

const mapBehavior = vi.hoisted(() => ({ shouldFail: false }));

// Why not 本物の @vis.gl/react-google-maps: jsdom では Google のスクリプトを読み込めず、
// 地図生成の失敗を決まった形で起こせない。地図生成（useEffect 内）だけを差し替える。
vi.mock("@vis.gl/react-google-maps", () => ({
	APIProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
	Map: ({ children }: { children: ReactNode }) => {
		useEffect(() => {
			if (mapBehavior.shouldFail) {
				throw new Error("Cannot read properties of undefined (reading 'keys')");
			}
		}, []);
		return <div data-testid="google-map">{children}</div>;
	},
	AdvancedMarker: () => null,
	InfoWindow: () => null,
	useMap: () => null,
}));

const bars: BarSummary[] = [
	{
		id: "100002",
		name: "E2Eテストバー東京",
		prefecture: "東京都",
		city: "渋谷区",
		latitude: "35.6595",
		longitude: "139.7005",
	},
];

describe("GoogleMap", () => {
	beforeEach(() => {
		mapBehavior.shouldFail = false;
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it("地図の生成が失敗したら、地図の枠に「地図を表示できませんでした」と一覧への案内を出す", () => {
		vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "test-key");
		mapBehavior.shouldFail = true;

		render(<GoogleMap bars={bars} />);

		expect(screen.getByText("地図を表示できませんでした")).toBeInTheDocument();
		expect(screen.getByText("お店は一覧から探せます")).toBeInTheDocument();
		expect(screen.queryByTestId("google-map")).not.toBeInTheDocument();
	});

	it("地図の生成が成功したら地図を表示し、失敗時の表示は出さない", () => {
		vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "test-key");

		render(<GoogleMap bars={bars} />);

		expect(screen.getByTestId("google-map")).toBeInTheDocument();
		expect(
			screen.queryByText("地図を表示できませんでした"),
		).not.toBeInTheDocument();
	});

	it("APIキーが未設定なら、失敗時の表示ではなくキー未設定の案内を出す", () => {
		vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");

		render(<GoogleMap bars={bars} />);

		expect(
			screen.getByText("Google Maps APIキーが設定されていません"),
		).toBeInTheDocument();
		expect(
			screen.queryByText("地図を表示できませんでした"),
		).not.toBeInTheDocument();
	});
});
