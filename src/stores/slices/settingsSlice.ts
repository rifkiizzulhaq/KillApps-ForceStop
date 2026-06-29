import type { StateCreator } from "zustand";
import { killerService, setKillerMode } from "../../services/killerService";
import type { KillerMode } from "../../types/app";
import type { AppState, SettingsSlice } from "../../types/store";

export const createSettingsSlice: StateCreator<
	AppState,
	[],
	[],
	SettingsSlice
> = (set) => ({
	currentScreen: "home",
	showSystemApps: false,
	isHydrated: false,
	hasCompletedOnboarding: false,
	settings: {
		workingMode: "shizuku",
		smartHibernation: true,
		finerMediaDetection: false,
		shallowHibernation: false,
		wakeUpTracking: true,
		autoHibernation: false,
		ignoreBackgroundFree: false,
		quickActionNotif: false,
		longPressNavBar: false,
		dontRemoveNotif: false,
		hibernateSystemApps: false,
		themeMode: "system",
		smoothScroll: true,
	},

	setCurrentScreen: (screen) => {
		set({ currentScreen: screen });
	},

	updateSetting: (key, value) => {
		if (key === "quickActionNotif") {
			killerService.setQuickActionNotification(value as boolean);
		}
		if (key === "workingMode") {
			setKillerMode(value as KillerMode);
		}
		set((state) => {
			const newSettings = { ...state.settings, [key]: value };
			const updates: Partial<AppState> = { settings: newSettings };
			if (key === "hibernateSystemApps") {
				updates.showSystemApps = value as boolean;
			}
			return updates;
		});
	},

	toggleShowSystemApps: () => {
		set((state) => {
			const nextVal = !state.showSystemApps;
			return {
				showSystemApps: nextVal,
				settings: { ...state.settings, hibernateSystemApps: nextVal },
			};
		});
	},

	setHydrated: (stateVal) => set({ isHydrated: stateVal }),
	completeOnboarding: () => set({ hasCompletedOnboarding: true }),
	resetOnboarding: () =>
		set({ hasCompletedOnboarding: false, currentScreen: "home" }),
});
