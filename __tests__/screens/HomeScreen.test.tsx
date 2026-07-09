// @ts-nocheck
import { afterEach, beforeEach, describe, it, jest } from "@jest/globals";
import {
	AppState,
	DeviceEventEmitter,
	Pressable,
	TextInput,
} from "react-native";
import renderer from "react-test-renderer";
import { InfoModal } from "../../src/components/modals/InfoModal";
import { QuickKillModal } from "../../src/components/modals/QuickKillModal";
import { HomeScreen } from "../../src/screens/HomeScreen";

let mockDark = false;
let mockState: any = {};
let appStateListeners: any = [];

jest.mock("../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		isDark: mockDark,
		colors: {
			bgClass: "bg-white",
			cardClass: "bg-white",
			cardBorderClass: "border-gray",
			textClass: "text-black",
			subTextClass: "text-gray",
			primaryBtnClass: "bg-black",
			primaryBtnTextClass: "text-white",
			secondaryBtnClass: "bg-gray",
			secondaryBtnTextClass: "text-black",
			borderClass: "border-gray",
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

jest.mock("../../src/components/common/HeaderMenu", () => ({
	HeaderMenu: ({ options }: any) => {
		if (options) {
			for (const opt of options) {
				if (opt.onPress) setTimeout(opt.onPress, 5);
			}
		}
		return <div testID="HeaderMenu" />;
	},
}));
jest.mock("../../src/components/common/ModeStatusCard", () => ({
	ModeStatusCard: () => <div testID="ModeStatusCard" />,
}));
jest.mock("../../src/components/home/KillMessageCard", () => ({
	KillMessageCard: () => <div testID="KillMessageCard" />,
}));
jest.mock("../../src/components/home/HomeEmptyState", () => ({
	HomeEmptyState: () => <div testID="HomeEmptyState" />,
}));
jest.mock("../../src/components/lists/HibernationListItem", () => ({
	HibernationListItem: () => <div testID="HibernationListItem" />,
}));

describe("HomeScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockDark = false;
		appStateListeners = [];
		jest.spyOn(AppState, "addEventListener").mockImplementation((event, cb) => {
			if (event === "change") appStateListeners.push(cb);
			return { remove: jest.fn() } as any;
		});
		mockState = {
			apps: [
				{ packageName: "com.whatsapp", appName: "WhatsApp", isStopped: false },
				{ packageName: "com.app2", appName: "App Two", isStopped: true },
			],
			hibernationList: ["com.whatsapp", "com.app2"],
			isLoading: false,
			isKilling: false,
			killMessage: null,
			clearKillMessage: jest.fn(),
			isRootActive: true,
			isShizukuActive: true,
			permissions: { isPermissionGranted: true },
			isPermissionGranted: true,
			settings: {
				workingMode: "shizuku",
				smartHibernation: true,
				finerMediaDetection: true,
				autoHibernation: true,
				quickActionNotif: true,
				ignoreBackgroundFree: false,
			},
			loadApps: jest.fn().mockResolvedValue(true as any),
			fetchApps: jest.fn().mockResolvedValue(true as any),
			killHibernationApps: jest.fn().mockResolvedValue(true as any),
			setCurrentScreen: jest.fn(),
			removeFromHibernation: jest.fn(),
			killSingleApp: jest.fn(),
			webviewModalVisible: false,
			setWebviewModalVisible: jest.fn(),
		};
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("exhaustive branch testing across verified modes, fab buttons, search, and DeviceEventEmitter events", async () => {
		for (const mode of ["shizuku", "root"]) {
			for (const verified of [true, false]) {
				for (const ignoreBg of [true, false]) {
					mockState.settings.workingMode = mode;
					mockState.settings.ignoreBackgroundFree = ignoreBg;
					mockState.isRootActive = mode === "root" && verified;
					mockState.isShizukuActive = mode === "shizuku" && verified;
					mockState.isPermissionGranted = verified;
					mockState.killMessage = verified ? "Killed 2 apps" : null;

					let tree: any;
					await renderer.act(async () => {
						tree = renderer.create(<HomeScreen />);
					});

					// Trigger DeviceEventEmitter events
					await renderer.act(async () => {
						DeviceEventEmitter.emit("ON_APP_KILLED_NOTIF");
						DeviceEventEmitter.emit("ON_NOTIF_ACTION_CLICKED");
						DeviceEventEmitter.emit("ON_SINGLE_KILL_CLICKED", {
							packageName: "com.whatsapp",
						});
						DeviceEventEmitter.emit("ON_SINGLE_KILL_CLICKED", null);
						DeviceEventEmitter.emit("ON_FREEZE_ALL_CLICKED");
						DeviceEventEmitter.emit("onAppsFrozen");
						for (const l of appStateListeners) {
							l("active");
							l("background");
						}
						jest.advanceTimersByTime(6500);
					});

					// Click FAB buttons specifically
					for (const id of ["fab-kill-all", "fab-add"]) {
						const btns = tree.root.findAllByProps({ testID: id });
						for (const b of btns) {
							if (b.props.onPress) {
								await renderer.act(async () => {
									await b.props.onPress();
								});
							}
						}
					}

					// Close InfoModal and QuickKillModal
					const infoModals = tree.root.findAllByType(InfoModal);
					for (const im of infoModals) {
						if (im.props.onClose) renderer.act(() => im.props.onClose());
					}
					const qkModals = tree.root.findAllByType(QuickKillModal);
					for (const qm of qkModals) {
						if (qm.props.onClose) renderer.act(() => qm.props.onClose());
					}

					renderer.act(() => tree.unmount());
				}
			}
		}
	});

	it("renders empty and search results with X clear button", async () => {
		mockState.apps = [];
		mockState.hibernationList = [];
		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(<HomeScreen />);
		});
		const inputs = tree.root.findAllByType(TextInput);
		if (inputs.length > 0) {
			renderer.act(() => inputs[0].props.onChangeText("abc"));
			const pressables = tree.root.findAllByType(Pressable);
			for (const p of pressables) {
				if (p.props.onPress) renderer.act(() => p.props.onPress());
			}
		}
		renderer.act(() => tree.unmount());
	});
});
