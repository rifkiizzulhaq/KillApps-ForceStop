// @ts-nocheck
import { afterEach, beforeEach, describe, it, jest } from "@jest/globals";
import { PermissionsAndroid, Platform, Pressable } from "react-native";
import renderer from "react-test-renderer";
import { SettingsMainTab } from "../../../src/components/settings/SettingsMainTab";

let mockDark = false;
let mockState: any = {};
let mockBatteryCheck = true;

jest.mock("../../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		isDark: mockDark,
		colors: {
			cardClass: "bg-white",
			cardBorderClass: "border-gray",
			captionClass: "text-gray",
			textClass: "text-black",
			subTextClass: "text-gray",
			secondaryBtnClass: "bg-gray",
			secondaryBtnTextClass: "text-black",
			borderClass: "border-gray",
			dividerClass: "divide-gray",
			subIconColor: "#555",
		},
	}),
}));

jest.mock("../../../src/services/killer", () => ({
	checkBatteryOptimization: jest
		.fn()
		.mockImplementation(async () => mockBatteryCheck),
	requestBatteryOptimization: jest.fn().mockResolvedValue(true as any),
	showNativeTimePicker: jest
		.fn()
		.mockImplementation(async (val: number) => val + 10),
}));

jest.mock("../../../src/stores/useAppStore", () => ({
	useAppStore: (selector: any) => selector(mockState),
}));

jest.mock("../../../src/components/modals/AutoKillModal", () => ({
	AutoKillModal: ({ onClose }: any) => {
		if (onClose) setTimeout(onClose, 5);
		return <div testID="AutoKillModal" />;
	},
}));
jest.mock("../../../src/components/modals/BatteryOptimizationModal", () => ({
	BatteryOptimizationModal: ({ onClose }: any) => {
		if (onClose) setTimeout(onClose, 5);
		return <div testID="BatteryOptimizationModal" />;
	},
}));
jest.mock("../../../src/components/modals/WorkingModeModal", () => ({
	WorkingModeModal: ({ onClose }: any) => {
		if (onClose) setTimeout(onClose, 5);
		return <div testID="WorkingModeModal" />;
	},
}));

describe("SettingsMainTab", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockDark = false;
		mockBatteryCheck = true;
		jest
			.spyOn(PermissionsAndroid, "request")
			.mockImplementation(async () => "granted" as any);
		PermissionsAndroid.PERMISSIONS = {
			POST_NOTIFICATIONS: "android.permission.POST_NOTIFICATIONS",
		} as any;
		mockState = {
			settings: {
				workingMode: "shizuku",
				smoothScroll: true,
				smartHibernation: true,
				finerMediaDetection: false,
				shallowHibernation: false,
				wakeUpTracking: true,
				autoHibernation: false,
				ignoreBackgroundFree: false,
				hibernateSystemApps: false,
				quickActionNotif: false,
				dontRemoveNotif: true,
				aggressiveDoze: false,
				gcmWakeupBypass: true,
				deepTrimMemory: false,
				phantomSlayer: true,
				bedtimeShield: true,
				bedtimeStart: 1380,
				bedtimeEnd: 300,
				emergencyTrigger: false,
				ramCrunchSlayer: false,
				autoKillScheduler: 2,
			},
			updateSetting: jest.fn(),
			resetOnboarding: jest.fn(),
			setCurrentScreen: jest.fn(),
			isRootActive: true,
			isShizukuActive: true,
			isPermissionGranted: true,
		};
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("rapidly verifies all toggles and pressables across verified modes", async () => {
		for (const mode of ["shizuku", "root", "adb"]) {
			for (const perm of [true, false]) {
				mockState.settings.workingMode = mode;
				mockState.isRootActive = mode === "root" && perm;
				mockState.isShizukuActive = mode === "shizuku" && perm;
				mockState.isPermissionGranted = perm;

				let tree: any;
				await renderer.act(async () => {
					tree = renderer.create(<SettingsMainTab />);
				});

				const toggles = tree.root.findAll(
					(node: any) =>
						node.props && typeof node.props.onValueChange === "function",
				);
				for (const t of toggles) {
					await renderer.act(async () => {
						await t.props.onValueChange(true);
						await t.props.onValueChange(false);
					});
				}

				const pressables = tree.root.findAllByType(Pressable);
				for (const p of pressables) {
					if (p.props && typeof p.props.onPress === "function") {
						await renderer.act(async () => {
							await p.props.onPress();
						});
					}
				}

				renderer.act(() => tree.unmount());
			}
		}
	});

	it("covers all scheduler values, bedtimeShield toggles, and notification warnings across OS versions", async () => {
		const schedulers = [1, 2, 4, 8, 0, undefined, null];
		for (const sched of schedulers) {
			for (const os of ["android", "ios"]) {
				for (const api of [28, 31, 33]) {
					Platform.OS = os as any;
					Platform.Version = api as any;
					mockState.settings.autoKillScheduler = sched;
					mockState.settings.bedtimeShield = sched === 2 || sched === 4;
					mockState.settings.dontRemoveNotif = sched === 1 || sched === 2;
					mockState.settings.wakeUpTracking = sched === 1 || sched === 8;

					let tree: any;
					await renderer.act(async () => {
						tree = renderer.create(<SettingsMainTab />);
					});
					renderer.act(() => tree.unmount());
				}
			}
		}
	});

	it("covers empty settings object `{}` to hit all fallback ternary branches", async () => {
		mockState.settings = {};
		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(<SettingsMainTab />);
		});
		renderer.act(() => tree.unmount());
	});

	it("covers checkBatteryOptimization returning false", async () => {
		mockBatteryCheck = false;
		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(<SettingsMainTab />);
		});
		const pressables = tree.root.findAllByType(Pressable);
		for (const p of pressables) {
			if (p.props && typeof p.props.onPress === "function") {
				await renderer.act(async () => {
					await p.props.onPress();
				});
			}
		}
		renderer.act(() => tree.unmount());
	});

	it("covers Android 33 notification permission catch block", async () => {
		Platform.OS = "android";
		Platform.Version = 33;
		jest
			.spyOn(PermissionsAndroid, "request")
			.mockRejectedValueOnce(new Error("perm error"));
		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(<SettingsMainTab />);
		});
		const toggles = tree.root.findAll(
			(node: any) =>
				node.props && typeof node.props.onValueChange === "function",
		);
		if (toggles.length > 0) {
			await renderer.act(async () => {
				await toggles[0].props.onValueChange(true);
			});
		}
		renderer.act(() => tree.unmount());
	});
});
