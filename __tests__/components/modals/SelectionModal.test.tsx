// @ts-nocheck
import { describe, it, jest } from "@jest/globals";
import { Pressable } from "react-native";
import renderer from "react-test-renderer";
import { SelectionModal } from "../../../src/components/modals/SelectionModal";

let mockDark = false;
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

describe("SelectionModal", () => {
	it("renders all badge types (emerald, amber, cyan, default) and selection states in light/dark mode", () => {
		const options = [
			{
				id: 1,
				label: "Option One",
				description: "Desc 1",
				badge: "POPULAR",
				badgeType: "emerald",
			},
			{
				id: 2,
				label: "Option Two",
				description: "Desc 2",
				badge: "NEW",
				badgeType: "amber",
			},
			{
				id: 3,
				label: "Option Three",
				description: "Desc 3",
				badge: "PRO",
				badgeType: "cyan",
			},
			{ id: 4, label: "Option Four", badge: "BASIC", badgeType: "other" },
			{ id: 5, label: "Option Five" },
		];

		for (const dark of [false, true]) {
			for (const selected of [1, 2, 5]) {
				mockDark = dark;
				let tree: any;
				renderer.act(() => {
					tree = renderer.create(
						<SelectionModal
							visible={true}
							title="Select Item"
							options={options}
							selectedValue={selected}
							onSelect={jest.fn()}
							onClose={jest.fn()}
						/>,
					);
				});

				const pressables = tree.root.findAllByType(Pressable);
				for (const p of pressables) {
					if (p.props.onPress) renderer.act(() => p.props.onPress());
				}

				renderer.act(() => tree.unmount());
			}
		}
	});
});
