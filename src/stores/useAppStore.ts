import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AppState } from "../types/store";
import { createAppsSlice } from "./slices/appsSlice";
import { createSettingsSlice } from "./slices/settingsSlice";
import { createShizukuSlice } from "./slices/shizukuSlice";

export * from "../types/store";

export const useAppStore = create<AppState>()(
	persist(
		(...a) => ({
			...createAppsSlice(...a),
			...createSettingsSlice(...a),
			...createShizukuSlice(...a),
		}),
		{
			name: "killapp-storage",
			storage: createJSONStorage(() => AsyncStorage),
			partialize: (state) => ({
				hibernationList: state.hibernationList,
				settings: state.settings,
				showSystemApps: state.showSystemApps,
				hasCompletedOnboarding: state.hasCompletedOnboarding,
			}),
			onRehydrateStorage: () => (state) => {
				state?.setHydrated(true);
			},
		},
	),
);
