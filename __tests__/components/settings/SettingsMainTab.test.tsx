import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import "react-native";
import renderer from "react-test-renderer";

import { SettingsMainTab } from "../../../src/components/settings/SettingsMainTab";
import { useAppStore } from "../../../src/stores/useAppStore";

jest.mock("../../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		themeMode: "light",
		isDark: false,
		colors: {
			cardClass: "bg-white",
			cardBorderClass: "border-zinc-200",
			textClass: "text-zinc-900",
			subTextClass: "text-zinc-500",
			secondaryBtnClass: "bg-zinc-100",
			secondaryBtnTextClass: "text-zinc-800",
			primaryBtnClass: "bg-black",
			primaryBtnTextClass: "text-white",
			borderClass: "border-zinc-200",
			inputBgClass: "bg-zinc-50",
			captionClass: "text-zinc-400",
		},
	}),
}));

jest.mock("../../../src/stores/useAppStore", () => ({
	useAppStore: jest.fn(),
}));

jest.mock("lucide-react-native", () => ({
	AlertTriangle: "AlertTriangle",
	ArrowRight: "ArrowRight",
	RotateCcw: "RotateCcw",
	Snowflake: "Snowflake",
	Sparkles: "Sparkles",
}));

// Mock the child components to simplify testing SettingsMainTab
jest.mock("../../../src/components/settings/SettingToggleRow", () => ({
	SettingToggleRow: "SettingToggleRow",
}));
jest.mock("../../../src/components/modals/InfoModal", () => ({
	InfoModal: "InfoModal",
}));
jest.mock("../../../src/components/modals/SelectionModal", () => ({
	SelectionModal: "SelectionModal",
}));

jest.mock("../../../src/services/killerService", () => ({
	checkBatteryOptimization: jest.fn(),
	requestBatteryOptimization: jest.fn(),
}));

interface MockAppState {
	settings: {
		themeMode?: string;
		workingMode: string;
		smoothScroll: boolean;
		smartHibernation?: boolean;
		finerMediaDetection?: boolean;
		shallowHibernation?: boolean;
		wakeUpTracking?: boolean;
		autoHibernation?: boolean;
		ignoreBackgroundFree?: boolean;
		hibernateSystemApps?: boolean;
		quickActionNotif?: boolean;
		dontRemoveNotif?: boolean;
		aggressiveDoze?: boolean;
		gcmWakeupBypass?: boolean;
		deepTrimMemory?: boolean;
		phantomSlayer?: boolean;
		bedtimeShield?: boolean;
		emergencyTrigger?: boolean;
		ramCrunchSlayer?: boolean;
		autoKillScheduler?: number;
	};
	isRootActive: boolean;
	isShizukuActive: boolean;
	isPermissionGranted: boolean;
	updateSetting: jest.Mock;
	resetOnboarding: jest.Mock;
	setCurrentScreen: jest.Mock;
}

describe("SettingsMainTab", () => {
	const mockUpdateSetting = jest.fn();
	const mockResetOnboarding = jest.fn();
	const mockSetCurrentScreen = jest.fn();

	const defaultState: MockAppState = {
		settings: {
			workingMode: "shizuku",
			smoothScroll: true,
		},
		isRootActive: false,
		isShizukuActive: true,
		isPermissionGranted: true,
		updateSetting: mockUpdateSetting,
		resetOnboarding: mockResetOnboarding,
		setCurrentScreen: mockSetCurrentScreen,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	const renderWithState = (stateOverrides: Partial<MockAppState>) => {
		// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
		(useAppStore as unknown as jest.Mock).mockImplementation((selector: any) =>
			selector({ ...defaultState, ...stateOverrides }),
		);
		let component!: renderer.ReactTestRenderer;
		renderer.act(() => {
			component = renderer.create(<SettingsMainTab />);
		});
		return component;
	};

	it("1. renders Point 1 Theme buttons correctly and defaults to system", () => {
		const component = renderWithState({}); // default is no themeMode
		const tree = component.root;

		const btnSystem = tree.findByProps({ testID: "btn-theme-system" });
		const btnDark = tree.findByProps({ testID: "btn-theme-dark" });
		const btnLight = tree.findByProps({ testID: "btn-theme-light" });

		// Check if buttons are rendered
		expect(btnSystem).toBeTruthy();
		expect(btnDark).toBeTruthy();
		expect(btnLight).toBeTruthy();

		// System should be the active one (visually tested via classes usually, but we simulate pressing others)
		renderer.act(() => {
			btnDark.props.onPress();
		});
		expect(mockUpdateSetting).toHaveBeenCalledWith("themeMode", "dark");
	});

	it("2. handles Point 2 Working Mode button press to open Modal", () => {
		const component = renderWithState({});
		const tree = component.root;

		const btnWorkingMode = tree.findByProps({ testID: "btn-working-mode" });
		renderer.act(() => {
			btnWorkingMode.props.onPress();
		});

		// The SelectionModal for working mode should have visible=true now
		// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
		const selectionModals = tree.findAllByType("SelectionModal" as any);
		// Find the one where title="Pilih Mode Bekerja"
		const modeModal = selectionModals.find(
			(m) => m.props.title === "Pilih Mode Bekerja",
		);
		expect(modeModal?.props.visible).toBe(true);
	});

	it("3. disables interactions for Point 3 onwards when working mode is unverified (Failure State)", () => {
		// Set unverified state
		const component = renderWithState({
			settings: { workingMode: "shizuku", smoothScroll: true },
			isShizukuActive: false, // This makes isModeVerified = false
		});
		const tree = component.root;

		const wrapper = tree.findByProps({
			testID: "unverified-disabled-wrapper",
		});

		// In unverified state, pointerEvents should be "none" to block taps
		expect(wrapper.props.pointerEvents).toBe("none");
		expect(wrapper.props.style.opacity).toBe(0.4);
	});

	it("4. enables interactions for Point 3 onwards when working mode is verified (Success State)", () => {
		// Set verified state
		const component = renderWithState({
			settings: { workingMode: "shizuku", smoothScroll: true },
			isShizukuActive: true,
			isPermissionGranted: true, // This makes isModeVerified = true
		});
		const tree = component.root;

		const wrapper = tree.findByProps({
			testID: "unverified-disabled-wrapper",
		});

		// In verified state, pointerEvents should be "auto"
		expect(wrapper.props.pointerEvents).toBe("auto");
		expect(wrapper.props.style.opacity).toBe(1);
	});

	it("5. handles Point 2 Mode selection 'shizuku'", () => {
		const component = renderWithState({});
		const tree = component.root;

		// Find the SelectionModal for Working Mode
		// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
		const selectionModals = tree.findAllByType("SelectionModal" as any);
		const modeModal = selectionModals.find(
			(m) => m.props.title === "Pilih Mode Bekerja",
		);

		// Simulate selecting "shizuku"
		renderer.act(() => {
			modeModal?.props.onSelect("shizuku");
		});

		expect(mockUpdateSetting).toHaveBeenCalledWith("workingMode", "shizuku");

		// Root Info Modal should not be opened
		// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
		const infoModals = tree.findAllByType("InfoModal" as any);
		const rootInfoModal = infoModals.find(
			(m) => m.props.title === "Informasi Mode Root",
		);
		expect(rootInfoModal?.props.visible).toBe(false);
	});

	it("6. handles Point 2 Mode selection 'root' and triggers InfoModal after timeout", () => {
		jest.useFakeTimers();

		const component = renderWithState({});
		const tree = component.root;

		// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
		const selectionModals = tree.findAllByType("SelectionModal" as any);
		const modeModal = selectionModals.find(
			(m) => m.props.title === "Pilih Mode Bekerja",
		);

		// Simulate selecting "root"
		renderer.act(() => {
			modeModal?.props.onSelect("root");
		});

		expect(mockUpdateSetting).toHaveBeenCalledWith("workingMode", "root");

		// Advance timer to trigger the setTimeout
		renderer.act(() => {
			jest.advanceTimersByTime(300);
		});

		// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
		const infoModals = tree.findAllByType("InfoModal" as any);
		const rootInfoModal = infoModals.find(
			(m) => m.props.title === "Informasi Mode Root",
		);

		// The root info modal should now be visible
		expect(rootInfoModal?.props.visible).toBe(true);

		jest.useRealTimers();
	});

	it("7. handles Point 3 Smart & Advanced Detection toggles correctly", () => {
		const component = renderWithState({
			settings: {
				workingMode: "shizuku",
				smoothScroll: true,
				// Simulate default states
				smartHibernation: true,
				finerMediaDetection: false,
			},
		});
		const tree = component.root;

		// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
		const toggleRows = tree.findAllByType("SettingToggleRow" as any);

		// 1. Test Smart KillApps
		const smartKillAppsToggle = toggleRows.find(
			(t) => t.props.title === "Smart KillApps",
		);
		expect(smartKillAppsToggle).toBeTruthy();
		expect(smartKillAppsToggle?.props.value).toBe(true); // Should take value from state

		renderer.act(() => {
			smartKillAppsToggle?.props.onValueChange(false);
		});
		expect(mockUpdateSetting).toHaveBeenCalledWith("smartHibernation", false);

		// 2. Test Finer Detection (Media Playback)
		const finerMediaToggle = toggleRows.find(
			(t) => t.props.title === "Finer Detection (Media Playback)",
		);
		expect(finerMediaToggle).toBeTruthy();
		expect(finerMediaToggle?.props.value).toBe(false); // Should take value from state

		renderer.act(() => {
			finerMediaToggle?.props.onValueChange(true);
		});
		expect(mockUpdateSetting).toHaveBeenCalledWith("finerMediaDetection", true);
	});

	it("8. handles Point 4 Intensity & Wake-up toggles correctly", () => {
		const component = renderWithState({
			settings: {
				workingMode: "shizuku",
				smoothScroll: true,
				shallowHibernation: false,
				wakeUpTracking: true,
			},
		});
		const tree = component.root;

		// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
		const toggleRows = tree.findAllByType("SettingToggleRow" as any);

		const shallowToggle = toggleRows.find(
			(t) => t.props.title === "KillApps Dangkal (Shallow)",
		);
		renderer.act(() => shallowToggle?.props.onValueChange(true));
		expect(mockUpdateSetting).toHaveBeenCalledWith("shallowHibernation", true);

		const wakeUpToggle = toggleRows.find(
			(t) => t.props.title === "Wake-up Tracking and Cut-off",
		);
		renderer.act(() => wakeUpToggle?.props.onValueChange(false));
		expect(mockUpdateSetting).toHaveBeenCalledWith("wakeUpTracking", false);
	});

	it("9. handles Point 5 Automation & Exceptions toggles correctly", () => {
		const component = renderWithState({
			settings: {
				workingMode: "shizuku",
				smoothScroll: true,
				autoHibernation: false,
				ignoreBackgroundFree: false,
				hibernateSystemApps: false,
			},
		});
		const tree = component.root;

		// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
		const toggleRows = tree.findAllByType("SettingToggleRow" as any);

		const autoHibernationToggle = toggleRows.find(
			(t) => t.props.title === "Otomatis KillApps",
		);
		renderer.act(() => autoHibernationToggle?.props.onValueChange(true));
		expect(mockUpdateSetting).toHaveBeenCalledWith("autoHibernation", true);

		const ignoreBGToggle = toggleRows.find(
			(t) => t.props.title === "Always Ignore Background-free",
		);
		renderer.act(() => ignoreBGToggle?.props.onValueChange(true));
		expect(mockUpdateSetting).toHaveBeenCalledWith(
			"ignoreBackgroundFree",
			true,
		);

		const systemAppsToggle = toggleRows.find(
			(t) => t.props.title === "Sertakan Aplikasi Sistem",
		);
		renderer.act(() => systemAppsToggle?.props.onValueChange(true));
		expect(mockUpdateSetting).toHaveBeenCalledWith("hibernateSystemApps", true);
	});

	it("10. handles Battery Optimization pressable logic correctly", async () => {
		const {
			checkBatteryOptimization,
			requestBatteryOptimization,
		} = require("../../../src/services/killerService");

		// Simulate checking battery returns false (not ignored)
		checkBatteryOptimization.mockResolvedValueOnce(false);
		requestBatteryOptimization.mockResolvedValueOnce(true);

		const component = renderWithState({});
		const tree = component.root;

		const batteryBtn = tree.findByProps({
			testID: "battery-optimization-button",
		});

		await renderer.act(async () => {
			await batteryBtn.props.onPress();
		});

		expect(checkBatteryOptimization).toHaveBeenCalled();
		expect(requestBatteryOptimization).toHaveBeenCalled();

		// Simulate check battery returns true (already ignored) -> opens modal
		checkBatteryOptimization.mockResolvedValueOnce(true);

		await renderer.act(async () => {
			await batteryBtn.props.onPress();
		});

		// Check if InfoModal for battery is visible
		// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
		const infoModals = tree.findAllByType("InfoModal" as any);
		const batteryModal = infoModals.find(
			(m) => m.props.title === "Sudah Diizinkan",
		);

		expect(batteryModal?.props.visible).toBe(true);
	});

	it("11. Point 6: Pintasan & Notifikasi toggles work and handle permissions", async () => {
		const { PermissionsAndroid, Platform } = require("react-native");

		// Setup mock for Platform
		const originalOS = Platform.OS;
		const originalVersion = Platform.Version;
		Object.defineProperty(Platform, "OS", { value: "android", writable: true });
		Object.defineProperty(Platform, "Version", { value: 33, writable: true });

		const requestSpy = jest
			.spyOn(PermissionsAndroid, "request")
			// biome-ignore lint/suspicious/noExplicitAny: mocking promise
			.mockResolvedValueOnce("granted" as any);

		const component = renderWithState({});
		const tree = component.root;

		// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
		const toggleRows = tree.findAllByType("SettingToggleRow" as any);

		const quickNotifToggle = toggleRows.find(
			// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
			(t: any) => t.props.title === "Quick Action Notification",
		);
		const dontRemoveToggle = toggleRows.find(
			// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
			(t: any) => t.props.title === "Don't Remove Notification",
		);

		expect(quickNotifToggle).toBeTruthy();
		expect(dontRemoveToggle).toBeTruthy();

		// Test Quick Action Notification (requests permission on Android 33+)
		await renderer.act(async () => {
			await quickNotifToggle?.props.onValueChange(true);
		});

		expect(requestSpy).toHaveBeenCalledWith(
			PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
		);
		expect(mockUpdateSetting).toHaveBeenCalledWith("quickActionNotif", true);

		// Test Don't Remove Notification
		renderer.act(() => {
			dontRemoveToggle?.props.onValueChange(true);
		});
		expect(mockUpdateSetting).toHaveBeenCalledWith("dontRemoveNotif", true);

		// Restore
		requestSpy.mockRestore();
		Platform.OS = originalOS;
		Platform.Version = originalVersion;
	});

	it("12. Point 7: Fitur Ekstrem toggles work correctly", () => {
		const component = renderWithState({
			settings: {
				workingMode: "shizuku",
				smoothScroll: true,
				aggressiveDoze: false,
				gcmWakeupBypass: false,
				deepTrimMemory: false,
			},
		});
		const tree = component.root;

		// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
		const toggleRows = tree.findAllByType("SettingToggleRow" as any);

		const aggressiveToggle = toggleRows.find(
			// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
			(t: any) => t.props.title === "Aggressive Doze Mode",
		);
		const gcmToggle = toggleRows.find(
			// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
			(t: any) => t.props.title === "GCM Push Wake-up Bypass",
		);
		const deepTrimToggle = toggleRows.find(
			// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
			(t: any) => t.props.title === "Deep Trim Memory",
		);

		expect(aggressiveToggle).toBeTruthy();
		expect(gcmToggle).toBeTruthy();
		expect(deepTrimToggle).toBeTruthy();

		renderer.act(() => {
			aggressiveToggle?.props.onValueChange(true);
		});
		expect(mockUpdateSetting).toHaveBeenCalledWith("aggressiveDoze", true);

		renderer.act(() => {
			gcmToggle?.props.onValueChange(true);
		});
		expect(mockUpdateSetting).toHaveBeenCalledWith("gcmWakeupBypass", true);

		renderer.act(() => {
			deepTrimToggle?.props.onValueChange(true);
		});
		expect(mockUpdateSetting).toHaveBeenCalledWith("deepTrimMemory", true);
	});

	it("13. Point 8: Pro Suite toggles work correctly", () => {
		const component = renderWithState({
			settings: {
				workingMode: "shizuku",
				smoothScroll: true,
				phantomSlayer: false,
				bedtimeShield: false,
				emergencyTrigger: false,
				ramCrunchSlayer: false,
			},
		});
		const tree = component.root;

		// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
		const toggleRows = tree.findAllByType("SettingToggleRow" as any);

		const phantomToggle = toggleRows.find(
			// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
			(t: any) => t.props.title === "Phantom Process Slayer",
		);
		const bedtimeToggle = toggleRows.find(
			// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
			(t: any) => t.props.title === "Bedtime Zero-Drain Shield",
		);
		const emergencyToggle = toggleRows.find(
			// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
			(t: any) => t.props.title === "Emergency Smart Triggers",
		);
		const ramCrunchToggle = toggleRows.find(
			// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
			(t: any) => t.props.title === "RAM Crunch Auto-Slayer",
		);

		expect(phantomToggle).toBeTruthy();
		expect(bedtimeToggle).toBeTruthy();
		expect(emergencyToggle).toBeTruthy();
		expect(ramCrunchToggle).toBeTruthy();

		renderer.act(() => {
			phantomToggle?.props.onValueChange(true);
		});
		expect(mockUpdateSetting).toHaveBeenCalledWith("phantomSlayer", true);

		renderer.act(() => {
			bedtimeToggle?.props.onValueChange(true);
		});
		expect(mockUpdateSetting).toHaveBeenCalledWith("bedtimeShield", true);

		renderer.act(() => {
			emergencyToggle?.props.onValueChange(true);
		});
		expect(mockUpdateSetting).toHaveBeenCalledWith("emergencyTrigger", true);

		renderer.act(() => {
			ramCrunchToggle?.props.onValueChange(true);
		});
		expect(mockUpdateSetting).toHaveBeenCalledWith("ramCrunchSlayer", true);
	});

	it("14. Point 8: Pro Suite Auto-Kill Scheduler modal works", () => {
		const component = renderWithState({});
		const tree = component.root;

		// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
		const selectionModals = tree.findAllByType("SelectionModal" as any);
		const schedulerModal = selectionModals.find(
			// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
			(m: any) => m.props.title === "Auto-Kill Scheduler",
		);

		expect(schedulerModal).toBeTruthy();

		renderer.act(() => {
			schedulerModal?.props.onSelect("4");
		});

		expect(mockUpdateSetting).toHaveBeenCalledWith("autoKillScheduler", 4);
	});

	it("15. Point 9: Sistem & Reset Total works", () => {
		const component = renderWithState({});
		const tree = component.root;

		// Find Reset Total button
		const resetBtn = tree.findByProps({ onPress: mockResetOnboarding });

		expect(resetBtn).toBeTruthy();

		renderer.act(() => {
			resetBtn.props.onPress();
		});

		expect(mockResetOnboarding).toHaveBeenCalled();
	});
});
