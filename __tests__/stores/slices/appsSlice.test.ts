// @ts-nocheck
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { killerService } from "../../../src/services/killer";
import { createAppsSlice } from "../../../src/stores/slices/appsSlice";

jest.mock("../../../src/services/killer", () => ({
	killerService: {
		getInstalledApps: jest.fn().mockResolvedValue([
			{ packageName: "com.test", appName: "Test" },
			{ packageName: "com.android.systemui", appName: "Sys" },
		]),
		killApps: jest
			.fn()
			.mockResolvedValue({ success: ["com.test"], failed: [] }),
	},
	CRITICAL_PACKAGES: new Set(["com.android.systemui"]),
}));

describe("appsSlice", () => {
	let state: any;
	let slice: any;
	const set = jest.fn((fn) => {
		if (typeof fn === "function") {
			state = { ...state, ...fn(state) };
		} else {
			state = { ...state, ...fn };
		}
	});
	const get = jest.fn(() => state);

	beforeEach(() => {
		slice = createAppsSlice(set, get);
		state = {
			...slice,
			apps: [
				{
					packageName: "com.test",
					appName: "Test",
					isSelected: false,
					isSystemApp: false,
					isStopped: false,
				},
				{
					packageName: "com.test2",
					appName: "Test2",
					isSelected: false,
					isSystemApp: false,
					isStopped: false,
				},
				{
					packageName: "com.android.systemui",
					appName: "Sys",
					isSelected: false,
					isSystemApp: true,
					isStopped: false,
				},
			],
			hibernationList: ["com.test"],
			settings: {
				workingMode: "shizuku",
				ignoreBackgroundFree: false,
				smartHibernation: false,
			},
			permissions: { isPermissionGranted: true },
			showSystemApps: true,
		};
		jest.clearAllMocks();
	});

	// --- killHibernationApps ---
	it("killHibernationApps success", async () => {
		await slice.killHibernationApps();
	});

	it("killHibernationApps empty", async () => {
		state.hibernationList = [];
		await slice.killHibernationApps();
	});

	it("killHibernationApps smartHibernation critical", async () => {
		state.hibernationList = ["com.android.systemui"];
		state.settings.smartHibernation = true;
		await slice.killHibernationApps();
	});

	it("killHibernationApps ignoreBackgroundFree all skipped", async () => {
		state.settings.ignoreBackgroundFree = true;
		state.apps[0].isStopped = true;
		await slice.killHibernationApps();
	});

	it("killHibernationApps ignoreBackgroundFree partial skip", async () => {
		state.settings.ignoreBackgroundFree = true;
		state.hibernationList = ["com.test", "com.test2"];
		state.apps[0].isStopped = true;
		state.apps[1].isStopped = false;
		await slice.killHibernationApps();
	});

	it("killHibernationApps catch", async () => {
		killerService.killApps.mockRejectedValueOnce(new Error("fail"));
		await slice.killHibernationApps();
	});

	it("killHibernationApps catch root mode", async () => {
		state.settings.workingMode = "root";
		killerService.killApps.mockRejectedValueOnce(new Error("fail"));
		await slice.killHibernationApps();
	});

	// --- killSelectedApps ---
	it("killSelectedApps empty", async () => {
		await slice.killSelectedApps();
	});

	it("killSelectedApps success", async () => {
		state.apps[0].isSelected = true;
		await slice.killSelectedApps();
	});

	it("killSelectedApps smartHibernation critical", async () => {
		state.apps[2].isSelected = true; // com.android.systemui
		state.settings.smartHibernation = true;
		await slice.killSelectedApps();
	});

	it("killSelectedApps ignoreBackgroundFree", async () => {
		state.apps[0].isSelected = true;
		state.apps[1].isSelected = true;
		state.apps[0].isStopped = true;
		state.settings.ignoreBackgroundFree = true;
		await slice.killSelectedApps();
	});

	it("killSelectedApps ignoreBackgroundFree all skipped", async () => {
		state.apps[0].isSelected = true;
		state.apps[0].isStopped = true;
		state.settings.ignoreBackgroundFree = true;
		await slice.killSelectedApps();
	});

	it("killSelectedApps ignoreBackgroundFree partial skip", async () => {
		state.settings.ignoreBackgroundFree = true;
		state.apps[0].isSelected = true;
		state.apps[1].isSelected = true;
		state.apps[0].isStopped = true;
		state.apps[1].isStopped = false;
		await slice.killSelectedApps();
	});

	it("killSelectedApps catch", async () => {
		state.apps[0].isSelected = true;
		killerService.killApps.mockRejectedValueOnce(new Error("fail"));
		await slice.killSelectedApps();
	});

	// --- killSingleApp ---
	it("killSingleApp success", async () => {
		await slice.killSingleApp("com.test");
	});

	it("killSingleApp catch", async () => {
		killerService.killApps.mockRejectedValueOnce(new Error("fail"));
		await slice.killSingleApp("com.test");
	});

	// --- fetchApps ---
	it("fetchApps", async () => {
		await slice.fetchApps();
	});

	it("fetchApps with selected and critical hibernation", async () => {
		state.apps[0].isSelected = true;
		state.hibernationList = ["com.android.systemui"]; // critical
		killerService.getInstalledApps.mockResolvedValueOnce([
			{ packageName: "com.test", appName: "Test" },
			{ packageName: "com.android.systemui", appName: "Sys" },
		] as any);
		await slice.fetchApps();
	});

	it("fetchApps catch", async () => {
		killerService.getInstalledApps.mockRejectedValueOnce(new Error("fail"));
		await slice.fetchApps();
	});

	// --- Others ---
	it("toggleSelectApp", () => {
		slice.toggleSelectApp("com.test");
	});

	it("selectAll avoiding system apps", () => {
		state.showSystemApps = false;
		slice.selectAll(true);
		expect(
			state.apps.find((a: any) => a.packageName === "com.android.systemui")
				.isSelected,
		).toBe(false);
	});

	it("selectAll false", () => {
		slice.selectAll(false);
	});

	it("clearKillMessage", () => {
		slice.clearKillMessage();
	});

	it("addSelectedToHibernation", () => {
		state.apps[0].isSelected = true;
		slice.addSelectedToHibernation();
	});

	it("removeFromHibernation", () => {
		slice.removeFromHibernation("com.test");
	});

	it("setWebviewModalVisible", () => {
		slice.setWebviewModalVisible(true);
		expect(state.webviewModalVisible).toBe(true);
	});
});
