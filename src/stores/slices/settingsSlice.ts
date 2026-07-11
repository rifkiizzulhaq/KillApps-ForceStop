import type { StateCreator } from "zustand";
import {
	clearAllNativeData,
	killerService,
	setGeekOptions,
	setHibernationOptions,
	setKillerMode,
	setProOptions,
} from "../../services/killer";
import type { KillerMode } from "../../types/app";
import type { AppState, SettingsSlice } from "../../types/store";

export const createSettingsSlice: StateCreator<
	AppState,
	[],
	[],
	SettingsSlice
> = (set) => ({
	currentScreen: "home",
	settingsScrollY: 0,
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
		dontRemoveNotif: false,
		hibernateSystemApps: false,
		themeMode: "system",
		smoothScroll: true,
		aggressiveDoze: false,
		gcmWakeupBypass: true,
		deepTrimMemory: false,
		phantomSlayer: false,
		bedtimeShield: false,
		emergencyTrigger: false,
		ramCrunchSlayer: false,
		autoKillScheduler: 0,
		bedtimeStart: 1380,
		bedtimeEnd: 300,
	},

	setCurrentScreen: (screen) => {
		set({ currentScreen: screen });
	},
	setSettingsScrollY: (y) => {
		set({ settingsScrollY: y });
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
			setGeekOptions(
				newSettings.aggressiveDoze ?? false,
				newSettings.gcmWakeupBypass ?? true,
				newSettings.deepTrimMemory ?? false,
			);
			setHibernationOptions(
				newSettings.smartHibernation ?? true,
				newSettings.finerMediaDetection ?? false,
				newSettings.shallowHibernation ?? false,
				newSettings.wakeUpTracking ?? true,
				newSettings.dontRemoveNotif ?? false,
				newSettings.ignoreBackgroundFree ?? true,
			);
			setProOptions({
				phantomSlayer: newSettings.phantomSlayer ?? false,
				bedtimeShield: newSettings.bedtimeShield ?? false,
				emergencyTrigger: newSettings.emergencyTrigger ?? false,
				ramCrunchSlayer: newSettings.ramCrunchSlayer ?? false,
				autoKillScheduler: newSettings.autoKillScheduler ?? 0,
				bedtimeStart: newSettings.bedtimeStart ?? 1380,
				bedtimeEnd: newSettings.bedtimeEnd ?? 300,
			});
			return updates;
		});
	},

	toggleShowSystemApps: () => {
		set((state) => {
			return {
				showSystemApps: !state.showSystemApps,
			};
		});
	},

	setHydrated: (stateVal) => {
		set((state) => {
			if (stateVal) {
				if (state.settings?.workingMode) {
					setKillerMode(state.settings.workingMode);
				}
				if (state.settings?.quickActionNotif !== undefined) {
					killerService.setQuickActionNotification(
						state.settings.quickActionNotif,
					);
				}
				setGeekOptions(
					state.settings?.aggressiveDoze ?? false,
					state.settings?.gcmWakeupBypass ?? true,
					state.settings?.deepTrimMemory ?? false,
				);
				setHibernationOptions(
					state.settings?.smartHibernation ?? true,
					state.settings?.finerMediaDetection ?? false,
					state.settings?.shallowHibernation ?? false,
					state.settings?.wakeUpTracking ?? true,
					state.settings?.dontRemoveNotif ?? false,
					state.settings?.ignoreBackgroundFree ?? true,
				);
				setProOptions({
					phantomSlayer: state.settings?.phantomSlayer ?? false,
					bedtimeShield: state.settings?.bedtimeShield ?? false,
					emergencyTrigger: state.settings?.emergencyTrigger ?? false,
					ramCrunchSlayer: state.settings?.ramCrunchSlayer ?? false,
					autoKillScheduler: state.settings?.autoKillScheduler ?? 0,
					bedtimeStart: state.settings?.bedtimeStart ?? 1380,
					bedtimeEnd: state.settings?.bedtimeEnd ?? 300,
				});
			}
			return { isHydrated: stateVal };
		});
	},
	completeOnboarding: () => set({ hasCompletedOnboarding: true }),
	resetOnboarding: () => {
		clearAllNativeData();
		setKillerMode("shizuku");
		set({
			hasCompletedOnboarding: false,
			currentScreen: "home",
			settingsScrollY: 0,
			showSystemApps: false,
			hibernationList: [],
			apps: [],
			isRootActive: false,
			isShizukuActive: false,
			isPermissionGranted: false,
			settings: {
				workingMode: "shizuku",
				smartHibernation: true,
				finerMediaDetection: false,
				shallowHibernation: false,
				wakeUpTracking: true,
				autoHibernation: false,
				ignoreBackgroundFree: true,
				quickActionNotif: false,
				dontRemoveNotif: false,
				hibernateSystemApps: false,
				themeMode: "system",
				smoothScroll: true,
				aggressiveDoze: false,
				gcmWakeupBypass: true,
				deepTrimMemory: false,
				phantomSlayer: false,
				bedtimeShield: false,
				emergencyTrigger: false,
				ramCrunchSlayer: false,
				autoKillScheduler: 0,
				bedtimeStart: 1380,
				bedtimeEnd: 300,
			},
		});
	},
});
