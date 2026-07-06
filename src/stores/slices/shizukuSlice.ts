import type { StateCreator } from "zustand";
import { killerService, setKillerMode } from "../../services/killerService";
import type { AppState, ShizukuSlice } from "../../types/store";

export const createShizukuSlice: StateCreator<
	AppState,
	[],
	[],
	ShizukuSlice
> = (set, get) => ({
	isShizukuActive: false,
	isPermissionGranted: false,
	isRootActive: false,

	checkShizukuStatus: async () => {
		setKillerMode(get().settings.workingMode);
		const isBinder = await killerService.checkBinder();
		const isPerm = isBinder ? await killerService.checkPermission() : false;
		set({
			isShizukuActive: isBinder,
			isPermissionGranted: isPerm,
		});
		if (get().apps.length === 0) {
			await get().fetchApps(false);
		}
	},

	requestShizukuPermission: async () => {
		try {
			set({ isLoading: true });
			await killerService.requestPermission();
			await get().checkShizukuStatus();
		} catch {
			set({ isPermissionGranted: false });
		} finally {
			set({ isLoading: false });
		}
	},

	checkRootStatus: async () => {
		const isRoot = await killerService.checkRootAccess();
		set({ isRootActive: isRoot });
		return isRoot;
	},
});
