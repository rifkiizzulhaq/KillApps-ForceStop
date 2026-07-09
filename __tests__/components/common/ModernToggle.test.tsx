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
import { ModernToggle } from "../../../src/components/common/ModernToggle";

let mockDark = false;
jest.mock("../../../src/hooks/useTheme", () => ({
	useTheme: () => ({ isDark: mockDark }),
}));

describe("ModernToggle", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockDark = false;
	});

	afterEach(() => {
		renderer.act(() => {
			jest.runOnlyPendingTimers();
		});
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("renders value false and handles press when not disabled (light theme)", () => {
		const onValueChange = jest.fn();
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(
				<ModernToggle value={false} onValueChange={onValueChange} />,
			);
			jest.runAllTimers();
		});

		const pressables = tree.root.findAll((node: any) => node.props?.onPress);
		renderer.act(() => pressables[0].props.onPress());
		expect(onValueChange).toHaveBeenCalledWith(true);
		renderer.act(() => tree.unmount());
	});

	it("renders value true and handles press when not disabled (dark theme)", () => {
		mockDark = true;
		const onValueChange = jest.fn();
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(
				<ModernToggle value={true} onValueChange={onValueChange} />,
			);
			jest.runAllTimers();
		});

		const pressables = tree.root.findAll((node: any) => node.props?.onPress);
		renderer.act(() => pressables[0].props.onPress());
		expect(onValueChange).toHaveBeenCalledWith(false);
		renderer.act(() => tree.unmount());
	});

	it("does not call onValueChange when disabled (light/dark variations)", () => {
		const onValueChange = jest.fn();
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(
				<ModernToggle
					value={false}
					onValueChange={onValueChange}
					disabled={true}
				/>,
			);
			jest.runAllTimers();
		});

		const pressables = tree.root.findAll((node: any) => node.props?.onPress);
		renderer.act(() => pressables[0].props.onPress());
		expect(onValueChange).not.toHaveBeenCalled();
		renderer.act(() => tree.unmount());
	});

	it("renders disabled value true in dark mode", () => {
		mockDark = true;
		let tree: any;
		renderer.act(() => {
			tree = renderer.create(
				<ModernToggle value={true} onValueChange={jest.fn()} disabled={true} />,
			);
			jest.runAllTimers();
		});
		renderer.act(() => tree.unmount());
	});
});
