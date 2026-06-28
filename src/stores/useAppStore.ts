import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { killerService } from "../services/killerService";
import type { AppInfo, AppSettings } from "../types/app";

export type ScreenType = "home" | "add_apps" | "settings" | "about";

interface AppState {
	apps: AppInfo[];
	showSystemApps: boolean;
	isShizukuActive: boolean;
	isPermissionGranted: boolean;
	isLoading: boolean;
	isKilling: boolean;
	killMessage: string | null;
	currentScreen: ScreenType;
	hibernationList: string[];
	settings: AppSettings;
	setCurrentScreen: (screen: ScreenType) => void;
	updateSetting: <K extends keyof AppSettings>(
		key: K,
		value: AppSettings[K],
	) => void;
	addSelectedToHibernation: () => void;
	removeFromHibernation: (packageName: string) => void;
	killHibernationApps: () => Promise<void>;
	toggleShowSystemApps: () => void;
	checkShizukuStatus: () => Promise<void>;
	requestShizukuPermission: () => Promise<void>;
	fetchApps: () => Promise<void>;
	toggleSelectApp: (packageName: string) => void;
	selectAll: (select: boolean) => void;
	killSelectedApps: () => Promise<void>;
	killSingleApp: (packageName: string) => Promise<void>;
	clearKillMessage: () => void;
}

export const useAppStore = create<AppState>()(
	persist(
		(set, get) => ({
			apps: [],
			showSystemApps: false,
			isShizukuActive: false,
			isPermissionGranted: false,
			isLoading: false,
			isKilling: false,
			killMessage: null,
			currentScreen: "home",
			hibernationList: [],
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
			},

			setCurrentScreen: (screen) => {
				set({ currentScreen: screen });
			},

			updateSetting: (key, value) => {
				set((state) => {
					const newSettings = { ...state.settings, [key]: value };
					const updates: Partial<AppState> = { settings: newSettings };
					if (key === "hibernateSystemApps") {
						updates.showSystemApps = value as boolean;
					}
					return updates;
				});
			},

			addSelectedToHibernation: () => {
				const { apps, hibernationList } = get();
				const selected = apps
					.filter((app) => app.isSelected)
					.map((app) => app.packageName);
				const updatedList = Array.from(
					new Set([...hibernationList, ...selected]),
				);
				const resetApps = apps.map((app) => ({ ...app, isSelected: false }));
				set({
					hibernationList: updatedList,
					apps: resetApps,
					currentScreen: "home",
				});
			},

			removeFromHibernation: (packageName) => {
				set((state) => ({
					hibernationList: state.hibernationList.filter(
						(pkg) => pkg !== packageName,
					),
				}));
			},

			killHibernationApps: async () => {
				const { hibernationList, apps, settings } = get();
				if (hibernationList.length === 0) {
					return;
				}

				try {
					set({ isKilling: true, killMessage: null });

					let targetsToKill = hibernationList;
					let ignoredCount = 0;
					if (settings.ignoreBackgroundFree) {
						targetsToKill = hibernationList.filter((pkg) => {
							const appInfo = apps.find((a) => a.packageName === pkg);
							return appInfo ? !appInfo.isStopped : true;
						});
						ignoredCount = hibernationList.length - targetsToKill.length;
					}

					if (targetsToKill.length === 0 && ignoredCount > 0) {
						set({
							killMessage: `Semua ${hibernationList.length} aplikasi sudah tidur pulas (dilewati karena fitur Ignore Background-free aktif). 🍃`,
						});
						return;
					}

					const result = await killerService.killApps(targetsToKill);

					let msgText = `Berhasil membesut ${result.success.length} aplikasi.`;
					if (ignoredCount > 0) {
						msgText += ` (${ignoredCount} dilewati).`;
					}
					if (settings.smartHibernation) {
						msgText += " 🧠 Smart Hibernation aktif.";
					}
					if (settings.shallowHibernation) {
						msgText += " 🧊 Hibernasi dangkal diterapkan.";
					}

					set({ killMessage: msgText });
					await get().fetchApps();
				} catch {
					set({ killMessage: "Gagal mengeksekusi perintah Shizuku." });
				} finally {
					set({ isKilling: false });
				}
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

			checkShizukuStatus: async () => {
				const isBinder = await killerService.checkBinder();
				const isPerm = isBinder ? await killerService.checkPermission() : false;
				set({ isShizukuActive: isBinder, isPermissionGranted: isPerm });
				if (isPerm) {
					await get().fetchApps();
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

			fetchApps: async () => {
				try {
					set({ isLoading: true });
					const apps = await killerService.getInstalledApps();
					apps.sort((a, b) => a.appName.localeCompare(b.appName));
					set({ apps });
				} catch {
					set({ apps: [] });
				} finally {
					set({ isLoading: false });
				}
			},

			toggleSelectApp: (packageName: string) => {
				set((state) => ({
					apps: state.apps.map((app) =>
						app.packageName === packageName
							? { ...app, isSelected: !app.isSelected }
							: app,
					),
				}));
			},

			selectAll: (select: boolean) => {
				const { showSystemApps } = get();
				set((state) => ({
					apps: state.apps.map((app) => {
						if (!showSystemApps && app.isSystemApp) {
							return app;
						}
						return { ...app, isSelected: select };
					}),
				}));
			},

			killSelectedApps: async () => {
				const { apps, settings } = get();
				let selectedPkgs = apps
					.filter((app) => app.isSelected)
					.map((app) => app.packageName);

				if (selectedPkgs.length === 0) {
					return;
				}

				try {
					set({ isKilling: true, killMessage: null });

					let ignoredCount = 0;
					if (settings.ignoreBackgroundFree) {
						const beforeCount = selectedPkgs.length;
						selectedPkgs = selectedPkgs.filter((pkg) => {
							const appInfo = apps.find((a) => a.packageName === pkg);
							return appInfo ? !appInfo.isStopped : true;
						});
						ignoredCount = beforeCount - selectedPkgs.length;
					}

					if (selectedPkgs.length === 0 && ignoredCount > 0) {
						set({
							killMessage:
								"Aplikasi terpilih sudah dalam keadaan mati latar belakang (diabaikan oleh Ignore Background-free). 🍃",
						});
						return;
					}

					const result = await killerService.killApps(selectedPkgs);

					let msgText = `Berhasil mematikan ${result.success.length} aplikasi.`;
					if (ignoredCount > 0) {
						msgText += ` (${ignoredCount} dilewati).`;
					}
					if (settings.smartHibernation) {
						msgText += " 🧠 Smart mode.";
					}

					set({
						killMessage: msgText,
						apps: apps.map((app) =>
							result.success.includes(app.packageName)
								? { ...app, isStopped: true }
								: app,
						),
					});
					await get().fetchApps();
				} catch {
					set({ killMessage: "Gagal mengeksekusi perintah Shizuku." });
				} finally {
					set({ isKilling: false });
				}
			},

			killSingleApp: async (packageName: string) => {
				try {
					set({ isKilling: true, killMessage: null });
					const _result = await killerService.killApps([packageName]);
					set((state) => ({
						killMessage: `Berhasil membekukan aplikasi.`,
						apps: state.apps.map((app) =>
							app.packageName === packageName
								? { ...app, isStopped: true }
								: app,
						),
					}));
					await get().fetchApps();
				} catch {
					set({ killMessage: "Gagal membekukan aplikasi." });
				} finally {
					set({ isKilling: false });
				}
			},

			clearKillMessage: () => {
				set({ killMessage: null });
			},
		}),
		{
			name: "killapp-storage",
			storage: createJSONStorage(() => AsyncStorage),
			partialize: (state) => ({
				hibernationList: state.hibernationList,
				settings: state.settings,
				showSystemApps: state.showSystemApps,
			}),
		},
	),
);
