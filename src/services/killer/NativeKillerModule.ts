import { NativeModules, Platform } from "react-native";
import type {
	AppInfo,
	ImpactAnalytics,
	KillResult,
	ResurrectionItem,
} from "../../types/app";

const { CoreKillerModule } = NativeModules;

export interface ICoreKillerModule {
	getConstants: () => {
		CRITICAL_PACKAGES: string[];
		MEDIA_PACKAGES: string[];
	};
	checkBinder(): Promise<boolean>;
	checkPermission(): Promise<boolean>;
	requestPermission(): Promise<boolean>;
	getInstalledApps(): Promise<AppInfo[]>;
	killApps(packageNames: string[]): Promise<KillResult>;
	setAutoHibernationConfig(enabled: boolean, packageNames: string[]): void;
	setQuickActionNotification(enabled: boolean): void;
	checkInitialQuickFreeze(): Promise<boolean>;
	checkRootAccess(): Promise<boolean>;
	setWorkingMode(mode: string): void;
	setGeekOptions(
		aggressiveDoze: boolean,
		gcmWakeupBypass: boolean,
		deepTrimMemory: boolean,
	): void;
	setHibernationOptions(
		smart: boolean,
		finerMedia: boolean,
		shallow: boolean,
		wakeUp: boolean,
		dontRemoveNotif: boolean,
		ignoreBackgroundFree: boolean,
	): void;
	isIgnoringBatteryOptimizations(): Promise<boolean>;
	requestIgnoreBatteryOptimizations(): Promise<boolean>;
	setProOptions(options: Record<string, unknown>): void;
	freezeQuarantinePackage(
		pkg: string,
		freeze: boolean,
	): Promise<{ success: boolean; errorCode: string }>;
	getQuarantinePackages(): Promise<string[]>;
	getImpactAnalytics(): Promise<ImpactAnalytics | null>;
	getResurrectionDetectiveReport(): Promise<ResurrectionItem[]>;
	showTimePicker(currentHour: number, currentMinute: number): Promise<number>;
}

export const NativeKiller = (
	Platform.OS === "android" ? CoreKillerModule : null
) as ICoreKillerModule | null;
