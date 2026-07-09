// @ts-nocheck
import { beforeEach, describe, it, jest } from "@jest/globals";
import { createSettingsSlice } from "../../../src/stores/slices/settingsSlice";

jest.mock("../../../src/services/killer", () => ({
	killerService: {
		setQuickActionNotification: jest.fn(),
		setAutoHibernationConfig: jest.fn(),
	},
	setKillerMode: jest.fn(),
	setGeekOptions: jest.fn(),
	setHibernationOptions: jest.fn(),
	setProOptions: jest.fn(),
}));

describe("settingsSlice", () => {
	let set: any;
	let get: any;
	let slice: any;
	let state: any;

	beforeEach(() => {
		state = {
			settings: {},
			apps: [{ isSelected: true }],
		};
		set = jest.fn((updater) => {
			if (typeof updater === "function") {
				state = { ...state, ...updater(state) };
			} else {
				state = { ...state, ...updater };
			}
		});
		get = jest.fn(() => state);
		slice = createSettingsSlice(set, get);
	});

	it("setCurrentScreen", () => slice.setCurrentScreen("settings"));
	it("setSettingsScrollY", () => slice.setSettingsScrollY(100));

	it("updateSetting workingMode", () => {
		slice.updateSetting("workingMode", "root");
	});

	it("updateSetting quickActionNotif", () => {
		slice.updateSetting("quickActionNotif", true);
	});

	it("updateSetting other", () => {
		slice.updateSetting("smartHibernation", false);
	});

	it("toggleShowSystemApps", () => slice.toggleShowSystemApps());

	it("setHydrated false", () => slice.setHydrated(false));

	it("setHydrated true without settings", () => {
		state.settings = {};
		slice.setHydrated(true);
	});

	it("setHydrated true with full settings", () => {
		state.settings = {
			workingMode: "root",
			quickActionNotif: true,
			aggressiveDoze: true,
			smartHibernation: true,
			phantomSlayer: true,
		};
		slice.setHydrated(true);
	});

	it("completeOnboarding", () => slice.completeOnboarding());

	it("resetOnboarding", () => slice.resetOnboarding());
});
