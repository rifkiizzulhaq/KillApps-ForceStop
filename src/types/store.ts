import type { AppInfo, AppSettings } from "./app";

export type ScreenType =
	| "home"
	| "add_apps"
	| "settings"
	| "about"
	| "quarantine"
	| "pro_analytics";

export interface AppsSlice {
	apps: AppInfo[];
	isLoading: boolean;
	isKilling: boolean;
	killMessage: string | null;
	webviewModalVisible: boolean;
	setWebviewModalVisible: (visible: boolean) => void;
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
	settingsScrollY: number;
	setCurrentScreen: (screen: ScreenType) => void;
	updateSetting: <K extends keyof AppSettings>(
		key: K,
		value: AppSettings[K],
	) => void;
	toggleShowSystemApps: () => void;
	setHydrated: (state: boolean) => void;
	completeOnboarding: () => void;
	resetOnboarding: () => void;
	setSettingsScrollY: (y: number) => void;
}

export interface PermissionsSlice {
	isShizukuActive: boolean;
	isPermissionGranted: boolean;
	isRootActive: boolean;
	checkWorkingModeStatus: () => Promise<boolean>;
	checkShizukuStatus: () => Promise<void>;
	requestShizukuPermission: () => Promise<void>;
	checkRootStatus: () => Promise<boolean>;
}

export type AppState = AppsSlice & SettingsSlice & PermissionsSlice;
