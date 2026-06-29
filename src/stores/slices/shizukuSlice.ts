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
		const isRoot = await killerService.checkRootAccess();
		set({
			isShizukuActive: isBinder,
			isPermissionGranted: isPerm,
			isRootActive: isRoot,
		});
		const silent = get().apps.length > 0;
		await get().fetchApps(silent);
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
