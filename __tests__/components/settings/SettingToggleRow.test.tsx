// @ts-nocheck
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import renderer from "react-test-renderer";
import { SettingToggleRow } from "../../../src/components/settings/SettingToggleRow";

let mockDark = false;
jest.mock("../../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		isDark: mockDark,
		colors: {
			textClass: "text-black",
			subTextClass: "text-gray",
		},
	}),
}));

jest.mock("../../../src/components/common/ModernToggle", () => ({
	ModernToggle: (props: any) => <div testID="ModernToggle" {...props} />,
}));

describe("SettingToggleRow", () => {
	beforeEach(() => {
		mockDark = false;
	});

	it("renders title, subtitle, and calls onValueChange when toggle is pressed", () => {
		const onValueChange = jest.fn();
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(
				<SettingToggleRow
					title="Test Title"
					subtitle="Test Subtitle"
					value={false}
					onValueChange={onValueChange}
				/>,
			);
		});

		const toggle = tree.root.findByProps({ testID: "ModernToggle" });
		renderer.act(() => toggle.props.onValueChange(true));
		expect(onValueChange).toHaveBeenCalledWith(true);
		renderer.act(() => tree.unmount());
	});

	it("renders disabled state in dark mode", () => {
		mockDark = true;
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(
				<SettingToggleRow
					title="Test Title"
					subtitle="Test Subtitle"
					value={true}
					onValueChange={jest.fn()}
					disabled={true}
				/>,
			);
		});
		renderer.act(() => tree.unmount());
	});
});
