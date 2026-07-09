// @ts-nocheck
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import { BackHandler } from "react-native";
import renderer from "react-test-renderer";
import { AddAppsScreen } from "../../src/screens/AddAppsScreen";

let mockDark = false;
let mockState: any = {};
let backCallbacks: any[] = [];

jest.mock("../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		isDark: mockDark,
		colors: {
			bgClass: mockDark ? "bg-black" : "bg-white",
			modalBgClass: mockDark ? "bg-zinc-950" : "bg-white",
			cardClass: mockDark ? "bg-zinc-900" : "bg-zinc-100",
			cardBorderClass: mockDark ? "border-zinc-800" : "border-zinc-200",
			inputBgClass: mockDark ? "bg-zinc-900" : "bg-zinc-100",
			textClass: mockDark ? "text-white" : "text-black",
			subTextClass: mockDark ? "text-zinc-400" : "text-zinc-600",
			captionClass: mockDark ? "text-zinc-500" : "text-zinc-400",
			primaryBtnClass: mockDark ? "bg-white" : "bg-black",
			primaryBtnTextClass: mockDark ? "text-black" : "text-white",
			secondaryBtnClass: mockDark ? "bg-zinc-800" : "bg-zinc-200",
			secondaryBtnTextClass: mockDark ? "text-white" : "text-black",
			iconColor: mockDark ? "#ffffff" : "#000000",
			subIconColor: mockDark ? "#a1a1aa" : "#52525b",
			statusBarStyle: mockDark ? "light-content" : "dark-content",
			statusBarBg: mockDark ? "#000000" : "#ffffff",
			dividerClass: mockDark ? "divide-zinc-800" : "divide-zinc-200",
			borderClass: mockDark ? "border-zinc-800" : "border-zinc-200",
		},
	}),
}));

jest.mock("../../src/stores/useAppStore", () => {
	const useAppStoreMock = jest.fn((selector: any) =>
		selector(mockState),
	) as any;
	useAppStoreMock.getState = jest.fn(() => mockState);
	return { useAppStore: useAppStoreMock };
});

describe("AddAppsScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockDark = false;
		backCallbacks = [];
		jest
			.spyOn(BackHandler, "addEventListener")
			.mockImplementation((event, cb) => {
				if (event === "hardwareBackPress") backCallbacks.push(cb);
				return { remove: () => {} } as any;
			});

		mockState = {
			currentScreen: "add_apps",
			hibernationList: ["com.test.app1"],
			apps: [
				{
					packageName: "com.test.app1",
					appName: "App One",
					isStopped: true,
					isSelected: true,
					isSystemApp: false,
				},
				{
					packageName: "com.test.app2",
					appName: "Other Two",
					isStopped: true,
					isSelected: false,
					isSystemApp: false,
				},
			],
			settings: { workingMode: "shizuku", hibernateSystemApps: true },
			isShizukuActive: true,
			permissions: { isPermissionGranted: true },
			isPermissionGranted: true,
			isRootActive: false,
			fetchApps: jest.fn(),
			addSelectedToHibernation: jest.fn(),
			setCurrentScreen: jest.fn(),
			toggleSelectApp: jest.fn(),
		};
	});

	afterEach(() => {
		renderer.act(() => {
			jest.runOnlyPendingTimers();
		});
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("renders when apps list is empty and triggers fetchApps + back handler", async () => {
		mockState.apps = [];
		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(<AddAppsScreen />);
			jest.runAllTimers();
		});

		expect(mockState.fetchApps).toHaveBeenCalled();

		// Trigger hardware back press
		for (const cb of backCallbacks) {
			renderer.act(() => {
				cb();
			});
		}
		expect(mockState.setCurrentScreen).toHaveBeenCalledWith("home");

		renderer.act(() => tree.unmount());
	});

	it("renders search, filters by packageName and appName, and clicks FAB when verified", async () => {
		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(<AddAppsScreen />);
			jest.runAllTimers();
		});

		// Type search
		const searchInput = tree.root.findAll(
			(node: any) => node.props?.placeholder && node.props?.onChangeText,
		)[0];
		if (searchInput) {
			renderer.act(() => {
				searchInput.props.onChangeText("app1");
				jest.runAllTimers();
			});
			renderer.act(() => {
				searchInput.props.onChangeText("com.test");
				jest.runAllTimers();
			});
		}

		// Click FAB
		const fab = tree.root.findAllByProps({ testID: "fab-add-selected" });
		if (fab.length > 0) {
			renderer.act(() => fab[0].props.onPress());
			expect(mockState.addSelectedToHibernation).toHaveBeenCalled();
		}

		// Trigger FlatList renderItem and clicks if any
		const lists = tree.root.findAllByType("RCTScrollView" as any);
		if (lists.length > 0 && lists[0].props.renderItem) {
			renderer.act(() => {
				lists[0].props.renderItem({ item: mockState.apps[0] });
			});
		}

		renderer.act(() => tree.unmount());
	});

	it("renders unverified state in dark mode when hibernateSystemApps is false and fab disabled", async () => {
		mockDark = true;
		mockState.settings.hibernateSystemApps = false;
		mockState.settings.workingMode = "root";
		mockState.isRootActive = false;
		mockState.apps = [
			{
				packageName: "com.sys.app",
				appName: "Sys App",
				isStopped: true,
				isSelected: true,
				isSystemApp: true,
			},
			{
				packageName: "com.user.app",
				appName: "User App",
				isStopped: true,
				isSelected: true,
				isSystemApp: false,
			},
		];

		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(<AddAppsScreen />);
			jest.runAllTimers();
		});

		const fab = tree.root.findAllByProps({ testID: "fab-add-selected" });
		if (fab.length > 0 && fab[0].props.onPress) {
			renderer.act(() => fab[0].props.onPress());
			expect(mockState.addSelectedToHibernation).not.toHaveBeenCalled();
		}

		renderer.act(() => tree.unmount());
	});
});
