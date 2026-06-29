import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { uploadMenuImage } from "@/lib/menu-image-upload";

function makeFile(): File {
	return new File(["dummy"], "menu.png", { type: "image/png" });
}

describe("uploadMenuImage", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("アップロード成功時は ok:true と公開URLを返す", async () => {
		const fetchMock = vi.mocked(fetch);
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ url: "https://example.com/menu.png" }), {
				status: 200,
			}),
		);

		const result = await uploadMenuImage("42", makeFile(), "beer-menu");

		expect(result).toEqual({ ok: true, url: "https://example.com/menu.png" });
	});

	it("成功レスポンスに url が無い場合は ok:true / url:null を返す", async () => {
		const fetchMock = vi.mocked(fetch);
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({}), { status: 200 }),
		);

		const result = await uploadMenuImage("42", makeFile(), "food-menu");

		expect(result).toEqual({ ok: true, url: null });
	});

	it("正しいエンドポイントへ file / type を FormData で POST する", async () => {
		const fetchMock = vi.mocked(fetch);
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ url: "https://example.com/menu.png" }), {
				status: 200,
			}),
		);

		const file = makeFile();
		await uploadMenuImage("7", file, "beer-menu");

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe("/api/bars/7/media");
		expect(init?.method).toBe("POST");
		const body = init?.body as FormData;
		expect(body).toBeInstanceOf(FormData);
		expect(body.get("file")).toBe(file);
		expect(body.get("type")).toBe("beer-menu");
	});

	it("アップロード失敗時はレスポンスの error 文言を ok:false で返す", async () => {
		const fetchMock = vi.mocked(fetch);
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({ error: "ファイルサイズは5MB以下にしてください" }),
				{
					status: 400,
				},
			),
		);

		const result = await uploadMenuImage("42", makeFile(), "food-menu");

		expect(result).toEqual({
			ok: false,
			error: "ファイルサイズは5MB以下にしてください",
		});
	});

	it("失敗レスポンスに error が無い場合は既定文言で ok:false を返す", async () => {
		const fetchMock = vi.mocked(fetch);
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({}), { status: 500 }),
		);

		const result = await uploadMenuImage("42", makeFile(), "beer-menu");

		expect(result).toEqual({
			ok: false,
			error: "画像のアップロードに失敗しました",
		});
	});
});
