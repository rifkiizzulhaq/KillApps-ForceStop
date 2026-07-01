import type { StateCreator } from "zustand";
import { killerService, setGeekOptions, setKillerMode } from "../../services/killerService";
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
		ignoreBackgroundFree: true,
		quickActionNotif: false,
		longPressNavBar: false,
		dontRemoveNotif: false,
		hibernateSystemApps: false,
		themeMode: "system",
		smoothScroll: true,
		aggressiveDoze: false,
		gcmWakeupBypass: true,
		deepTrimMemory: false,
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
			setGeekOptions(
				newSettings.aggressiveDoze ?? false,
				newSettings.gcmWakeupBypass ?? true,
				newSettings.deepTrimMemory ?? false,
			);
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

	setHydrated: (stateVal) => {
		set((state) => {
			if (stateVal) {
				setGeekOptions(
					state.settings?.aggressiveDoze ?? false,
					state.settings?.gcmWakeupBypass ?? true,
					state.settings?.deepTrimMemory ?? false,
				);
			}
			return { isHydrated: stateVal };
		});
	},
	completeOnboarding: () => set({ hasCompletedOnboarding: true }),
	resetOnboarding: () => {
		killerService.setQuickActionNotification(false);
		killerService.setAutoHibernationConfig(false, []);
		setKillerMode("shizuku");
		set((state) => ({
			hasCompletedOnboarding: false,
			currentScreen: "home",
			showSystemApps: false,
			hibernationList: [],
			apps: state.apps.map((app) => ({ ...app, isSelected: false })),
			settings: {
				workingMode: "shizuku",
				smartHibernation: true,
				finerMediaDetection: false,
				shallowHibernation: false,
				wakeUpTracking: true,
				autoHibernation: false,
				ignoreBackgroundFree: true,
				quickActionNotif: false,
				longPressNavBar: false,
				dontRemoveNotif: false,
				hibernateSystemApps: false,
				themeMode: "system",
				smoothScroll: true,
				aggressiveDoze: false,
				gcmWakeupBypass: true,
				deepTrimMemory: false,
			},
		}));
	},
});
