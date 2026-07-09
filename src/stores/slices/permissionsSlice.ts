import type { StateCreator } from "zustand";
import { killerService, setKillerMode } from "../../services/killer";
import type { AppState, PermissionsSlice } from "../../types/store";

export const createPermissionsSlice: StateCreator<
	AppState,
	[],
	[],
	PermissionsSlice
> = (set, get) => ({
	isShizukuActive: false,
	isPermissionGranted: false,
	isRootActive: false,

	checkWorkingModeStatus: async () => {
		const mode = get().settings.workingMode;
		setKillerMode(mode);

		if (mode === "root") {
			const isRoot = await killerService.checkRootAccess();
			set({ isRootActive: isRoot });
			return isRoot;
		}

		// Shizuku logic
		const isBinder = await killerService.checkBinder();
		const isPerm = isBinder ? await killerService.checkPermission() : false;

		set({
			isShizukuActive: isBinder,
			isPermissionGranted: isPerm,
		});

		if (isBinder && !isPerm) {
			setTimeout(() => {
				get().requestShizukuPermission();
			}, 400);
		}

		if (get().apps.length === 0) {
			await get().fetchApps(false);
		}

		return isBinder && isPerm;
	},

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
