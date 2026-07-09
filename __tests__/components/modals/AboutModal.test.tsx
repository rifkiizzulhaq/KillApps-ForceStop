// @ts-nocheck
import { afterEach, beforeEach, describe, it, jest } from "@jest/globals";
import renderer from "react-test-renderer";
import { AboutModal } from "../../../src/components/modals/AboutModal";

let mockState: any = {};

jest.mock("../../../src/stores/useAppStore", () => {
	const useAppStoreMock = jest.fn((selector: any) =>
		selector(mockState),
	) as any;
	useAppStoreMock.getState = jest.fn(() => mockState);
	return { useAppStore: useAppStoreMock };
});

describe("AboutModal", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockState = {
			currentScreen: "about",
			setCurrentScreen: jest.fn(),
		};
	});

	afterEach(() => {
		renderer.act(() => {
			jest.runOnlyPendingTimers();
		});
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("renders and handles closing via all triggers", () => {
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(<AboutModal />);
		});

		// Trigger pressables
		const pressables = tree.root.findAll((node: any) => node.props?.onPress);
		for (const p of pressables) {
			renderer.act(() => p.props.onPress());
		}

		// Trigger onRequestClose on Modal
		const modals = tree.root.findAllByType("Modal" as any);
		if (modals.length > 0) {
			renderer.act(() => modals[0].props.onRequestClose());
		}

		renderer.act(() => tree.unmount());
	});

	it("renders when currentScreen is not about (visible false)", () => {
		mockState.currentScreen = "home";
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(<AboutModal />);
		});
		renderer.act(() => tree.unmount());
	});
});
