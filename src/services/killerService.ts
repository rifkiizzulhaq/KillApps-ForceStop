import { NativeModules, Platform } from "react-native";
import type { AppInfo, KillerMode, KillResult } from "../types/app";

const { ShizukuKillerModule } = NativeModules;

interface IKillerService {
	checkBinder(): Promise<boolean>;
	checkPermission(): Promise<boolean>;
	requestPermission(): Promise<boolean>;
	getInstalledApps(): Promise<AppInfo[]>;
	killApps(packageNames: string[]): Promise<KillResult>;
	setAutoHibernationConfig(enabled: boolean, packageNames: string[]): void;
	setQuickActionNotification(enabled: boolean): void;
	checkInitialQuickFreeze(): Promise<boolean>;
	checkRootAccess(): Promise<boolean>;
}

class ShizukuKillerServiceImpl implements IKillerService {
	async checkBinder(): Promise<boolean> {
		if (Platform.OS !== "android" || !ShizukuKillerModule) {
			return false;
		}
		return await ShizukuKillerModule.checkBinder();
	}

	async checkPermission(): Promise<boolean> {
		if (Platform.OS !== "android" || !ShizukuKillerModule) {
			return false;
		}
		return await ShizukuKillerModule.checkPermission();
	}

	async requestPermission(): Promise<boolean> {
		if (Platform.OS !== "android" || !ShizukuKillerModule) {
			return false;
		}
		return await ShizukuKillerModule.requestPermission();
	}

	async getInstalledApps(): Promise<AppInfo[]> {
		if (Platform.OS !== "android" || !ShizukuKillerModule) {
			return [];
		}
		const apps: AppInfo[] = await ShizukuKillerModule.getInstalledApps();
		return apps.map((app) => ({ ...app, isSelected: false }));
	}

	async killApps(packageNames: string[]): Promise<KillResult> {
		if (Platform.OS !== "android" || !ShizukuKillerModule) {
			return { success: [], failed: packageNames };
		}
		return await ShizukuKillerModule.killApps(packageNames);
	}

	setAutoHibernationConfig(enabled: boolean, packageNames: string[]): void {
		if (
			Platform.OS === "android" &&
			ShizukuKillerModule &&
			ShizukuKillerModule.setAutoHibernationConfig
		) {
			ShizukuKillerModule.setAutoHibernationConfig(enabled, packageNames);
		}
	}

	setQuickActionNotification(enabled: boolean): void {
		if (
			Platform.OS === "android" &&
			ShizukuKillerModule &&
			ShizukuKillerModule.setQuickActionNotification
		) {
			ShizukuKillerModule.setQuickActionNotification(enabled);
		}
	}

	async checkInitialQuickFreeze(): Promise<boolean> {
		if (
			Platform.OS === "android" &&
			ShizukuKillerModule &&
			ShizukuKillerModule.checkInitialQuickFreeze
		) {
			return await ShizukuKillerModule.checkInitialQuickFreeze();
		}
		return false;
	}

	async checkRootAccess(): Promise<boolean> {
		if (Platform.OS !== "android" || !ShizukuKillerModule) {
			return false;
		}
		return await ShizukuKillerModule.checkRootAccess();
	}
}

class RootKillerServiceImpl implements IKillerService {
	async checkBinder(): Promise<boolean> {
		return await this.checkRootAccess();
	}

	async checkPermission(): Promise<boolean> {
		return await this.checkRootAccess();
	}

	async requestPermission(): Promise<boolean> {
		return await this.checkRootAccess();
	}

	async getInstalledApps(): Promise<AppInfo[]> {
		return await shizukuInstance.getInstalledApps();
	}

	async killApps(packageNames: string[]): Promise<KillResult> {
		if (Platform.OS !== "android" || !ShizukuKillerModule) {
			return { success: [], failed: packageNames };
		}
		return await ShizukuKillerModule.killAppsViaRoot(packageNames);
	}

	setAutoHibernationConfig(enabled: boolean, packageNames: string[]): void {
		shizukuInstance.setAutoHibernationConfig(enabled, packageNames);
	}
	setQuickActionNotification(enabled: boolean): void {
		shizukuInstance.setQuickActionNotification(enabled);
	}
	async checkInitialQuickFreeze(): Promise<boolean> {
		return await shizukuInstance.checkInitialQuickFreeze();
	}

	async checkRootAccess(): Promise<boolean> {
		if (Platform.OS !== "android" || !ShizukuKillerModule) {
			return false;
		}
		return await ShizukuKillerModule.checkRootAccess();
	}
}

const shizukuInstance = new ShizukuKillerServiceImpl();
const rootInstance = new RootKillerServiceImpl();

let currentMode: KillerMode = "shizuku";

export const setKillerMode = (mode: KillerMode): void => {
	currentMode = mode;
	if (
		Platform.OS === "android" &&
		ShizukuKillerModule &&
		ShizukuKillerModule.setWorkingMode
	) {
		ShizukuKillerModule.setWorkingMode(mode);
	}
};

export const setGeekOptions = (
	aggressiveDoze: boolean,
	gcmWakeupBypass: boolean,
	deepTrimMemory: boolean,
): void => {
	if (
		Platform.OS === "android" &&
		ShizukuKillerModule &&
		ShizukuKillerModule.setGeekOptions
	) {
		ShizukuKillerModule.setGeekOptions(
			aggressiveDoze,
			gcmWakeupBypass,
			deepTrimMemory,
		);
	}
};

export const setHibernationOptions = (
	smart: boolean,
	finerMedia: boolean,
	shallow: boolean,
	wakeUp: boolean,
	dontRemoveNotif: boolean,
	ignoreBackgroundFree: boolean,
): void => {
	if (
		Platform.OS === "android" &&
		ShizukuKillerModule &&
		ShizukuKillerModule.setHibernationOptions
	) {
		ShizukuKillerModule.setHibernationOptions(
			smart,
			finerMedia,
			shallow,
			wakeUp,
			dontRemoveNotif,
			ignoreBackgroundFree,
		);
	}
};

export const getKillerService = (
	mode: KillerMode = currentMode,
): IKillerService => {
	if (mode === "root") {
		return rootInstance;
	}
	return shizukuInstance;
};

export const killerService: IKillerService = {
	checkBinder: () => getKillerService(currentMode).checkBinder(),
	checkPermission: () => getKillerService(currentMode).checkPermission(),
	requestPermission: () => getKillerService(currentMode).requestPermission(),
	getInstalledApps: () => getKillerService(currentMode).getInstalledApps(),
	killApps: (pkgs) => getKillerService(currentMode).killApps(pkgs),
	setAutoHibernationConfig: (e, p) =>
		getKillerService(currentMode).setAutoHibernationConfig(e, p),
	setQuickActionNotification: (e) =>
		getKillerService(currentMode).setQuickActionNotification(e),
	checkInitialQuickFreeze: () =>
		getKillerService(currentMode).checkInitialQuickFreeze(),
	checkRootAccess: () => getKillerService(currentMode).checkRootAccess(),
};

export const checkBatteryOptimization = async (): Promise<boolean> => {
	if (Platform.OS !== "android" || !ShizukuKillerModule) return true;
	return await ShizukuKillerModule.isIgnoringBatteryOptimizations();
};

export const requestBatteryOptimization = async (): Promise<boolean> => {
	if (Platform.OS !== "android" || !ShizukuKillerModule) return true;
	return await ShizukuKillerModule.requestIgnoreBatteryOptimizations();
};

export const setProOptions = (options: {
	phantomSlayer?: boolean;
	bedtimeShield?: boolean;
	emergencyTrigger?: boolean;
	ramCrunchSlayer?: boolean;
	autoKillScheduler?: number;
	bedtimeStart?: number;
	bedtimeEnd?: number;
}): void => {
	if (Platform.OS === "android" && ShizukuKillerModule?.setProOptions) {
		ShizukuKillerModule.setProOptions(options);
	}
};

export const freezeQuarantinePackage = async (
	pkg: string,
	freeze: boolean,
): Promise<{ success: boolean; errorCode: string }> => {
	if (
		Platform.OS !== "android" ||
		!ShizukuKillerModule?.freezeQuarantinePackage
	)
		return { success: false, errorCode: "unavailable" };
	return await ShizukuKillerModule.freezeQuarantinePackage(pkg, freeze);
};

export const getQuarantinePackages = async (): Promise<string[]> => {
	if (Platform.OS !== "android" || !ShizukuKillerModule?.getQuarantinePackages)
		return [];
	return await ShizukuKillerModule.getQuarantinePackages();
};

export const getImpactAnalytics = async () => {
	if (Platform.OS !== "android" || !ShizukuKillerModule?.getImpactAnalytics)
		return null;
	return await ShizukuKillerModule.getImpactAnalytics();
};

export const getResurrectionDetectiveReport = async () => {
	if (
		Platform.OS !== "android" ||
		!ShizukuKillerModule?.getResurrectionDetectiveReport
	)
		return [];
	return await ShizukuKillerModule.getResurrectionDetectiveReport();
};

export const showNativeTimePicker = async (
	currentMinutes: number,
): Promise<number | null> => {
	if (Platform.OS !== "android" || !ShizukuKillerModule?.showTimePicker)
		return null;
	try {
		const h = Math.floor(currentMinutes / 60);
		const m = currentMinutes % 60;
		return await ShizukuKillerModule.showTimePicker(h, m);
	} catch {
		return null;
	}
};
