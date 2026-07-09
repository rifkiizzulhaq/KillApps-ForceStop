// @ts-nocheck
import { beforeEach, describe, it, jest } from "@jest/globals";
import { Pressable } from "react-native";
import renderer from "react-test-renderer";
import { WorkingModeSlide } from "../../../src/components/onboarding/WorkingModeSlide";

let mockState: any = {};

jest.mock("../../../src/stores/useAppStore", () => {
	const useAppStoreMock = jest.fn((selector: any) =>
		selector(mockState),
	) as any;
	useAppStoreMock.getState = jest.fn(() => mockState);
	return { useAppStore: useAppStoreMock };
});

describe("WorkingModeSlide", () => {
	beforeEach(() => {
		mockState = {
			settings: { workingMode: "shizuku" },
			updateSetting: jest.fn(),
			isShizukuActive: true,
			permissions: { isPermissionGranted: true },
			isPermissionGranted: true,
			isRootActive: true,
			checkWorkingModeStatus: jest.fn().mockResolvedValue(true as any),
			requestShizukuPermission: jest.fn().mockResolvedValue(true as any),
			requestRootAccess: jest.fn().mockResolvedValue(true as any),
		};
	});

	it("renders all working modes (shizuku, root, adb) in both dark and light theme branches", async () => {
		for (const dark of [false, true]) {
			for (const mode of ["shizuku", "root", "adb"]) {
				for (const granted of [false, true]) {
					mockState.settings.workingMode = mode;
					mockState.isPermissionGranted = granted;
					let tree: any;
					await renderer.act(async () => {
						tree = renderer.create(
							<WorkingModeSlide
								isDark={dark}
								isVerifying={false}
								setIsVerifying={jest.fn()}
								startVerification={jest.fn()}
								isModeVerified={granted}
							/>,
						);
					});

					const pressables = tree.root.findAllByType(Pressable);
					for (const p of pressables) {
						if (p.props.onPress) {
							await renderer.act(async () => {
								await p.props.onPress();
							});
						}
					}
					renderer.act(() => tree.unmount());
				}
			}
		}
	});
});
