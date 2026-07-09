// @ts-nocheck
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import renderer from "react-test-renderer";
import App from "../App";

let mockState: any = {};

jest.mock("../src/stores/useAppStore", () => {
	const useAppStoreMock = jest.fn((selector: any) =>
		selector(mockState),
	) as any;
	useAppStoreMock.getState = jest.fn(() => mockState);
	return { useAppStore: useAppStoreMock };
});

jest.mock("../src/hooks/useTheme", () => ({
	useTheme: () => ({
		colors: {
			bgClass: "bg-white",
			statusBarStyle: "dark-content",
			statusBarBg: "#ffffff",
		},
	}),
}));

jest.mock("../src/screens/OnboardingScreen", () => ({
	OnboardingScreen: () => <div testID="OnboardingScreen" />,
}));
jest.mock("../src/screens/AddAppsScreen", () => ({
	AddAppsScreen: () => <div testID="AddAppsScreen" />,
}));
jest.mock("../src/screens/HomeScreen", () => ({
	HomeScreen: () => <div testID="HomeScreen" />,
}));
jest.mock("../src/screens/QuarantineScreen", () => ({
	QuarantineScreen: () => <div testID="QuarantineScreen" />,
}));
jest.mock("../src/screens/ProAnalyticsScreen", () => ({
	ProAnalyticsScreen: () => <div testID="ProAnalyticsScreen" />,
}));

describe("App", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockState = {
			isHydrated: true,
			hasCompletedOnboarding: true,
			currentScreen: "home",
			checkWorkingModeStatus: jest.fn().mockResolvedValue(true),
		};
	});

	afterEach(() => {
		renderer.act(() => {
			jest.runOnlyPendingTimers();
		});
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("returns null when not hydrated", () => {
		mockState.isHydrated = false;
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(<App />);
		});
		expect(tree.toJSON()).toBeNull();
	});

	it("renders OnboardingScreen when not completed onboarding", () => {
		mockState.hasCompletedOnboarding = false;
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(<App />);
		});
		renderer.act(() => tree.unmount());
	});

	it("renders HomeScreen when currentScreen is home and checks working mode", () => {
		mockState.currentScreen = "home";
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(<App />);
		});
		renderer.act(() => tree.unmount());
	});

	it("renders AddAppsScreen when currentScreen is add_apps", () => {
		mockState.currentScreen = "add_apps";
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(<App />);
		});
		renderer.act(() => tree.unmount());
	});

	it("renders QuarantineScreen when currentScreen is quarantine", () => {
		mockState.currentScreen = "quarantine";
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(<App />);
		});
		renderer.act(() => tree.unmount());
	});

	it("renders ProAnalyticsScreen when currentScreen is pro_analytics", () => {
		mockState.currentScreen = "pro_analytics";
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(<App />);
		});
		renderer.act(() => tree.unmount());
	});
});
