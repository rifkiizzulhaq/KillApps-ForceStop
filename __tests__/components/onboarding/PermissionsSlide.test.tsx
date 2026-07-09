// @ts-nocheck
import { describe, it, jest } from "@jest/globals";
import { PermissionsAndroid, Platform, Pressable } from "react-native";
import renderer from "react-test-renderer";
import { PermissionsSlide } from "../../../src/components/onboarding/PermissionsSlide";

let mockDark = false;
jest.mock("../../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		isDark: mockDark,
		colors: {
			cardClass: "bg-white",
			cardBorderClass: "border-gray",
			textClass: "text-black",
			subTextClass: "text-gray",
			primaryBtnClass: "bg-black",
			primaryBtnTextClass: "text-white",
		},
	}),
}));

describe("PermissionsSlide", () => {
	it("renders all branches across sdk levels 30 and 33, granted vs ungranted, and dark vs light themes", async () => {
		jest
			.spyOn(PermissionsAndroid, "request")
			.mockResolvedValue("granted" as any);
		for (const isDark of [false, true]) {
			for (const sdkLevel of [30, 33]) {
				for (const granted of [false, true]) {
					for (const os of ["android", "ios"]) {
						mockDark = isDark;
						Platform.OS = os as any;
						const checkPermissions = jest.fn();

						let tree: any;
						await renderer.act(async () => {
							tree = renderer.create(
								<PermissionsSlide
									sdkLevel={sdkLevel}
									getAndroidVersionName={(level: number) =>
										`Android ${level - 20}`
									}
									notifGranted={granted}
									checkSystemPermissions={checkPermissions}
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
		}
	});
});
