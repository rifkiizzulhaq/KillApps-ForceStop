// @ts-nocheck
import { afterEach, beforeEach, describe, it, jest } from "@jest/globals";
import { PermissionsAndroid, Platform, Pressable } from "react-native";
import renderer from "react-test-renderer";
import { InfoModal } from "../../src/components/modals/InfoModal";
import { PermissionsSlide } from "../../src/components/onboarding/PermissionsSlide";
import { OnboardingScreen } from "../../src/screens/OnboardingScreen";

let mockDark = false;
let mockState: any = {};

jest.mock("../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		isDark: mockDark,
		colors: {
			bgClass: "bg-white",
			cardClass: "bg-white",
			textClass: "text-black",
			subTextClass: "text-gray",
			primaryBtnClass: "bg-black",
			primaryBtnTextClass: "text-white",
			borderClass: "border-gray",
		},
	}),
}));

jest.mock("../../src/stores/useAppStore", () => {
	const useAppStoreMock = jest.fn((selector: any) => {
		if (typeof selector === "function") return selector(mockState);
		return mockState;
	}) as any;
	useAppStoreMock.getState = jest.fn(() => mockState);
	return { useAppStore: useAppStoreMock };
});

describe("OnboardingScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockDark = false;
		mockState = {
			settings: { workingMode: "shizuku" },
			updateSetting: jest.fn(),
			resetOnboarding: jest.fn(),
			completeOnboarding: jest.fn(),
			isShizukuActive: true,
			permissions: { isPermissionGranted: false },
			isPermissionGranted: false,
			isRootActive: true,
			checkWorkingModeStatus: jest.fn().mockResolvedValue(true as any),
			requestShizukuPermission: jest.fn().mockResolvedValue(true as any),
			requestRootAccess: jest.fn().mockResolvedValue(true as any),
		};
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("steps through slides across all modes, permissions, and OS API versions", async () => {
		jest
			.spyOn(PermissionsAndroid, "check")
			.mockImplementation(async () => true as any);

		for (const isDark of [false, true]) {
			for (const mode of ["shizuku", "root"]) {
				for (const shizukuActive of [false, true]) {
					for (const permGranted of [false, true]) {
						for (const os of ["android", "ios"]) {
							for (const api of [28, 33]) {
								mockDark = isDark;
								mockState.settings.workingMode = mode;
								mockState.isShizukuActive = shizukuActive;
								mockState.isPermissionGranted = permGranted;
								mockState.isRootActive = mode === "root" && permGranted;
								Platform.OS = os as any;
								Platform.Version = api as any;

								let tree: any;
								await renderer.act(async () => {
									tree = renderer.create(<OnboardingScreen />);
								});

								// Step 1 -> Step 2
								let pressables = tree.root.findAllByType(Pressable);
								if (pressables.length > 0) {
									await renderer.act(async () => {
										await pressables[pressables.length - 1].props.onPress();
									});
								}

								// Test checkSystemPermissions on Step 2
								await renderer.act(async () => {
									jest.advanceTimersByTime(100);
								});

								// Step 2 -> Step 3
								pressables = tree.root.findAllByType(Pressable);
								if (pressables.length > 0) {
									await renderer.act(async () => {
										await pressables[pressables.length - 1].props.onPress();
									});
								}

								// Advance timers for startVerification timeout
								await renderer.act(async () => {
									jest.advanceTimersByTime(600);
								});

								// Check PermissionsSlide getAndroidVersionName call
								const permSlide = tree.root.findAllByType(PermissionsSlide)[0];
								if (permSlide?.props.getAndroidVersionName) {
									for (const testApi of [20, 21, 23, 24, 26, 28, 29, 33]) {
										permSlide.props.getAndroidVersionName(testApi);
									}
								}

								// Step 3 button ("Masuk ke Aplikasi")
								pressables = tree.root.findAllByType(Pressable);
								if (pressables.length > 0) {
									await renderer.act(async () => {
										await pressables[pressables.length - 1].props.onPress();
									});
								}

								// Close InfoModal if shown
								const infoModals = tree.root.findAllByType(InfoModal);
								for (const im of infoModals) {
									if (im.props.onClose) {
										renderer.act(() => im.props.onClose());
									}
								}

								renderer.act(() => tree.unmount());
							}
						}
					}
				}
			}
		}
	});

	it("clicks Kembali button on Step 2", async () => {
		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(<OnboardingScreen />);
		});
		let pressables = tree.root.findAllByType(Pressable);
		if (pressables.length > 0) {
			await renderer.act(async () => {
				await pressables[pressables.length - 1].props.onPress();
			});
		}
		pressables = tree.root.findAllByType(Pressable);
		if (pressables.length > 0) {
			await renderer.act(async () => {
				await pressables[0].props.onPress();
			});
		}
		renderer.act(() => tree.unmount());
	});
});
