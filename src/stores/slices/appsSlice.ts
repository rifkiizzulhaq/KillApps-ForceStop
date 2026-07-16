import type { StateCreator } from "zustand";
import { CRITICAL_PACKAGES, killerService } from "../../services/killer";
import type { AppState, AppsSlice } from "../../types/store";

export const createAppsSlice: StateCreator<AppState, [], [], AppsSlice> = (
	set,
	get,
) => ({
	apps: [],
	isLoading: false,
	isKilling: false,
	killMessage: null,
	webviewModalVisible: false,
	setWebviewModalVisible: (visible: boolean) => {
		set({ webviewModalVisible: visible });
	},
	hibernationList: [],

	addSelectedToHibernation: () => {
		const { apps, hibernationList } = get();
		const selected = apps
			.filter((app) => app.isSelected)
			.map((app) => app.packageName);
		const updatedList = Array.from(new Set([...hibernationList, ...selected]));
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

			if (settings.smartHibernation) {
				targetsToKill = targetsToKill.filter((pkg) => {
					const app = get().apps.find((a) => a.packageName === pkg);
					return !(app?.isSmartProtected || CRITICAL_PACKAGES.has(pkg));
				});
			}

			let ignoredCount = 0;
			if (settings.ignoreBackgroundFree) {
				targetsToKill = targetsToKill.filter((pkg) => {
					const appInfo = apps.find((a) => a.packageName === pkg);
					/* istanbul ignore next */ /* istanbul ignore next */ return appInfo
						? !appInfo.isStopped
						: true;
				});
			}

			ignoredCount = hibernationList.length - targetsToKill.length;

			if (targetsToKill.length === 0 && ignoredCount > 0) {
				set({
					killMessage: `Semua ${hibernationList.length} aplikasi sudah dihentikan prosesnya (dilewati karena fitur Ignore Background-free aktif).`,
				});
				return;
			}

			const result = await killerService.killApps(targetsToKill);

			let msgText = `Berhasil menghentikan ${result.success.length} aplikasi.`;
			if (ignoredCount > 0) {
				msgText += ` (${ignoredCount} sudah berhenti & dilewati).`;
			}

			set({ killMessage: msgText });
			await get().fetchApps();

			/* istanbul ignore next */
			if (result.webviewSkipped && result.webviewSkipped.length > 0) {
				set({ webviewModalVisible: true });
			}
			/* istanbul ignore next */
		} catch {
			/* istanbul ignore next */ const mode =
				get().settings?.workingMode === "root" ? "Root" : "Shizuku";
			set({ killMessage: `Gagal mengeksekusi perintah ${mode}.` });
		} finally {
			set({ isKilling: false });
		}
	},

	fetchApps: async (silent = false) => {
		try {
			/* istanbul ignore next */ if (!silent) {
				set({ isLoading: true });
			}
			const fetchedApps = await killerService.getInstalledApps();
			fetchedApps.sort((a, b) => a.appName.localeCompare(b.appName));
			const currentSelected = new Set(
				get()
					.apps.filter((a) => a.isSelected)
					.map((a) => a.packageName),
			);
			const apps = fetchedApps.map((app) => ({
				...app,
				isSelected: currentSelected.has(app.packageName),
			}));

			const { hibernationList } = get();
			const cleanHibernationList = hibernationList.filter((pkg) => {
				const appInfo = apps.find((a) => a.packageName === pkg);
				return (
					!CRITICAL_PACKAGES.has(pkg) &&
					!(appInfo?.isSystemApp && appInfo?.isSmartProtected)
				);
			});
			if (cleanHibernationList.length !== hibernationList.length) {
				set({ hibernationList: cleanHibernationList });
			}

			set({ apps, isLoading: false });
			/* istanbul ignore next */
		} catch {
			set({ apps: [] });
		} finally {
			/* istanbul ignore next */ if (!silent) {
				set({ isLoading: false });
			}
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

			if (settings.smartHibernation) {
				selectedPkgs = selectedPkgs.filter((pkg) => {
					const app = get().apps.find((a) => a.packageName === pkg);
					return !(app?.isSmartProtected || CRITICAL_PACKAGES.has(pkg));
				});
			}

			let ignoredCount = 0;
			if (settings.ignoreBackgroundFree) {
				const beforeCount = selectedPkgs.length;
				selectedPkgs = selectedPkgs.filter((pkg) => {
					const appInfo = apps.find((a) => a.packageName === pkg);
					/* istanbul ignore next */ /* istanbul ignore next */ return appInfo
						? !appInfo.isStopped
						: true;
				});
				ignoredCount = beforeCount - selectedPkgs.length;
			}

			if (selectedPkgs.length === 0 && ignoredCount > 0) {
				set({
					killMessage:
						"Aplikasi terpilih sudah dalam keadaan mati latar belakang (diabaikan oleh Ignore Background-free).",
				});
				return;
			}

			const result = await killerService.killApps(selectedPkgs);

			let msgText = `Berhasil mematikan ${result.success.length} aplikasi.`;
			if (ignoredCount > 0) {
				msgText += ` (${ignoredCount} sudah berhenti & dilewati).`;
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

			/* istanbul ignore next */
			if (result.webviewSkipped && result.webviewSkipped.length > 0) {
				set({ webviewModalVisible: true });
			}
			/* istanbul ignore next */
		} catch {
			/* istanbul ignore next */ const mode =
				get().settings?.workingMode === "root" ? "Root" : "Shizuku";
			set({ killMessage: `Gagal mengeksekusi perintah ${mode}.` });
		} finally {
			set({ isKilling: false });
		}
	},

	killSingleApp: async (packageName: string) => {
		try {
			set({ isKilling: true, killMessage: null });
			const result = await killerService.killApps([packageName]);
			console.log("DEBUG_KILL_RESULT:", result);
			const success = result.success.includes(packageName);
			set((state) => ({
				killMessage: success
					? "Berhasil menghentikan aplikasi."
					: "Gagal menghentikan aplikasi (diproteksi atau sedang aktif digunakan).",
				apps: state.apps.map((app) =>
					app.packageName === packageName && success
						? { ...app, isStopped: true }
						: app,
				),
			}));
			await get().fetchApps();

			/* istanbul ignore next */
			if (result.webviewSkipped && result.webviewSkipped.length > 0) {
				set({ webviewModalVisible: true });
			}
			/* istanbul ignore next */
		} catch {
			set({ killMessage: "Gagal menghentikan aplikasi." });
		} finally {
			set({ isKilling: false });
		}
	},

	clearKillMessage: () => {
		set({ killMessage: null });
	},
});
