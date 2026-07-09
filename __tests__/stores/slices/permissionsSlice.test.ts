// @ts-nocheck
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { killerService } from "../../../src/services/killer";
import { createPermissionsSlice } from "../../../src/stores/slices/permissionsSlice";

jest.mock("../../../src/services/killer", () => ({
	killerService: {
		checkBinder: jest.fn(),
		checkPermission: jest.fn(),
		requestPermission: jest.fn(),
		checkRootAccess: jest.fn(),
	},
	setKillerMode: jest.fn(),
}));

jest.useFakeTimers();

describe("permissionsSlice", () => {
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
		slice = createPermissionsSlice(set, get);
		state = {
			...slice,
			settings: { workingMode: "shizuku" },
			apps: [],
			fetchApps: jest.fn().mockResolvedValue(true),
			requestShizukuPermission: jest.fn(),
		};
		jest.clearAllMocks();
	});

	// --- checkWorkingModeStatus ---
	it("checkWorkingModeStatus root", async () => {
		state.settings.workingMode = "root";
		killerService.checkRootAccess.mockResolvedValueOnce(true);
		const res = await slice.checkWorkingModeStatus();
		expect(res).toBe(true);
	});

	it("checkWorkingModeStatus shizuku no binder", async () => {
		killerService.checkBinder.mockResolvedValueOnce(false);
		const res = await slice.checkWorkingModeStatus();
		expect(res).toBe(false);
	});

	it("checkWorkingModeStatus shizuku binder no perm", async () => {
		killerService.checkBinder.mockResolvedValueOnce(true);
		killerService.checkPermission.mockResolvedValueOnce(false);
		const res = await slice.checkWorkingModeStatus();

		jest.advanceTimersByTime(400); // trigger timeout
		expect(state.requestShizukuPermission).toHaveBeenCalled();
		expect(res).toBe(false);
	});

	it("checkWorkingModeStatus shizuku full success with existing apps", async () => {
		state.apps = [{}];
		killerService.checkBinder.mockResolvedValueOnce(true);
		killerService.checkPermission.mockResolvedValueOnce(true);
		const res = await slice.checkWorkingModeStatus();
		expect(res).toBe(true);
	});

	// --- checkShizukuStatus ---
	it("checkShizukuStatus no binder", async () => {
		killerService.checkBinder.mockResolvedValueOnce(false);
		await slice.checkShizukuStatus();
	});

	it("checkShizukuStatus binder yes apps length > 0", async () => {
		state.apps = [{}];
		killerService.checkBinder.mockResolvedValueOnce(true);
		killerService.checkPermission.mockResolvedValueOnce(true);
		await slice.checkShizukuStatus();
	});

	// --- requestShizukuPermission ---
	it("requestShizukuPermission success", async () => {
		killerService.requestPermission.mockResolvedValueOnce(true);
		await slice.requestShizukuPermission();
	});

	it("requestShizukuPermission catch", async () => {
		killerService.requestPermission.mockRejectedValueOnce(new Error("fail"));
		await slice.requestShizukuPermission();
	});

	// --- checkRootStatus ---
	it("checkRootStatus", async () => {
		killerService.checkRootAccess.mockResolvedValueOnce(true);
		await slice.checkRootStatus();
	});
});
