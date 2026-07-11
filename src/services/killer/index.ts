import type { AppInfo, KillerMode, KillResult } from "../../types/app";
import { NativeKiller } from "./NativeKillerModule";

class CoreKillerService {
	async checkBinder(): Promise<boolean> {
		/* istanbul ignore next */ if (!NativeKiller) return false;
		return await NativeKiller.checkBinder();
	}

	async checkPermission(): Promise<boolean> {
		/* istanbul ignore next */ if (!NativeKiller) return false;
		return await NativeKiller.checkPermission();
	}

	async requestPermission(): Promise<boolean> {
		/* istanbul ignore next */ if (!NativeKiller) return false;
		return await NativeKiller.requestPermission();
	}

	async getInstalledApps(): Promise<AppInfo[]> {
		/* istanbul ignore next */ if (!NativeKiller) return [];
		const apps = await NativeKiller.getInstalledApps();
		return apps.map((app) => ({ ...app, isSelected: false }));
	}

	async killApps(packageNames: string[]): Promise<KillResult> {
		/* istanbul ignore next */ if (!NativeKiller)
			return { success: [], failed: packageNames };
		return await NativeKiller.killApps(packageNames);
	}

	setAutoHibernationConfig(enabled: boolean, packageNames: string[]): void {
		/* istanbul ignore next */ if (NativeKiller?.setAutoHibernationConfig) {
			NativeKiller.setAutoHibernationConfig(enabled, packageNames);
		}
	}

	setQuickActionNotification(enabled: boolean): void {
		/* istanbul ignore next */ if (NativeKiller?.setQuickActionNotification) {
			NativeKiller.setQuickActionNotification(enabled);
		}
	}

	async checkInitialQuickFreeze(): Promise<boolean> {
		/* istanbul ignore next */ if (NativeKiller?.checkInitialQuickFreeze) {
			return await NativeKiller.checkInitialQuickFreeze();
		}
		return false;
	}

	async checkRootAccess(): Promise<boolean> {
		/* istanbul ignore next */ if (!NativeKiller) return false;
		return await NativeKiller.checkRootAccess();
	}
}

export const killerService = new CoreKillerService();

export const setKillerMode = (mode: KillerMode): void => {
	/* istanbul ignore next */ if (NativeKiller?.setWorkingMode) {
		NativeKiller.setWorkingMode(mode);
	}
};

export const setGeekOptions = (
	aggressiveDoze: boolean,
	gcmWakeupBypass: boolean,
	deepTrimMemory: boolean,
): void => {
	/* istanbul ignore next */ if (NativeKiller?.setGeekOptions) {
		NativeKiller.setGeekOptions(
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
	/* istanbul ignore next */ if (NativeKiller?.setHibernationOptions) {
		NativeKiller.setHibernationOptions(
			smart,
			finerMedia,
			shallow,
			wakeUp,
			dontRemoveNotif,
			ignoreBackgroundFree,
		);
	}
};

export const checkBatteryOptimization = async (): Promise<boolean> => {
	/* istanbul ignore next */ if (!NativeKiller) return true;
	return await NativeKiller.isIgnoringBatteryOptimizations();
};

export const requestBatteryOptimization = async (): Promise<boolean> => {
	/* istanbul ignore next */ if (!NativeKiller) return true;
	return await NativeKiller.requestIgnoreBatteryOptimizations();
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
	/* istanbul ignore next */ if (NativeKiller?.setProOptions) {
		NativeKiller.setProOptions(options);
	}
};

export const clearAllNativeData = (): void => {
	/* istanbul ignore next */ if (NativeKiller?.clearAllData) {
		NativeKiller.clearAllData();
	}
};

export const freezeQuarantinePackage = async (
	pkg: string,
	freeze: boolean,
): Promise<{ success: boolean; errorCode: string }> => {
	/* istanbul ignore next */ if (!NativeKiller?.freezeQuarantinePackage)
		return { success: false, errorCode: "unavailable" };
	return await NativeKiller.freezeQuarantinePackage(pkg, freeze);
};

export const getQuarantinePackages = async (): Promise<string[]> => {
	/* istanbul ignore next */ if (!NativeKiller?.getQuarantinePackages)
		return [];
	return await NativeKiller.getQuarantinePackages();
};

export const getImpactAnalytics = async () => {
	/* istanbul ignore next */ if (!NativeKiller?.getImpactAnalytics) return null;
	return await NativeKiller.getImpactAnalytics();
};

export const getResurrectionDetectiveReport = async () => {
	/* istanbul ignore next */ if (!NativeKiller?.getResurrectionDetectiveReport)
		return [];
	return await NativeKiller.getResurrectionDetectiveReport();
};

export const showNativeTimePicker = async (
	currentMinutes: number,
): Promise<number | null> => {
	/* istanbul ignore next */ if (!NativeKiller?.showTimePicker) return null;
	try {
		const h = Math.floor(currentMinutes / 60);
		const m = currentMinutes % 60;
		return await NativeKiller.showTimePicker(h, m);
	} catch {
		return null;
	}
};

export const CRITICAL_PACKAGES = new Set<string>(
	NativeKiller?.getConstants().CRITICAL_PACKAGES ?? [
		"android",
		"com.android.systemui",
		"com.android.settings",
		"com.google.android.gms",
		"com.google.android.inputmethod.latin",
		"com.android.inputmethod.latin",
		"com.google.android.apps.maps",
		"com.waze",
		"com.android.phone",
		"com.android.server.telecom",
		"com.samsung.android.dialer",
		"com.android.vending",
		"com.google.android.webview",
		"com.android.webview",
	],
);
