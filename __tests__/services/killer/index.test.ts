// @ts-nocheck
import { describe, it, jest } from "@jest/globals";
import {
	checkBatteryOptimization,
	freezeQuarantinePackage,
	getImpactAnalytics,
	getQuarantinePackages,
	getResurrectionDetectiveReport,
	killerService,
	requestBatteryOptimization,
	setGeekOptions,
	setHibernationOptions,
	setKillerMode,
	setProOptions,
	showNativeTimePicker,
} from "../../../src/services/killer/index";

jest.mock("../../../src/services/killer/NativeKillerModule", () => ({
	NativeKiller: {
		checkBinder: jest.fn().mockResolvedValue(true),
		checkPermission: jest.fn().mockResolvedValue(true),
		requestPermission: jest.fn().mockResolvedValue(true),
		getInstalledApps: jest
			.fn()
			.mockResolvedValue([{ packageName: "com.test", appName: "Test" }]),
		killApps: jest.fn().mockResolvedValue({ success: [], failed: [] }),
		setAutoHibernationConfig: jest.fn(),
		setQuickActionNotification: jest.fn(),
		checkInitialQuickFreeze: jest.fn().mockResolvedValue(true),
		checkRootAccess: jest.fn().mockResolvedValue(true),
		setWorkingMode: jest.fn(),
		setGeekOptions: jest.fn(),
		setHibernationOptions: jest.fn(),
		isIgnoringBatteryOptimizations: jest.fn().mockResolvedValue(true),
		requestIgnoreBatteryOptimizations: jest.fn().mockResolvedValue(true),
		setProOptions: jest.fn(),
		freezeQuarantinePackage: jest
			.fn()
			.mockResolvedValue({ success: true, errorCode: "" }),
		getQuarantinePackages: jest.fn().mockResolvedValue(["com.test"]),
		getImpactAnalytics: jest.fn().mockResolvedValue({}),
		getResurrectionDetectiveReport: jest.fn().mockResolvedValue([]),
		showTimePicker: jest.fn().mockResolvedValue(60),
		getConstants: jest.fn().mockReturnValue({ CRITICAL_PACKAGES: ["test"] }),
	},
}));

describe("Killer Service", () => {
	it("covers killerService methods", async () => {
		await killerService.checkBinder();
		await killerService.checkPermission();
		await killerService.requestPermission();
		await killerService.getInstalledApps();
		await killerService.killApps(["com.test"]);
		killerService.setAutoHibernationConfig(true, ["com.test"]);
		killerService.setQuickActionNotification(true);
		await killerService.checkInitialQuickFreeze();
		await killerService.checkRootAccess();
	});

	it("covers exported functions", async () => {
		setKillerMode("shizuku");
		setGeekOptions(true, true, true);
		setHibernationOptions(true, true, true, true, true, true);
		await checkBatteryOptimization();
		await requestBatteryOptimization();
		setProOptions({ phantomSlayer: true });
		await freezeQuarantinePackage("com.test", true);
		await getQuarantinePackages();
		await getImpactAnalytics();
		await getResurrectionDetectiveReport();
		await showNativeTimePicker(120);
	});
});

describe("Killer Service without NativeKiller", () => {
	it("handles missing NativeKiller methods", async () => {
		const _NativeKiller =
			require("../../../src/services/killer/NativeKillerModule").NativeKiller;
		const oldCheck = _NativeKiller.checkInitialQuickFreeze;
		_NativeKiller.checkInitialQuickFreeze = undefined;
		await killerService.checkInitialQuickFreeze();

		const oldFreeze = _NativeKiller.freezeQuarantinePackage;
		_NativeKiller.freezeQuarantinePackage = undefined;
		await freezeQuarantinePackage("com.test", true);

		const oldTime = _NativeKiller.showTimePicker;
		_NativeKiller.showTimePicker = undefined;
		await showNativeTimePicker(120);

		_NativeKiller.showTimePicker = jest
			.fn()
			.mockRejectedValue(new Error("fail"));
		await showNativeTimePicker(120);

		// Restore
		_NativeKiller.checkInitialQuickFreeze = oldCheck;
		_NativeKiller.freezeQuarantinePackage = oldFreeze;
		_NativeKiller.showTimePicker = oldTime;
	});
});
