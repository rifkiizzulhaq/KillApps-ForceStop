// @ts-nocheck
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import renderer from "react-test-renderer";
import { KillMessageCard } from "../../../src/components/home/KillMessageCard";

let mockDark = false;
const mock_colors = {
	cardClass: "bg-zinc-100",
	cardBorderClass: "border-zinc-200",
	textClass: "text-black",
};

jest.mock("../../../src/hooks/useTheme", () => ({
	useTheme: () => ({ isDark: mockDark, colors: mock_colors }),
}));

describe("KillMessageCard", () => {
	beforeEach(() => {
		mockDark = false;
	});

	it("renders message and handles clearKillMessage", () => {
		const clearKillMessage = jest.fn();
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(
				<KillMessageCard
					killMessage="App killed successfully"
					clearKillMessage={clearKillMessage}
				/>,
			);
		});

		const pressable = tree.root.findByProps({
			testID: "kill-message-pressable",
		});
		renderer.act(() => pressable.props.onPress());
		expect(clearKillMessage).toHaveBeenCalled();

		renderer.act(() => tree.unmount());
	});

	it("renders smart and shallow hibernation tags in dark mode", () => {
		mockDark = true;
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(
				<KillMessageCard
					killMessage="Hibernated 2 apps"
					clearKillMessage={jest.fn()}
					isSmartHibernation={true}
					isShallowHibernation={true}
				/>,
			);
		});
		renderer.act(() => tree.unmount());
	});
});
