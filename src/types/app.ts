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
	webviewSkipped?: string[];
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
	dontRemoveNotif: boolean;
	hibernateSystemApps: boolean;
	themeMode?: "system" | "light" | "dark";
	smoothScroll?: boolean;
	aggressiveDoze?: boolean;
	gcmWakeupBypass?: boolean;
	deepTrimMemory?: boolean;
	phantomSlayer?: boolean;
	bedtimeShield?: boolean;
	emergencyTrigger?: boolean;
	ramCrunchSlayer?: boolean;
	autoKillScheduler?: number;
	bedtimeStart?: number;
	bedtimeEnd?: number;
}

export interface ImpactAnalytics {
	totalKilledCount: number;
	blockedWakeupsCount: number;
	totalRamSavedMb: number;
	availMemGb: number;
	totalMemGb: number;
	lastRamBeforeMb?: number;
	lastRamAfterMb?: number;
}

export interface ResurrectionItem {
	packageName: string;
	appName: string;
	restartCount: number;
}
