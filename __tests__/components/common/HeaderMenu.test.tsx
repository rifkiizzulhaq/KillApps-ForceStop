// @ts-nocheck
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Pressable } from "react-native";
import renderer from "react-test-renderer";
import { HeaderMenu } from "../../../src/components/common/HeaderMenu";

let mockDark = false;
jest.mock("../../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		isDark: mockDark,
		colors: {
			textClass: "text-black",
			subTextClass: "text-gray",
			cardClass: "bg-white",
			borderClass: "border-gray",
			iconColor: "#000",
			secondaryBtnClass: "bg-gray",
		},
	}),
}));

describe("HeaderMenu", () => {
	beforeEach(() => {
		mockDark = false;
	});

	it("opens menu and clicks options safely without unmounting", () => {
		const onSettings = jest.fn();
		const onAbout = jest.fn();
		const options = [
			{ label: "Settings", onPress: onSettings },
			{ label: "About", onPress: onAbout },
		];

		let tree: any;
		renderer.act(() => {
			tree = renderer.create(<HeaderMenu options={options} />);
		});

		const trigger = tree.root.findAllByType(Pressable)[0];

		// 1. Open modal and click Settings
		renderer.act(() => trigger.props.onPress());
		let allPressables = tree.root.findAllByType(Pressable);
		if (allPressables.length > 2 && allPressables[2].props.onPress) {
			renderer.act(() => allPressables[2].props.onPress());
		}

		// 2. Open modal again and click About
		renderer.act(() => trigger.props.onPress());
		allPressables = tree.root.findAllByType(Pressable);
		if (allPressables.length > 3 && allPressables[3].props.onPress) {
			renderer.act(() => allPressables[3].props.onPress());
		}

		// 3. Open modal and click overlay to close
		renderer.act(() => trigger.props.onPress());
		allPressables = tree.root.findAllByType(Pressable);
		if (allPressables.length > 1 && allPressables[1].props.onPress) {
			renderer.act(() => allPressables[1].props.onPress());
		}

		expect(onSettings).toHaveBeenCalled();
		expect(onAbout).toHaveBeenCalled();
		renderer.act(() => tree.unmount());
	});

	it("renders in dark mode", () => {
		mockDark = true;
		const options = [{ label: "Settings", onPress: jest.fn() }];
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(<HeaderMenu options={options} />);
		});
		renderer.act(() => tree.unmount());
	});
});
