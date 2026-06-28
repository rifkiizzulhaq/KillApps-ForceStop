export interface AppInfo {
	packageName: string;
	appName: string;
	icon?: string;
	isSystemApp: boolean;
	isGcm?: boolean;
	isStopped?: boolean;
	isSelected?: boolean;
}

export type KillerMode = "shizuku" | "root";

export interface KillResult {
	success: string[];
	failed: string[];
}

export interface AppSettings {
	workingMode: KillerMode;
	smartHibernation: boolean;
	finerMediaDetection: boolean;
	shallowHibernation: boolean;
	wakeUpTracking: boolean;
	autoHibernation: boolean;
	ignoreBackgroundFree: boolean;
	quickActionNotif: boolean;
	longPressNavBar: boolean;
	dontRemoveNotif: boolean;
	hibernateSystemApps: boolean;
	themeMode?: "system" | "light" | "dark";
	smoothScroll?: boolean;
}
