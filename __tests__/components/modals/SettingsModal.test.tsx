// @ts-nocheck
import { beforeEach, describe, it, jest } from "@jest/globals";
import { Modal, Pressable, ScrollView } from "react-native";
import renderer from "react-test-renderer";
import { SettingsModal } from "../../../src/components/modals/SettingsModal";

let mockDark = false;
let mockState: any = {};

jest.mock("../../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		isDark: mockDark,
		colors: {
			modalBgClass: "bg-white",
			borderClass: "border-gray",
			textClass: "text-black",
			subTextClass: "text-gray",
			cardClass: "bg-white",
			iconColor: "#000",
		},
	}),
}));

jest.mock("../../../src/stores/useAppStore", () => {
	const useAppStoreMock = jest.fn((selector: any) =>
		selector(mockState),
	) as any;
	useAppStoreMock.getState = jest.fn(() => mockState);
	return { useAppStore: useAppStoreMock };
});

jest.mock("../../../src/components/settings/SettingsMainTab", () => ({
	SettingsMainTab: () => <div testID="SettingsMainTab" />,
}));
jest.mock("../../../src/components/settings/SettingsTroubleshootTab", () => ({
	SettingsTroubleshootTab: () => <div testID="SettingsTroubleshootTab" />,
}));
jest.mock("../../../src/components/common/ModeStatusCard", () => ({
	ModeStatusCard: () => <div testID="ModeStatusCard" />,
}));

describe("SettingsModal", () => {
	beforeEach(() => {
		mockDark = false;
		mockState = {
			currentScreen: "settings",
			settings: {
				workingMode: "root",
				settingsScrollY: 100,
				smoothScroll: true,
			},
			setCurrentScreen: jest.fn(),
			setSettingsScrollY: jest.fn(),
		};
	});

	it("covers both tabs, initialScrollY layout, scroll events and onRequestClose across light/dark themes", () => {
		for (const dark of [false, true]) {
			for (const smooth of [false, true]) {
				for (const scrollY of [0, 150]) {
					mockDark = dark;
					mockState.settings.smoothScroll = smooth;
					mockState.settings.settingsScrollY = scrollY;

					let tree: any;
					renderer.act(() => {
						tree = renderer.create(<SettingsModal />);
					});

					const modals = tree.root.findAllByType(Modal);
					if (modals.length > 0 && modals[0].props.onRequestClose) {
						renderer.act(() => modals[0].props.onRequestClose());
					}

					const pressables = tree.root.findAllByType(Pressable);
					for (const p of pressables) {
						if (p.props.onPress) renderer.act(() => p.props.onPress());
					}

					const scroll = tree.root.findAllByType(ScrollView)[0];
					if (scroll) {
						renderer.act(() => {
							if (scroll.props.onLayout) scroll.props.onLayout();
							if (scroll.props.onScrollEndDrag)
								scroll.props.onScrollEndDrag({
									nativeEvent: { contentOffset: { y: 200 } },
								});
							if (scroll.props.onMomentumScrollEnd)
								scroll.props.onMomentumScrollEnd({
									nativeEvent: { contentOffset: { y: 250 } },
								});
						});
					}

					renderer.act(() => tree.unmount());
				}
			}
		}
	});
});
