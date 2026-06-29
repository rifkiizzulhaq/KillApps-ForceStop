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
