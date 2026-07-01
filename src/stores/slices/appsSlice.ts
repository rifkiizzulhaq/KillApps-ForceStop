import type { StateCreator } from "zustand";
import { killerService } from "../../services/killerService";
import type { AppState, AppsSlice } from "../../types/store";

export const createAppsSlice: StateCreator<AppState, [], [], AppsSlice> = (
	set,
	get,
) => ({
	apps: [],
	isLoading: false,
	isKilling: false,
	killMessage: null,
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
		} catch {
			set({ killMessage: "Gagal mengeksekusi perintah Shizuku." });
		} finally {
			set({ isKilling: false });
		}
	},

	fetchApps: async (silent = false) => {
		try {
			if (!silent) {
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
			set({ apps });
		} catch {
			set({ apps: [] });
		} finally {
			if (!silent) {
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
				killMessage: `Berhasil menghentikan aplikasi.`,
				apps: state.apps.map((app) =>
					app.packageName === packageName ? { ...app, isStopped: true } : app,
				),
			}));
			await get().fetchApps();
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
