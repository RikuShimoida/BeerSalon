import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FavoriteBarsClient } from "./favorite-bars-client";

vi.mock("@/actions/bar", () => ({
	removeFavoriteBar: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

const sampleFavorite = {
	id: "fav-1",
	createdAt: new Date(),
	bar: {
		id: "bar-1",
		name: "テストバー",
		prefecture: "静岡県",
		city: "静岡市",
		images: [],
	},
};

describe("FavoriteBarsClient", () => {
	it("0件時は空状態と「お店をさがす」導線を表示する", () => {
		render(<FavoriteBarsClient initialFavorites={[]} />);

		expect(screen.getByText("まだお気に入りがありません")).toBeInTheDocument();

		const link = screen.getByRole("link", { name: "お店をさがす" });
		expect(link).toHaveAttribute("href", "/");
	});

	it("お気に入りがある場合は店舗カードを表示する", () => {
		render(<FavoriteBarsClient initialFavorites={[sampleFavorite]} />);

		expect(screen.getByText("テストバー")).toBeInTheDocument();
		expect(
			screen.queryByText("まだお気に入りがありません"),
		).not.toBeInTheDocument();
	});
});
