// @ts-nocheck
import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import renderer from "react-test-renderer";
import { InfoModal } from "../../../src/components/modals/InfoModal";

jest.mock("../../../src/stores/useAppStore", () => ({
	useAppStore: Object.assign(
		jest.fn((selector?: any) => {
			const mockState = {
				settings: { workingMode: "shizuku", autoHibernation: false },
				apps: [] as any[],
				hibernationList: [] as any[],
				setSettings: jest.fn(),
				isPermissionGranted: true,
				isRootActive: true,
				isShizukuActive: true,
			};
			return selector ? selector(mockState) : mockState;
		}),
		{
			getState: jest.fn(() => ({
				settings: { workingMode: "shizuku", autoHibernation: false },
				apps: [] as any[],
				hibernationList: [] as any[],
				setSettings: jest.fn(),
				isPermissionGranted: true,
				isRootActive: true,
				isShizukuActive: true,
			})),
		},
	),
}));

jest.mock("../../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		colors: {
			bgClass: "bg-white",
			textClass: "text-black",
			cardClass: "bg-white",
			primaryBtnClass: "bg-black",
		},
		themeMode: "light",
		isDark: false,
	}),
}));

jest.mock("../../../src/services/killer/NativeKillerModule", () => ({
	NativeKillerModule: {
		checkPermission: jest.fn().mockResolvedValue(true),
		checkRootAccess: jest.fn().mockResolvedValue(false),
		requestPermission: jest.fn().mockResolvedValue(true),
		killApps: jest.fn().mockResolvedValue({
			success: [] as string[],
			failed: [] as string[],
			webviewSkipped: [] as string[],
			savedRamMb: 0,
		}),
		killAppsViaRoot: jest.fn().mockResolvedValue({
			success: [] as string[],
			failed: [] as string[],
			webviewSkipped: [] as string[],
			savedRamMb: 0,
		}),
		getInstalledApps: jest.fn().mockResolvedValue([]),
		setAutoHibernationConfig: jest.fn(),
		setQuickActionNotification: jest.fn(),
		setWorkingMode: jest.fn(),
		setGeekOptions: jest.fn(),
		setHibernationOptions: jest.fn(),
		freezeQuarantinePackage: jest
			.fn()
			.mockResolvedValue({ success: true, errorCode: null }),
		unfreezeQuarantinePackage: jest
			.fn()
			.mockResolvedValue({ success: true, errorCode: null }),
	},
}));

describe("InfoModal", () => {
	it("renders correctly", () => {
		const props = {
			app: { packageName: "com.test", appName: "Test" },
			visible: true,
			onClose: jest.fn(),
			onConfirm: jest.fn(),
			onSelect: jest.fn(),
			title: "Test",
			message: "Test Message",
			checked: false,
			onToggle: jest.fn(),
			value: false,
			onValueChange: jest.fn(),
			isActive: true,
			label: "Label",
			options: [{ label: "opt", id: "1" }],
			data: [],
			sections: [],
			list: [],
			items: [],
		} as any;

		let tree: any;
		renderer.act(() => {
			tree = renderer.create(React.createElement(InfoModal as any, props));
		});
		expect(tree).toBeTruthy();
	});
});
