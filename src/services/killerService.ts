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
}

class RootKillerServiceImpl implements IKillerService {
	async checkBinder(): Promise<boolean> {
		return false;
	}

	async checkPermission(): Promise<boolean> {
		return false;
	}

	async requestPermission(): Promise<boolean> {
		return false;
	}

	async getInstalledApps(): Promise<AppInfo[]> {
		return [];
	}

	async killApps(packageNames: string[]): Promise<KillResult> {
		return { success: [], failed: packageNames };
	}

	setAutoHibernationConfig(): void {}
	setQuickActionNotification(): void {}
	async checkInitialQuickFreeze(): Promise<boolean> {
		return false;
	}
}

const shizukuInstance = new ShizukuKillerServiceImpl();
const rootInstance = new RootKillerServiceImpl();

export const getKillerService = (
	mode: KillerMode = "shizuku",
): IKillerService => {
	if (mode === "root") {
		return rootInstance;
	}
	return shizukuInstance;
};

export const killerService = getKillerService("shizuku");
