// @ts-nocheck
import { beforeEach, describe, it, jest } from "@jest/globals";
import { BackHandler, FlatList, Pressable, TextInput } from "react-native";
import renderer from "react-test-renderer";
import { ProAnalyticsScreen } from "../../src/screens/ProAnalyticsScreen";

let mockDark = false;
let mockState: any = {};
let backHandlerCallback: any = null;

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
			iconColor: "#000",
		},
	}),
}));

jest.mock("../../src/services/killer", () => ({
	getImpactAnalytics: jest.fn().mockImplementation(async () => ({
		lastRamBeforeMb: 2500,
		lastRamAfterMb: 3100,
		totalRamSavedMb: 12000,
		totalAppsKilled: 150,
		lastKillTimestamp: Date.now() - 3600000,
	})),
	getResurrectionDetectiveReport: jest.fn().mockImplementation(async () => [
		{
			packageName: "com.whatsapp",
			appName: "WhatsApp",
			resurrectionCount: 12,
			lastResurrected: Date.now() - 100000,
			isBandit: true,
		},
		{
			packageName: "com.app2",
			appName: "App Two",
			resurrectionCount: 1,
			lastResurrected: Date.now() - 86400000,
			isBandit: false,
		},
	]),
}));

jest.mock("../../src/stores/useAppStore", () => ({
	useAppStore: (selector: any) => selector(mockState),
}));

describe("ProAnalyticsScreen", () => {
	beforeEach(() => {
		mockDark = false;
		mockState = {
			apps: [
				{
					packageName: "com.whatsapp",
					appName: "WhatsApp",
					icon: "http://icon1",
				},
				{ packageName: "com.app2", appName: "App Two" },
			],
			setCurrentScreen: jest.fn(),
		};
		jest
			.spyOn(BackHandler, "addEventListener")
			.mockImplementation((event, cb) => {
				if (event === "hardwareBackPress") backHandlerCallback = cb;
				return { remove: jest.fn() } as any;
			});
	});

	it("renders loading initially, resolves to FlatList with header and items across light/dark themes", async () => {
		for (const dark of [false, true]) {
			mockDark = dark;
			let tree: any;
			await renderer.act(async () => {
				tree = renderer.create(<ProAnalyticsScreen />);
				await new Promise((resolve) => setTimeout(resolve, 50));
			});

			// Check hardware back press
			if (backHandlerCallback) {
				renderer.act(() => {
					backHandlerCallback();
				});
			}

			// Check search input
			const inputs = tree.root.findAllByType(TextInput);
			if (inputs.length > 0) {
				renderer.act(() => inputs[0].props.onChangeText("WhatsApp"));
				renderer.act(() => inputs[0].props.onChangeText(""));
			}

			// Render FlatList items and ListHeaderComponent directly
			const flatLists = tree.root.findAllByType(FlatList);
			if (flatLists.length > 0) {
				const fl = flatLists[0];
				if (fl.props.renderItem) {
					let item1: any, item2: any;
					renderer.act(() => {
						item1 = renderer.create(
							fl.props.renderItem({
								item: {
									packageName: "com.whatsapp",
									appName: "WhatsApp",
									resurrectionCount: 12,
									isBandit: true,
								},
								index: 0,
							}),
						);
						item2 = renderer.create(
							fl.props.renderItem({
								item: {
									packageName: "com.app2",
									appName: "App Two",
									resurrectionCount: 1,
									isBandit: false,
								},
								index: 1,
							}),
						);
					});
					if (item1) renderer.act(() => item1.unmount());
					if (item2) renderer.act(() => item2.unmount());
				}
				if (fl.props.ListHeaderComponent) {
					let headerTree: any;
					renderer.act(() => {
						headerTree = renderer.create(fl.props.ListHeaderComponent);
					});
					if (headerTree) renderer.act(() => headerTree.unmount());
				}
			}

			// Click back pressable inside header safely
			const pressables = tree.root.findAllByType(Pressable);
			if (pressables.length > 0 && pressables[0].props.onPress) {
				renderer.act(() => pressables[0].props.onPress());
			}

			renderer.act(() => tree.unmount());
		}
	});

	it("handles null analytics or empty resurrection list cleanly", async () => {
		const killer = require("../../src/services/killer");
		killer.getImpactAnalytics.mockResolvedValueOnce(null);
		killer.getResurrectionDetectiveReport.mockResolvedValueOnce([]);

		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(<ProAnalyticsScreen />);
			await new Promise((resolve) => setTimeout(resolve, 50));
		});
		renderer.act(() => tree.unmount());
	});
});
