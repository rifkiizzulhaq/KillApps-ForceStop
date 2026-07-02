import { describe, expect, it, jest } from "@jest/globals";
import "react-native";
import { PermissionsAndroid, Text } from "react-native";
import renderer from "react-test-renderer";
import { OnboardingScreen } from "../../src/screens/OnboardingScreen";
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

jest.mock("../../src/stores/useAppStore", () => ({
	useAppStore: jest.fn((selector: (state: unknown) => unknown) => {
		const state = {
			settings: { workingMode: "shizuku" },
			updateSetting: jest.fn(),
			completeOnboarding: jest.fn(),
			isShizukuActive: false,
			isPermissionGranted: false,
			isRootActive: false,
			isLoading: false,
			checkShizukuStatus: jest.fn().mockResolvedValue(true as never),
			requestShizukuPermission: jest.fn(),
			checkRootStatus: jest.fn().mockResolvedValue(false as never),
		};
		return selector(state);
	}),
}));

jest.mock("lucide-react-native", () => ({
	Check: "Check",
	Settings: "Settings",
	Shield: "Shield",
	ShieldAlert: "ShieldAlert",
	Terminal: "Terminal",
	Zap: "Zap",
}));

describe("OnboardingScreen", () => {
	it("renders correctly on Step 1 (Shizuku Mode)", () => {
		const tree = renderer.create(<OnboardingScreen />).toJSON();
		expect(tree).toBeTruthy();
	});

	it("renders correctly on Step 1 (Root Mode)", () => {
		(useAppStore as unknown as jest.Mock).mockImplementation(
			(selector: unknown) => {
				const state = {
					settings: { workingMode: "root" },
					updateSetting: jest.fn(),
					completeOnboarding: jest.fn(),
					isShizukuActive: false,
					isPermissionGranted: false,
					isRootActive: true,
					isLoading: false,
					checkShizukuStatus: jest.fn().mockResolvedValue(false as never),
					requestShizukuPermission: jest.fn(),
					checkRootStatus: jest.fn().mockResolvedValue(true as never),
				};
				return (selector as (state: unknown) => unknown)(state);
			},
		);

		const tree = renderer.create(<OnboardingScreen />).toJSON();
		expect(tree).toBeTruthy();
	});

	it("navigates to Step 2 (Android Permissions) and checks permissions", async () => {
		// Mock PermissionsAndroid check to always return true
		jest.spyOn(PermissionsAndroid, "check").mockResolvedValue(true);

		const component = renderer.create(<OnboardingScreen />);
		const tree = component.root;

		// Find the "Lanjut" button and press it
		let textNode = tree
			.findAllByType(Text)
			.find((node) => node.props.children === "Lanjut");

		let onPressFn: (() => void) | null = null;
		while (textNode?.parent) {
			if (textNode.parent.props.onPress) {
				onPressFn = textNode.parent.props.onPress;
				break;
			}
			textNode = textNode.parent;
		}

		expect(onPressFn).toBeTruthy();

		// Use act to process state updates from onPress
		await renderer.act(async () => {
			if (onPressFn) onPressFn();
		});

		// Verify we moved to Step 2
		const step2Title = tree
			.findAllByType(Text)
			.find((node) => node.props.children === "Perizinan Android");

		expect(step2Title).toBeTruthy();
	});
});
