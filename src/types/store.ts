import type { AppInfo, AppSettings } from "./app";

export type ScreenType = "home" | "add_apps" | "settings" | "about";

export interface AppsSlice {
	apps: AppInfo[];
	isLoading: boolean;
	isKilling: boolean;
	killMessage: string | null;
	hibernationList: string[];
	addSelectedToHibernation: () => void;
	removeFromHibernation: (packageName: string) => void;
	killHibernationApps: () => Promise<void>;
	fetchApps: (silent?: boolean) => Promise<void>;
	toggleSelectApp: (packageName: string) => void;
	selectAll: (select: boolean) => void;
	killSelectedApps: () => Promise<void>;
	killSingleApp: (packageName: string) => Promise<void>;
	clearKillMessage: () => void;
}

export interface SettingsSlice {
	currentScreen: ScreenType;
	showSystemApps: boolean;
	settings: AppSettings;
	isHydrated: boolean;
	hasCompletedOnboarding: boolean;
	setCurrentScreen: (screen: ScreenType) => void;
	updateSetting: <K extends keyof AppSettings>(
		key: K,
		value: AppSettings[K],
	) => void;
	toggleShowSystemApps: () => void;
	setHydrated: (state: boolean) => void;
	completeOnboarding: () => void;
	resetOnboarding: () => void;
}

export interface ShizukuSlice {
	isShizukuActive: boolean;
	isPermissionGranted: boolean;
	isRootActive: boolean;
	checkShizukuStatus: () => Promise<void>;
	requestShizukuPermission: () => Promise<void>;
	checkRootStatus: () => Promise<boolean>;
}

export type AppState = AppsSlice & SettingsSlice & ShizukuSlice;
