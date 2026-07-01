import { describe, expect, it, vi } from "vitest";
import { requestUserLocation } from "./user-location";

function makeGeolocation(
	behavior: (success: PositionCallback, error: PositionErrorCallback) => void,
): Geolocation {
	return {
		getCurrentPosition: vi.fn(behavior),
		watchPosition: vi.fn(),
		clearWatch: vi.fn(),
	} as unknown as Geolocation;
}

describe("requestUserLocation", () => {
	it("geolocation が undefined のときは何もしない（getCurrentPosition を呼ばない）", () => {
		const onSuccess = vi.fn();
		const onError = vi.fn();

		requestUserLocation(undefined, onSuccess, onError);

		expect(onSuccess).not.toHaveBeenCalled();
		expect(onError).not.toHaveBeenCalled();
	});

	it("getCurrentPosition を1回だけ呼び、取得座標を onSuccess に渡す", () => {
		const geolocation = makeGeolocation((success) => {
			success({
				coords: { latitude: 35.6812, longitude: 139.7671 },
			} as GeolocationPosition);
		});
		const onSuccess = vi.fn();

		requestUserLocation(geolocation, onSuccess);

		expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
		expect(onSuccess).toHaveBeenCalledTimes(1);
		expect(onSuccess).toHaveBeenCalledWith({ lat: 35.6812, lng: 139.7671 });
	});

	it("取得失敗時は onError を呼び、onSuccess は呼ばない", () => {
		const geolocationError = {
			code: 1,
			message: "denied",
		} as GeolocationPositionError;
		const geolocation = makeGeolocation((_success, error) => {
			error(geolocationError);
		});
		const onSuccess = vi.fn();
		const onError = vi.fn();
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		requestUserLocation(geolocation, onSuccess, onError);

		expect(onSuccess).not.toHaveBeenCalled();
		expect(onError).toHaveBeenCalledTimes(1);
		expect(onError).toHaveBeenCalledWith(geolocationError);
		warnSpy.mockRestore();
	});

	it("onError 省略時でも取得失敗でクラッシュしない", () => {
		const geolocation = makeGeolocation((_success, error) => {
			error({ code: 1, message: "denied" } as GeolocationPositionError);
		});
		const onSuccess = vi.fn();
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		expect(() => requestUserLocation(geolocation, onSuccess)).not.toThrow();
		expect(onSuccess).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});
});
