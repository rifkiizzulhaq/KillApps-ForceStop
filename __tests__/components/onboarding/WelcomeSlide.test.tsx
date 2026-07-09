// @ts-nocheck
import { describe, it, jest } from "@jest/globals";
import renderer from "react-test-renderer";
import { WelcomeSlide } from "../../../src/components/onboarding/WelcomeSlide";

let mockDark = false;

jest.mock("../../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		isDark: mockDark,
		colors: {
			cardClass: "bg-white",
			cardBorderClass: "border-gray",
			textClass: "text-black",
			subTextClass: "text-gray",
			iconColor: "#000",
		},
	}),
}));

describe("WelcomeSlide", () => {
	it("renders across light and dark themes", async () => {
		for (const dark of [false, true]) {
			mockDark = dark;
			let tree: any;
			await renderer.act(async () => {
				tree = renderer.create(<WelcomeSlide />);
			});
			renderer.act(() => tree.unmount());
		}
	});
});
