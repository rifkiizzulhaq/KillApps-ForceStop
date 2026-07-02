import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import "react-native";
import renderer from "react-test-renderer";

import { ShizukuStatusCard } from "../../../src/components/common/ShizukuStatusCard";
import { useAppStore } from "../../../src/stores/useAppStore";

jest.mock("../../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		themeMode: "light",
		isDark: false,
		colors: {
			cardClass: "bg-white",
			cardBorderClass: "border-zinc-200",
			textClass: "text-zinc-900",
			subTextClass: "text-zinc-500",
			secondaryBtnClass: "bg-zinc-100",
			secondaryBtnTextClass: "text-zinc-800",
			primaryBtnClass: "bg-black",
			primaryBtnTextClass: "text-white",
			borderClass: "border-zinc-200",
		},
	}),
}));

jest.mock("../../../src/stores/useAppStore", () => ({
	useAppStore: jest.fn(),
}));

interface MockAppState {
	isShizukuActive: boolean;
	isPermissionGranted: boolean;
	isRootActive: boolean;
	isLoading: boolean;
	settings: { workingMode: string };
	checkShizukuStatus: jest.Mock;
	checkRootStatus: jest.Mock;
	requestShizukuPermission: jest.Mock;
}

describe("ShizukuStatusCard", () => {
	const mockCheckShizukuStatus = jest.fn();
	const mockCheckRootStatus = jest.fn();
	const mockRequestShizukuPermission = jest.fn();

	const defaultState: MockAppState = {
		isShizukuActive: false,
		isPermissionGranted: false,
		isRootActive: false,
		isLoading: false,
		settings: { workingMode: "shizuku" },
		checkShizukuStatus: mockCheckShizukuStatus,
		checkRootStatus: mockCheckRootStatus,
		requestShizukuPermission: mockRequestShizukuPermission,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	const renderWithState = (stateOverrides: Partial<MockAppState>) => {
		// biome-ignore lint/suspicious/noExplicitAny: jest mock bypass
		(useAppStore as unknown as jest.Mock).mockImplementation((selector: any) =>
			selector({ ...defaultState, ...stateOverrides }),
		);
		let component!: renderer.ReactTestRenderer;
		renderer.act(() => {
			component = renderer.create(<ShizukuStatusCard />);
		});
		return component;
	};

	it("1. renders Shizuku active and granted (Success State)", () => {
		const component = renderWithState({
			isShizukuActive: true,
			isPermissionGranted: true,
			settings: { workingMode: "shizuku" },
		});
		const tree = component.root;

		const statusText = tree.findByProps({ testID: "status-text" });
		expect(statusText.props.children).toContain("Terhubung dan izin diberikan");

		// Request permission button should NOT exist
		expect(() =>
			tree.findByProps({ testID: "btn-request-permission" }),
		).toThrow();
	});

	it("2. renders Shizuku active but no permission (Failure/Action State)", () => {
		const component = renderWithState({
			isShizukuActive: true,
			isPermissionGranted: false,
			settings: { workingMode: "shizuku" },
		});
		const tree = component.root;

		const statusText = tree.findByProps({ testID: "status-text" });
		expect(statusText.props.children).toContain("belum memiliki izin akses");

		const requestBtn = tree.findByProps({ testID: "btn-request-permission" });
		expect(requestBtn).toBeTruthy();

		// Simulate pressing request permission
		renderer.act(() => {
			requestBtn.props.onPress();
		});
		expect(mockRequestShizukuPermission).toHaveBeenCalled();
	});

	it("3. handles Request Permission button disabled when loading (Failure State)", () => {
		const component = renderWithState({
			isShizukuActive: true,
			isPermissionGranted: false,
			isLoading: true, // It is loading!
			settings: { workingMode: "shizuku" },
		});
		const tree = component.root;

		const requestBtn = tree.findByProps({ testID: "btn-request-permission" });
		expect(requestBtn.props.disabled).toBe(true);
	});

	it("4. renders Shizuku inactive (Failure State)", () => {
		const component = renderWithState({
			isShizukuActive: false,
			settings: { workingMode: "shizuku" },
		});
		const tree = component.root;

		const statusText = tree.findByProps({ testID: "status-text" });
		expect(statusText.props.children).toContain(
			"Layanan Shizuku tidak terdeteksi aktif",
		);
	});

	it("5. renders Root active (Success State)", () => {
		const component = renderWithState({
			isRootActive: true,
			settings: { workingMode: "root" },
		});
		const tree = component.root;

		const statusText = tree.findByProps({ testID: "status-text" });
		expect(statusText.props.children).toContain("Akses Superuser (Root) aktif");
	});

	it("6. renders Root inactive (Failure State)", () => {
		const component = renderWithState({
			isRootActive: false,
			settings: { workingMode: "root" },
		});
		const tree = component.root;

		const statusText = tree.findByProps({ testID: "status-text" });
		expect(statusText.props.children).toContain(
			"tidak terdeteksi atau ditolak",
		);
	});

	it("7. handles Refresh button for Shizuku", () => {
		const component = renderWithState({
			settings: { workingMode: "shizuku" },
		});
		const tree = component.root;

		const refreshBtn = tree.findByProps({ testID: "btn-refresh" });
		renderer.act(() => {
			refreshBtn.props.onPress();
		});

		expect(mockCheckShizukuStatus).toHaveBeenCalled();
		expect(mockCheckRootStatus).not.toHaveBeenCalled();
	});

	it("8. handles Refresh button for Root", () => {
		const component = renderWithState({
			settings: { workingMode: "root" },
		});
		const tree = component.root;

		const refreshBtn = tree.findByProps({ testID: "btn-refresh" });
		renderer.act(() => {
			refreshBtn.props.onPress();
		});

		expect(mockCheckRootStatus).toHaveBeenCalled();
		expect(mockCheckShizukuStatus).not.toHaveBeenCalled();
	});
});
