import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import "react-native";
import { BackHandler } from "react-native";
import renderer from "react-test-renderer";

import { AddAppsScreen } from "../../src/screens/AddAppsScreen";
import { useAppStore } from "../../src/stores/useAppStore";

jest.mock("react-native-css-interop", () => ({
	cssInterop: jest.fn(),
	remapProps: jest.fn(),
}));

jest.mock("../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		themeMode: "light",
		isDark: false,
		colors: {
			bgClass: "bg-white",
			textClass: "text-zinc-900",
			subTextClass: "text-zinc-500",
			cardClass: "bg-white",
			cardBorderClass: "border-zinc-200",
			borderClass: "border-zinc-200",
			iconColor: "#18181b",
			subIconColor: "#71717a",
			inputBgClass: "bg-zinc-50",
			secondaryBtnClass: "bg-zinc-100",
			captionClass: "text-zinc-400",
		},
	}),
}));

jest.mock("lucide-react-native", () => ({
	ArrowLeft: "ArrowLeft",
	Check: "Check",
	Info: "Info",
	Search: "Search",
	X: "X",
}));

jest.mock("../../src/components/common/HeaderMenu", () => ({
	HeaderMenu: "HeaderMenu",
}));

jest.mock("../../src/components/lists/AppListItem", () => ({
	AppListItem: "AppListItem",
}));

jest.mock("../../src/stores/useAppStore", () => ({
	useAppStore: jest.fn(),
}));

interface MockApp {
	packageName: string;
	appName: string;
	isSystemApp?: boolean;
	isStopped: boolean;
	isSelected?: boolean;
}

interface MockAppState {
	currentScreen: string;
	apps: MockApp[];
	isLoading: boolean;
	hibernationList: string[];
	isRootActive: boolean;
	isShizukuActive: boolean;
	isPermissionGranted: boolean;
	showSystemApps: boolean;
	settings: {
		workingMode: string;
		smoothScroll: boolean;
	};
	fetchApps: jest.Mock;
	setCurrentScreen: jest.Mock;
	addSelectedToHibernation: jest.Mock;
	toggleShowSystemApps: jest.Mock;
}

describe("AddAppsScreen", () => {
	const mockFetchApps = jest.fn();
	const mockSetCurrentScreen = jest.fn();
	const mockAddSelectedToHibernation = jest.fn();
	const mockToggleShowSystemApps = jest.fn();

	const defaultState: MockAppState = {
		currentScreen: "add_apps",
		apps: [],
		isLoading: false,
		hibernationList: [],
		isRootActive: false,
		isShizukuActive: true,
		isPermissionGranted: true,
		showSystemApps: false,
		settings: {
			workingMode: "shizuku",
			smoothScroll: false,
		},
		fetchApps: mockFetchApps,
		setCurrentScreen: mockSetCurrentScreen,
		addSelectedToHibernation: mockAddSelectedToHibernation,
		toggleShowSystemApps: mockToggleShowSystemApps,
	};

	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(BackHandler, "addEventListener");
		jest.useFakeTimers();

		(useAppStore as unknown as jest.Mock).mockImplementation(
			(selector: unknown) =>
				(selector as (state: MockAppState) => unknown)(defaultState),
		);
	});

	afterEach(() => {
		renderer.act(() => {
			jest.runOnlyPendingTimers();
		});
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it("1. calls fetchApps on mount when apps array is empty", () => {
		let component!: renderer.ReactTestRenderer;
		renderer.act(() => {
			component = renderer.create(<AddAppsScreen />);
		});

		expect(mockFetchApps).toHaveBeenCalled();

		renderer.act(() => {
			component.unmount();
		});
	});

	it("2. handles BackHandler and btn-back properly", () => {
		let component!: renderer.ReactTestRenderer;
		renderer.act(() => {
			component = renderer.create(<AddAppsScreen />);
		});
		const tree = component.root;

		const backBtn = tree.findByProps({ testID: "btn-back" });
		renderer.act(() => {
			backBtn.props.onPress();
		});
		expect(mockSetCurrentScreen).toHaveBeenCalledWith("home");

		// Simulate hardware back press
		const backHandlerCb = (
			BackHandler.addEventListener as jest.Mock
		).mock.calls.find(
			(call: unknown[]) => call[0] === "hardwareBackPress",
		)?.[1];

		expect(backHandlerCb).toBeDefined();
		let backResult: boolean | undefined;
		renderer.act(() => {
			if (typeof backHandlerCb === "function") {
				backResult = backHandlerCb();
			}
		});
		expect(backResult).toBe(true);

		renderer.act(() => {
			component.unmount();
		});
	});

	it("3. renders loading state and skips rendering SectionList during search debounce", () => {
		(useAppStore as unknown as jest.Mock).mockImplementation(
			(selector: unknown) =>
				(selector as (state: MockAppState) => unknown)({
					...defaultState,
					apps: [
						{
							packageName: "com.test",
							appName: "Test",
							isSystemApp: false,
							isStopped: false,
							isSelected: false,
						},
					],
				}),
		);

		let component!: renderer.ReactTestRenderer;
		renderer.act(() => {
			component = renderer.create(<AddAppsScreen />);
		});
		const tree = component.root;

		const searchInput = tree.findByProps({ testID: "search-input" });

		// Trigger search text change
		renderer.act(() => {
			searchInput.props.onChangeText("target");
		});

		// While debounce is active, it should show loading spinner
		const spinner = tree.findByProps({ testID: "loading-spinner" });
		expect(spinner).toBeTruthy();

		// Fast-forward debounce timer (250ms)
		renderer.act(() => {
			jest.advanceTimersByTime(250);
		});

		// Now spinner should be gone, and SectionList should be present
		expect(() => tree.findByProps({ testID: "loading-spinner" })).toThrow();
		const sectionList = tree.findByProps({ testID: "app-section-list" });
		expect(sectionList).toBeTruthy();

		// We can also test clear search
		const clearBtn = tree.findByProps({ testID: "btn-clear-search" });
		renderer.act(() => {
			clearBtn.props.onPress();
		});
		expect(searchInput.props.value).toBe("");

		renderer.act(() => {
			component.unmount();
		});
	});

	it("4. categorizes and filters apps correctly into sections", () => {
		(useAppStore as unknown as jest.Mock).mockImplementation(
			(selector: unknown) =>
				(selector as (state: MockAppState) => unknown)({
					...defaultState,
					showSystemApps: true, // Show system apps
					apps: [
						{
							packageName: "com.running",
							appName: "Running",
							isSystemApp: false,
							isStopped: false,
							isSelected: false,
						},
						{
							packageName: "com.stopped",
							appName: "Stopped",
							isSystemApp: false,
							isStopped: true,
							isSelected: false,
						},
						{
							packageName: "com.sys",
							appName: "SysApp",
							isSystemApp: true,
							isStopped: false,
							isSelected: false,
						},
						{
							packageName: "com.hidden",
							appName: "Hidden",
							isSystemApp: false,
							isStopped: false,
							isSelected: false,
						},
					],
					hibernationList: ["com.hidden"], // Should be excluded from list
				}),
		);

		let component!: renderer.ReactTestRenderer;
		renderer.act(() => {
			component = renderer.create(<AddAppsScreen />);
		});

		// Advance timer for initial search state resolution
		renderer.act(() => {
			jest.advanceTimersByTime(250);
		});

		const tree = component.root;
		const sectionList = tree.findByProps({ testID: "app-section-list" });
		const sections = sectionList.props.sections;

		expect(sections).toHaveLength(2);

		// Running section
		expect(sections[0].title).toContain("Berjalan di Latar Belakang (2)");
		expect(
			sections[0].data.map((a: { packageName: string }) => a.packageName),
		).toEqual(["com.running", "com.sys"]);

		// Stopped section
		expect(sections[1].title).toContain("Aplikasi Lainnya (1)");
		expect(
			sections[1].data.map((a: { packageName: string }) => a.packageName),
		).toEqual(["com.stopped"]);

		renderer.act(() => {
			component.unmount();
		});
	});

	it("5. handles selected count and renders/triggers FAB correctly", () => {
		(useAppStore as unknown as jest.Mock).mockImplementation(
			(selector: unknown) =>
				(selector as (state: MockAppState) => unknown)({
					...defaultState,
					apps: [
						{
							packageName: "com.running",
							appName: "Running",
							isStopped: false,
							isSelected: true,
						}, // 1 selected
					],
				}),
		);

		let component!: renderer.ReactTestRenderer;
		renderer.act(() => {
			component = renderer.create(<AddAppsScreen />);
		});

		renderer.act(() => {
			jest.advanceTimersByTime(250);
		});

		const tree = component.root;

		// Check FAB
		const fab = tree.findByProps({ testID: "fab-add-selected" });
		expect(fab).toBeTruthy();

		renderer.act(() => {
			fab.props.onPress();
		});

		expect(mockAddSelectedToHibernation).toHaveBeenCalled();

		renderer.act(() => {
			component.unmount();
		});
	});
});
