import { afterEach, describe, expect, it, jest } from "@jest/globals";

describe("NativeKillerModule", () => {
	afterEach(() => {
		jest.resetModules();
	});

	it("should export NativeKiller when OS is android", () => {
		jest.mock("react-native", () => ({
			Platform: { OS: "android" },
			NativeModules: { CoreKillerModule: {} },
		}));
		const {
			NativeKiller,
		} = require("../../../src/services/killer/NativeKillerModule");
		expect(NativeKiller).toBeDefined();
	});

	it("should export null when OS is not android", () => {
		jest.mock("react-native", () => ({
			Platform: { OS: "ios" },
			NativeModules: { CoreKillerModule: {} },
		}));
		const {
			NativeKiller,
		} = require("../../../src/services/killer/NativeKillerModule");
		expect(NativeKiller).toBeNull();
	});
});
