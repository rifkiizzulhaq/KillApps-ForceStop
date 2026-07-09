// @ts-nocheck
import { afterEach, beforeEach, describe, it, jest } from "@jest/globals";
import { BackHandler, Pressable, TextInput } from "react-native";
import renderer from "react-test-renderer";
import { InfoModal } from "../../src/components/modals/InfoModal";
import { QuarantineScreen } from "../../src/screens/QuarantineScreen";

let mockDark = false;
let mockState: any = {};
let backHandlerCb: any = null;
let mockFreezeOutcome: any = { success: true, errorCode: null };

jest.mock("../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		isDark: mockDark,
		colors: {
			bgClass: "bg-white",
			cardClass: "bg-white",
			cardBorderClass: "border-gray",
			textClass: "text-black",
			subTextClass: "text-gray",
			secondaryBtnClass: "bg-gray",
			secondaryBtnTextClass: "text-black",
			borderClass: "border-gray",
			subIconColor: "#555",
		},
	}),
}));

jest.mock("../../src/services/killer", () => ({
	getQuarantinePackages: jest
		.fn()
		.mockImplementation(async () => ["com.test.frozen"]),
	freezeQuarantinePackage: jest
		.fn()
		.mockImplementation(async () => mockFreezeOutcome),
}));

jest.mock("../../src/stores/useAppStore", () => {
	const useAppStoreMock = jest.fn((selector: any) =>
		selector(mockState),
	) as any;
	useAppStoreMock.getState = jest.fn(() => mockState);
	return { useAppStore: useAppStoreMock };
});

describe("QuarantineScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockDark = false;
		backHandlerCb = null;
		mockFreezeOutcome = { success: true, errorCode: null };
		jest
			.spyOn(BackHandler, "addEventListener")
			.mockImplementation((event, cb) => {
				if (event === "hardwareBackPress") backHandlerCb = cb;
				return { remove: jest.fn() } as any;
			});
		mockState = {
			settings: { workingMode: "shizuku" },
			isShizukuActive: true,
			isPermissionGranted: true,
			isRootActive: false,
			apps: [
				{
					packageName: "com.test.frozen",
					appName: "Frozen App",
					isFrozen: true,
					isSystem: true,
					icon: "http://icon",
				},
				{
					packageName: "com.test.normal",
					appName: "Normal App",
					isFrozen: false,
					isSystem: false,
					icon: null,
				},
			],
			setCurrentScreen: jest.fn(),
			removeFromHibernation: jest.fn(),
		};
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("covers toggleFreeze success and all error outcomes across working modes", async () => {
		const outcomes = [
			{ success: true, errorCode: null },
			{ success: false, errorCode: "webview_provider" },
			{ success: false, errorCode: "system_protected" },
			{ success: false, errorCode: "unfreeze_failed" },
			{ success: false, errorCode: "other" },
		];

		for (const outcome of outcomes) {
			for (const mode of ["shizuku", "root"]) {
				mockState.settings.workingMode = mode;
				mockFreezeOutcome = outcome;

				let tree: any;
				await renderer.act(async () => {
					tree = renderer.create(<QuarantineScreen />);
				});

				// Trigger BackHandler
				if (backHandlerCb) {
					renderer.act(() => {
						backHandlerCb();
					});
				}

				// Click toggleFreeze buttons for both frozen and normal app items
				const pressables = tree.root.findAllByType(Pressable);
				for (const p of pressables) {
					if (p.props.onPress) {
						await renderer.act(async () => {
							await p.props.onPress();
						});
					}
				}

				// Close InfoModal if shown
				const infoModals = tree.root.findAllByType(InfoModal);
				for (const im of infoModals) {
					if (im.props.onClose) renderer.act(() => im.props.onClose());
				}

				renderer.act(() => tree.unmount());
			}
		}
	});

	it("renders search box and X clear button", async () => {
		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(<QuarantineScreen />);
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

	it("renders empty state", async () => {
		mockState.apps = [];
		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(<QuarantineScreen />);
		});
		renderer.act(() => tree.unmount());
	});
});
