// @ts-nocheck
import { describe, it, jest } from "@jest/globals";
import { Pressable } from "react-native";
import renderer from "react-test-renderer";
import { HibernationListItem } from "../../../src/components/lists/HibernationListItem";

let mockDark = false;

jest.mock("../../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		isDark: mockDark,
		colors: {
			cardClass: "bg-white",
			cardBorderClass: "border-gray",
			textClass: "text-black",
			subTextClass: "text-gray",
			secondaryBtnClass: "bg-gray",
			secondaryBtnTextClass: "text-black",
			borderClass: "border-gray",
			primaryBtnClass: "bg-black",
			primaryBtnTextClass: "text-white",
		},
	}),
}));

describe("HibernationListItem", () => {
	it("renders all permutations of badges, icons, stopped state across light and dark themes", async () => {
		for (const isDark of [false, true]) {
			mockDark = isDark;
			for (const hasIcon of [false, true]) {
				for (const isGcm of [false, true]) {
					for (const isMedia of [false, true]) {
						for (const isSmart of [false, true]) {
							for (const isStopped of [false, true]) {
								const app = {
									packageName: "com.test.app",
									appName: "Test App",
									icon: hasIcon ? "http://icon" : null,
									isGcm,
									isStopped,
								};
								let tree: any;
								await renderer.act(async () => {
									tree = renderer.create(
										<HibernationListItem
											app={app}
											onRemove={jest.fn()}
											onKill={jest.fn()}
											disabled={false}
											isSmartProtected={isSmart}
											isMediaApp={isMedia}
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
					}
				}
			}
		}
	});
});
