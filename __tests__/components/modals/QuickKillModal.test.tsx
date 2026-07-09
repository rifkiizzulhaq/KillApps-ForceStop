// @ts-nocheck
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Pressable } from "react-native";
import renderer from "react-test-renderer";
import { QuickKillModal } from "../../../src/components/modals/QuickKillModal";

let mockDark = false;
let mockApps: any[] = [];
let mockHibernationList: string[] = [];
let mockIsKilling = false;

jest.mock("../../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		isDark: mockDark,
		colors: {
			modalBgClass: "bg-white",
			borderClass: "border-gray",
			cardClass: "bg-white",
			cardBorderClass: "border-gray",
			textClass: "text-black",
			subTextClass: "text-gray",
			captionClass: "text-gray",
			iconColor: "#000",
			primaryBtnClass: "bg-black",
			primaryBtnTextClass: "text-white",
			secondaryBtnClass: "bg-gray",
		},
	}),
}));

jest.mock("../../../src/stores/useAppStore", () => ({
	useAppStore: (selector: any) =>
		selector({
			apps: mockApps,
			hibernationList: mockHibernationList,
			isKilling: mockIsKilling,
			killSingleApp: jest.fn().mockResolvedValue(true as any),
			killHibernationApps: jest.fn().mockResolvedValue(true as any),
		}),
}));

describe("QuickKillModal", () => {
	beforeEach(() => {
		mockDark = false;
		mockApps = [];
		mockHibernationList = [];
		mockIsKilling = false;
	});

	it("renders empty state when no active targets", () => {
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(
				<QuickKillModal visible={true} onClose={jest.fn()} />,
			);
		});
		expect(tree.toJSON()).not.toBeNull();
		renderer.act(() => tree.unmount());
	});

	it("renders active targets, selects one, and kills single app", async () => {
		mockApps = [
			{
				packageName: "com.app1",
				appName: "App One",
				icon: "http://icon1",
				isStopped: false,
			},
			{ packageName: "com.app2", appName: "App Two", isStopped: false },
		];
		mockHibernationList = ["com.app1", "com.app2"];

		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(
				<QuickKillModal visible={true} onClose={jest.fn()} />,
			);
		});

		const pressables = tree.root.findAllByType(Pressable);
		// Select app 1
		if (pressables.length > 1) {
			await renderer.act(async () => {
				pressables[1].props.onPress();
			});
		}

		// Find kill button for selected app and press all remaining buttons
		for (const p of pressables) {
			if (p.props.onPress && p !== pressables[0]) {
				await renderer.act(async () => {
					await p.props.onPress();
				});
			}
		}

		renderer.act(() => tree.unmount());
	});

	it("kills all hibernation apps when > 1 targets in dark mode", async () => {
		mockDark = true;
		mockIsKilling = true;
		mockApps = [
			{ packageName: "com.app1", appName: "App One", isStopped: false },
			{ packageName: "com.app2", appName: "App Two", isStopped: false },
		];
		mockHibernationList = ["com.app1", "com.app2"];

		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(
				<QuickKillModal visible={true} onClose={jest.fn()} />,
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
	});
});
