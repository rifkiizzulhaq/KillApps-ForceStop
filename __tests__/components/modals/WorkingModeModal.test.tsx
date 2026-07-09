// @ts-nocheck
import { afterEach, beforeEach, describe, it, jest } from "@jest/globals";
import renderer from "react-test-renderer";
import { InfoModal } from "../../../src/components/modals/InfoModal";
import { SelectionModal } from "../../../src/components/modals/SelectionModal";
import { WorkingModeModal } from "../../../src/components/modals/WorkingModeModal";

let mockDark = false;
let mockState: any = {};

jest.mock("../../../src/hooks/useTheme", () => ({
	useTheme: () => ({
		isDark: mockDark,
		colors: {
			modalBgClass: "bg-white",
			borderClass: "border-gray",
			textClass: "text-black",
			subTextClass: "text-gray",
			cardClass: "bg-white",
			cardBorderClass: "border-gray",
			iconColor: "#000",
		},
	}),
}));

jest.mock("../../../src/stores/useAppStore", () => {
	const useAppStoreMock = jest.fn((selector: any) =>
		selector(mockState),
	) as any;
	useAppStoreMock.getState = jest.fn(() => mockState);
	return { useAppStore: useAppStoreMock };
});

describe("WorkingModeModal", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockDark = false;
		mockState = {
			settings: { workingMode: "shizuku" },
			updateSetting: jest.fn(),
			isShizukuActive: true,
			permissions: { isPermissionGranted: false },
			isPermissionGranted: false,
			isRootActive: false,
			checkWorkingModeStatus: jest
				.fn()
				.mockImplementation(async () => mockState.isRootActive),
			requestShizukuPermission: jest.fn().mockImplementation(async () => {
				mockState.isPermissionGranted = false;
				return false;
			}),
		};
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("covers root and shizuku selection branches across check outcomes with fake timers", async () => {
		for (const rootActive of [true, false]) {
			for (const shizukuActive of [true, false]) {
				for (const permGranted of [true, false]) {
					mockState.isRootActive = rootActive;
					mockState.isShizukuActive = shizukuActive;
					mockState.isPermissionGranted = permGranted;

					let tree: any;
					await renderer.act(async () => {
						tree = renderer.create(
							<WorkingModeModal visible={true} onClose={jest.fn()} />,
						);
					});

					const selModal = tree.root.findAllByType(SelectionModal)[0];
					if (selModal?.props.onSelect) {
						await renderer.act(async () => {
							await selModal.props.onSelect("root");
							await selModal.props.onSelect("shizuku");
						});
					}

					await renderer.act(async () => {
						jest.advanceTimersByTime(500);
					});

					const infoModals = tree.root.findAllByType(InfoModal);
					for (const im of infoModals) {
						if (im.props.visible && im.props.onClose) {
							renderer.act(() => im.props.onClose());
						}
					}

					renderer.act(() => tree.unmount());
				}
			}
		}
	});
});
