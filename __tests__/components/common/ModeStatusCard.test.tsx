// @ts-nocheck
import { afterEach, beforeEach, describe, it, jest } from "@jest/globals";
import renderer from "react-test-renderer";
import { ModeStatusCard } from "../../../src/components/common/ModeStatusCard";

let mockState: any = {};

jest.mock("../../../src/stores/useAppStore", () => {
	const useAppStoreMock = jest.fn((selector: any) =>
		selector(mockState),
	) as any;
	useAppStoreMock.getState = jest.fn(() => mockState);
	return { useAppStore: useAppStoreMock };
});

describe("ModeStatusCard", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockState = {
			isShizukuActive: true,
			isPermissionGranted: true,
			isRootActive: true,
			settings: { workingMode: "shizuku" },
			checkShizukuStatus: jest.fn().mockResolvedValue(true),
			checkRootStatus: jest.fn(),
			requestShizukuPermission: jest.fn(),
		};
	});

	afterEach(() => {
		renderer.act(() => {
			jest.runOnlyPendingTimers();
		});
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("refresh in root mode", async () => {
		mockState.settings.workingMode = "root";
		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(<ModeStatusCard />);
		});
		const btn = tree.root.findByProps({ testID: "btn-refresh" });
		await renderer.act(async () => {
			await btn.props.onPress();
		});
		renderer.act(() => tree.unmount());
	});

	it("refresh in shizuku mode when permission granted", async () => {
		mockState.settings.workingMode = "shizuku";
		mockState.isPermissionGranted = true;
		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(<ModeStatusCard />);
		});
		const btn = tree.root.findByProps({ testID: "btn-refresh" });
		await renderer.act(async () => {
			await btn.props.onPress();
		});
		renderer.act(() => tree.unmount());
	});

	it("refresh in shizuku mode when permission denied (triggers setTimeout)", async () => {
		mockState.settings.workingMode = "shizuku";
		mockState.isPermissionGranted = false;
		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(<ModeStatusCard />);
		});
		const btn = tree.root.findByProps({ testID: "btn-refresh" });
		await renderer.act(async () => {
			await btn.props.onPress();
			jest.runAllTimers();
		});
		renderer.act(() => tree.unmount());
	});
});
