// @ts-nocheck
import { afterEach, beforeEach, describe, it, jest } from "@jest/globals";
import renderer from "react-test-renderer";
import { SettingsTroubleshootTab } from "../../../src/components/settings/SettingsTroubleshootTab";

jest.mock("../../../src/components/modals/InfoModal", () => ({
	InfoModal: (props: any) => <div testID="InfoModal" {...props} />,
}));

describe("SettingsTroubleshootTab", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		renderer.act(() => {
			jest.runOnlyPendingTimers();
		});
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("renders and triggers all guide buttons and modal close", async () => {
		let tree: any;
		await renderer.act(async () => {
			tree = renderer.create(<SettingsTroubleshootTab />);
			jest.runAllTimers();
		});

		// Trigger pressables (every guide row)
		const pressables = tree.root.findAll((node: any) => node.props?.onPress);
		for (const p of pressables) {
			await renderer.act(async () => {
				try {
					await p.props.onPress();
				} catch (_e) {}
			});
		}

		// Trigger close on InfoModal
		const modal = tree.root.findByProps({ testID: "InfoModal" });
		if (modal.props.onClose) {
			renderer.act(() => modal.props.onClose());
		}

		renderer.act(() => tree.unmount());
	});
});
