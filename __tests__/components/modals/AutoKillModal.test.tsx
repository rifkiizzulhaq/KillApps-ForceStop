// @ts-nocheck
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import renderer from "react-test-renderer";
import { AutoKillModal } from "../../../src/components/modals/AutoKillModal";

let mockDark = false;
let mockState: any = {};

jest.mock("../../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		isDark: mockDark,
		colors: {
			bgClass: mockDark ? "bg-black" : "bg-white",
			modalBgClass: mockDark ? "bg-zinc-950" : "bg-white",
			cardClass: mockDark ? "bg-zinc-900" : "bg-zinc-100",
			cardBorderClass: mockDark ? "border-zinc-800" : "border-zinc-200",
			inputBgClass: mockDark ? "bg-zinc-900" : "bg-zinc-100",
			textClass: mockDark ? "text-white" : "text-black",
			subTextClass: mockDark ? "text-zinc-400" : "text-zinc-600",
			captionClass: mockDark ? "text-zinc-500" : "text-zinc-400",
			primaryBtnClass: mockDark ? "bg-white" : "bg-black",
			primaryBtnTextClass: mockDark ? "text-black" : "text-white",
			secondaryBtnClass: mockDark ? "bg-zinc-800" : "bg-zinc-200",
			secondaryBtnTextClass: mockDark ? "text-white" : "text-black",
			iconColor: mockDark ? "#ffffff" : "#000000",
			subIconColor: mockDark ? "#a1a1aa" : "#52525b",
			statusBarStyle: mockDark ? "light-content" : "dark-content",
			statusBarBg: mockDark ? "#000000" : "#ffffff",
			dividerClass: mockDark ? "divide-zinc-800" : "divide-zinc-200",
			borderClass: mockDark ? "border-zinc-800" : "border-zinc-200",
		},
	}),
}));

jest.mock("../../../src/stores/useAppStore", () => ({
	useAppStore: (selector: any) => selector(mockState),
}));

describe("AutoKillModal", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockDark = false;
		mockState = {
			settings: { autoKillEnabled: false, autoKillIntervalMinutes: 60 },
			updateSetting: jest.fn(),
		};
	});

	afterEach(() => {
		renderer.act(() => {
			jest.runOnlyPendingTimers();
		});
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("renders, toggles enable, selects intervals, and closes", () => {
		const onClose = jest.fn();
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(
				<AutoKillModal visible={true} onClose={onClose} />,
			);
		});

		// Trigger interval options
		const pressables = tree.root.findAll((node: any) => node.props?.onPress);
		for (const p of pressables) {
			renderer.act(() => p.props.onPress());
		}

		// Trigger onRequestClose on Modal
		const modals = tree.root.findAllByType("Modal" as any);
		if (modals.length > 0) {
			renderer.act(() => modals[0].props.onRequestClose());
		}

		expect(mockState.updateSetting).toHaveBeenCalled();
		renderer.act(() => tree.unmount());
	});

	it("renders when active in dark mode", () => {
		mockDark = true;
		mockState.settings.autoKillEnabled = true;
		mockState.settings.autoKillIntervalMinutes = 30;
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(
				<AutoKillModal visible={true} onClose={jest.fn()} />,
			);
		});
		renderer.act(() => tree.unmount());
	});
});
