import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import "react-native";
import {
	AppState,
	DeviceEventEmitter,
	type EmitterSubscription,
	type NativeEventSubscription,
} from "react-native";

import renderer from "react-test-renderer";
import { HomeScreen } from "../../src/screens/HomeScreen";
import { useAppStore } from "../../src/stores/useAppStore";

jest.mock("../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		themeMode: "light",
		isDark: false,
		colors: {
			bgClass: "bg-white",
			modalBgClass: "bg-white",
			cardClass: "bg-zinc-100",
			cardBorderClass: "border-zinc-200",
			inputBgClass: "bg-zinc-100",
			textClass: "text-black",
			subTextClass: "text-zinc-600",
			captionClass: "text-zinc-400",
			primaryBtnClass: "bg-black",
			primaryBtnTextClass: "text-white",
			secondaryBtnClass: "bg-zinc-200",
			secondaryBtnTextClass: "text-black",
			iconColor: "#000000",
			subIconColor: "#52525b",
			statusBarStyle: "dark-content",
			statusBarBg: "#ffffff",
			dividerClass: "divide-zinc-200",
			borderClass: "border-zinc-200",
		},
	}),
}));

jest.mock("../../src/services/killerService", () => ({
	killerService: {
		setAutoHibernationConfig: jest.fn(),
		setQuickActionNotification: jest.fn(),
	},
}));

jest.mock("lucide-react-native", () => ({
	Brain: "Brain",
	Layers: "Layers",
	Plus: "Plus",
	Search: "Search",
	Snowflake: "Snowflake",
	X: "X",
}));

jest.mock("../../src/components/common/HeaderMenu", () => ({
	HeaderMenu: "HeaderMenu",
}));
jest.mock("../../src/components/common/ShizukuStatusCard", () => ({
	ShizukuStatusCard: "ShizukuStatusCard",
}));
jest.mock("../../src/components/lists/HibernationListItem", () => ({
	HibernationListItem: "HibernationListItem",
}));
jest.mock("../../src/components/modals/AboutModal", () => ({
	AboutModal: "AboutModal",
}));
jest.mock("../../src/components/modals/QuickKillModal", () => ({
	QuickKillModal: "QuickKillModal",
}));
jest.mock("../../src/components/modals/SettingsModal", () => ({
	SettingsModal: "SettingsModal",
}));

jest.mock("../../src/stores/useAppStore", () => ({
	useAppStore: jest.fn(),
}));

describe("HomeScreen", () => {
	const mockFetchApps = jest.fn();
	const mockCheckShizukuStatus = jest.fn();
	const mockSetCurrentScreen = jest.fn();
	const mockKillHibernationApps = jest.fn();
	const mockClearKillMessage = jest.fn();
	const mockKillSingleApp = jest.fn();

	const defaultState: {
		apps: { packageName: string; appName: string; isStopped: boolean }[];
		hibernationList: string[];
		isShizukuActive: boolean;
		isPermissionGranted: boolean;
		isRootActive: boolean;
		isLoading: boolean;
		isKilling: boolean;
		killMessage: string;
		settings: Record<string, unknown>;
		fetchApps: jest.Mock;
		checkShizukuStatus: jest.Mock;
		setCurrentScreen: jest.Mock;
		killHibernationApps: jest.Mock;
		clearKillMessage: jest.Mock;
		killSingleApp: jest.Mock;
		removeFromHibernation: jest.Mock;
	} = {
		apps: [],
		hibernationList: [],
		isShizukuActive: true,
		isPermissionGranted: true,
		isRootActive: false,
		isLoading: false,
		isKilling: false,
		killMessage: "",
		settings: {
			workingMode: "shizuku",
			autoHibernation: false,
			quickActionNotif: false,
			ignoreBackgroundFree: true,
			smartHibernation: true,
			shallowHibernation: false,
		},
		fetchApps: mockFetchApps,
		checkShizukuStatus: mockCheckShizukuStatus,
		setCurrentScreen: mockSetCurrentScreen,
		killHibernationApps: mockKillHibernationApps,
		clearKillMessage: mockClearKillMessage,
		killSingleApp: mockKillSingleApp,
		removeFromHibernation: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();

		jest
			.spyOn(DeviceEventEmitter, "addListener")
			.mockImplementation(
				() => ({ remove: jest.fn() }) as unknown as EmitterSubscription,
			);
		jest
			.spyOn(AppState, "addEventListener")
			.mockImplementation(
				() => ({ remove: jest.fn() }) as unknown as NativeEventSubscription,
			);

		(useAppStore as unknown as jest.Mock).mockImplementation(
			(selector: unknown) => {
				return (selector as (state: typeof defaultState) => unknown)(
					defaultState,
				);
			},
		);
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	it("1. calls checkShizukuStatus and fetchApps on mount when apps is empty", () => {
		let component!: renderer.ReactTestRenderer;
		renderer.act(() => {
			component = renderer.create(<HomeScreen />);
		});
		expect(mockCheckShizukuStatus).toHaveBeenCalled();
		expect(mockFetchApps).toHaveBeenCalled();
		renderer.act(() => {
			component.unmount();
		});
	});

	it("2. renders ShizukuStatusCard and disables buttons when mode is unverified", () => {
		(useAppStore as unknown as jest.Mock).mockImplementation(
			(selector: unknown) => {
				const state = { ...defaultState, isPermissionGranted: false };
				return (selector as (state: typeof defaultState) => unknown)(state);
			},
		);

		let component!: renderer.ReactTestRenderer;
		renderer.act(() => {
			component = renderer.create(<HomeScreen />);
		});
		const tree = component.root;

		expect(
			tree.findAllByType("ShizukuStatusCard" as unknown as React.ElementType),
		).toHaveLength(1);

		const plusButton = tree.findByProps({ testID: "fab-add" });
		expect(plusButton?.props.disabled).toBe(true);
		renderer.act(() => {
			component.unmount();
		});
	});

	it("3. renders Welcome Empty State when hibernationList is empty", () => {
		let component!: renderer.ReactTestRenderer;
		renderer.act(() => {
			component = renderer.create(<HomeScreen />);
		});
		const tree = component.root;

		const emptyText = tree.findByProps({ testID: "empty-state-text" });
		expect(emptyText).toBeTruthy();
		renderer.act(() => {
			component.unmount();
		});
	});

	it("4. renders Loading indicator when isLoading is true and hibernationList has items", () => {
		(useAppStore as unknown as jest.Mock).mockImplementation(
			(selector: unknown) => {
				const state = {
					...defaultState,
					hibernationList: ["com.example.app"],
					apps: [],
					isLoading: true,
				};
				return (selector as (state: typeof defaultState) => unknown)(state);
			},
		);

		let component!: renderer.ReactTestRenderer;
		renderer.act(() => {
			component = renderer.create(<HomeScreen />);
		});
		const tree = component.root;

		const loadingText = tree.findByProps({ testID: "loading-state-text" });
		expect(loadingText).toBeTruthy();
		renderer.act(() => {
			component.unmount();
		});
	});

	it("5. renders Active and Hibernated apps correctly", () => {
		(useAppStore as unknown as jest.Mock).mockImplementation(
			(selector: unknown) => {
				const state = {
					...defaultState,
					hibernationList: ["com.app.active", "com.app.hibernated"],
					apps: [
						{
							packageName: "com.app.active",
							appName: "Active App",
							isStopped: false,
						},
						{
							packageName: "com.app.hibernated",
							appName: "Hibernated App",
							isStopped: true,
						},
					],
				};
				return (selector as (state: typeof defaultState) => unknown)(state);
			},
		);

		let component!: renderer.ReactTestRenderer;
		renderer.act(() => {
			component = renderer.create(<HomeScreen />);
		});
		const tree = component.root;

		const activeHeader = tree.findByProps({ testID: "active-header" });
		const hibernatedHeader = tree.findByProps({ testID: "hibernated-header" });

		expect(activeHeader).toBeTruthy();
		expect(hibernatedHeader).toBeTruthy();

		const listItems = tree.findAllByType(
			"HibernationListItem" as unknown as React.ElementType,
		);
		expect(listItems).toHaveLength(2);
		renderer.act(() => {
			component.unmount();
		});
	});

	it("6. filters apps using search functionality", async () => {
		(useAppStore as unknown as jest.Mock).mockImplementation(
			(selector: unknown) => {
				const state = {
					...defaultState,
					hibernationList: ["com.app.target", "com.app.other"],
					apps: [
						{
							packageName: "com.app.target",
							appName: "Target App",
							isStopped: false,
						},
						{
							packageName: "com.app.other",
							appName: "Other App",
							isStopped: false,
						},
					],
				};
				return (selector as (state: typeof defaultState) => unknown)(state);
			},
		);

		let component!: renderer.ReactTestRenderer;
		renderer.act(() => {
			component = renderer.create(<HomeScreen />);
		});
		const tree = component.root;

		const searchInput = tree.findByProps({ testID: "search-input" });
		await renderer.act(async () => {
			searchInput.props.onChangeText("target");
		});

		const listItems = tree.findAllByType(
			"HibernationListItem" as unknown as React.ElementType,
		);
		expect(listItems).toHaveLength(1);
		expect(listItems[0].props.app.appName).toBe("Target App");

		// Test empty result
		await renderer.act(async () => {
			searchInput.props.onChangeText("notfound");
		});

		const notFoundText = tree.findByProps({ testID: "not-found-text" });
		expect(notFoundText).toBeTruthy();
		renderer.act(() => {
			component.unmount();
		});
	});

	it("7. triggers navigation and kill actions via FAB buttons", async () => {
		(useAppStore as unknown as jest.Mock).mockImplementation(
			(selector: unknown) => {
				const state = {
					...defaultState,
					hibernationList: ["com.app.target"],
					apps: [
						{
							packageName: "com.app.target",
							appName: "Target App",
							isStopped: false,
						},
					],
				};
				return (selector as (state: typeof defaultState) => unknown)(state);
			},
		);

		let component!: renderer.ReactTestRenderer;
		renderer.act(() => {
			component = renderer.create(<HomeScreen />);
		});
		const tree = component.root;

		const plusButton = tree.findByProps({ testID: "fab-add" });
		await renderer.act(async () => {
			plusButton?.props.onPress();
		});
		expect(mockSetCurrentScreen).toHaveBeenCalledWith("add_apps");

		const killButton = tree.findByProps({ testID: "fab-kill-all" });

		await renderer.act(async () => {
			killButton?.props.onPress();
		});
		expect(mockKillHibernationApps).toHaveBeenCalled();
		renderer.act(() => {
			component.unmount();
		});
	});

	it("8. displays kill message and allows clearing it", async () => {
		(useAppStore as unknown as jest.Mock).mockImplementation(
			(selector: unknown) => {
				const state = { ...defaultState, killMessage: "3 aplikasi dihentikan" };
				return (selector as (state: typeof defaultState) => unknown)(state);
			},
		);

		let component!: renderer.ReactTestRenderer;
		renderer.act(() => {
			component = renderer.create(<HomeScreen />);
		});
		const tree = component.root;

		const messageText = tree.findByProps({ testID: "kill-message-text" });
		expect(messageText).toBeTruthy();

		const closeButton = tree.findByProps({ testID: "kill-message-pressable" });

		await renderer.act(async () => {
			if (closeButton?.props.onPress) {
				closeButton.props.onPress();
			}
		});

		expect(mockClearKillMessage).toHaveBeenCalled();
		renderer.act(() => {
			component.unmount();
		});
	});

	it("9. renders 'MEMATIKAN...' and disables FAB when isKilling is true", () => {
		(useAppStore as unknown as jest.Mock).mockImplementation(
			(selector: unknown) => {
				const state = {
					...defaultState,
					hibernationList: ["com.app.target"],
					apps: [
						{
							packageName: "com.app.target",
							appName: "Target App",
							isStopped: false,
						},
					],
					isKilling: true,
				};
				return (selector as (state: typeof defaultState) => unknown)(state);
			},
		);

		let component!: renderer.ReactTestRenderer;
		renderer.act(() => {
			component = renderer.create(<HomeScreen />);
		});
		const tree = component.root;

		const killButton = tree.findByProps({ testID: "fab-kill-all" });
		expect(killButton.props.disabled).toBe(true);

		const killText = tree.findByProps({ testID: "fab-kill-text" });
		expect(killText.props.children).toBe("MEMATIKAN...");

		renderer.act(() => {
			component.unmount();
		});
	});
});
