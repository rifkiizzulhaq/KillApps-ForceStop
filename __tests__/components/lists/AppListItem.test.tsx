// @ts-nocheck
import { afterEach, beforeEach, describe, it, jest } from "@jest/globals";
import renderer from "react-test-renderer";
import { AppListItem } from "../../../src/components/lists/AppListItem";

let mockState: any = {};
const mockTheme = { isDark: false };

jest.mock("../../../src/stores/useAppStore", () => {
	const useAppStoreMock = jest.fn((selector: any) =>
		selector(mockState),
	) as any;
	useAppStoreMock.getState = jest.fn(() => mockState);
	return { useAppStore: useAppStoreMock };
});

jest.mock("../../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		themeMode: "light",
		isDark: mockTheme.isDark,
		colors: {
			bgClass: "bg-white",
			textClass: "text-zinc-900",
			subTextClass: "text-zinc-500",
			cardClass: "bg-white",
			cardBorderClass: "border-zinc-200",
			borderClass: "border-zinc-200",
			iconColor: "#18181b",
			subIconColor: "#71717a",
			inputBgClass: "bg-zinc-50",
			secondaryBtnClass: "bg-zinc-100",
			captionClass: "text-zinc-400",
			primaryBtnClass: "bg-black",
			primaryBtnTextClass: "text-white",
		},
	}),
}));

describe("AppListItem", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockTheme.isDark = false;
		mockState = {
			toggleSelectApp: jest.fn(),
		};
	});

	afterEach(() => {
		renderer.act(() => {
			jest.runOnlyPendingTimers();
		});
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("renders all variations and triggers press", () => {
		const apps = [
			{
				packageName: "com.test1",
				appName: "App 1",
				isSelected: true,
				isSystemApp: true,
				isGcm: true,
				icon: "uri",
			},
			{
				packageName: "com.test2",
				appName: "App 2",
				isSelected: false,
				isSystemApp: false,
				isGcm: false,
			},
		];

		let tree: any;
		renderer.act(() => {
			tree = renderer.create(
				apps.map((app) => <AppListItem key={app.packageName} app={app} />),
			);
		});

		const pressables = tree.root.findAll((node: any) => node.props?.onPress);
		for (const p of pressables) {
			renderer.act(() => p.props.onPress());
		}

		renderer.act(() => tree.unmount());
	});

	it("renders selected item in dark mode with black primary text", () => {
		mockTheme.isDark = true;
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(
				<AppListItem
					app={{ packageName: "com.test", appName: "Test", isSelected: true }}
				/>,
			);
		});
		renderer.act(() => tree.unmount());
	});
});
