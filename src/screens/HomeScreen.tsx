import type React from "react";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	AppState,
	DeviceEventEmitter,
	Image,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { AboutModal } from "../components/AboutModal";
import { HeaderMenu } from "../components/HeaderMenu";
import { QuickFreezeModal } from "../components/QuickFreezeModal";
import { SettingsModal } from "../components/SettingsModal";
import { killerService } from "../services/killerService";
import { useAppStore } from "../stores/useAppStore";
import { AddAppsScreen } from "./AddAppsScreen";

export const HomeScreen: React.FC = () => {
	const currentScreen = useAppStore((state) => state.currentScreen);
	const setCurrentScreen = useAppStore((state) => state.setCurrentScreen);
	const apps = useAppStore((state) => state.apps);
	const hibernationList = useAppStore((state) => state.hibernationList);
	const settings = useAppStore((state) => state.settings);
	const removeFromHibernation = useAppStore(
		(state) => state.removeFromHibernation,
	);
	const killHibernationApps = useAppStore((state) => state.killHibernationApps);
	const isKilling = useAppStore((state) => state.isKilling);
	const killMessage = useAppStore((state) => state.killMessage);
	const clearKillMessage = useAppStore((state) => state.clearKillMessage);
	const checkShizukuStatus = useAppStore((state) => state.checkShizukuStatus);
	const fetchApps = useAppStore((state) => state.fetchApps);
	const [showQuickFreezeModal, setShowQuickFreezeModal] = useState(false);

	useEffect(() => {
		checkShizukuStatus();
		if (currentScreen === "home") {
			fetchApps();
		}
	}, [checkShizukuStatus, currentScreen, fetchApps]);

	useEffect(() => {
		killerService.checkInitialQuickFreeze().then((res) => {
			if (res) {
				setShowQuickFreezeModal(true);
			}
		});

		const frozenSub = DeviceEventEmitter.addListener("onAppsFrozen", () => {
			fetchApps();
		});

		const quickFreezeSub = DeviceEventEmitter.addListener(
			"onOpenQuickFreeze",
			() => {
				setShowQuickFreezeModal(true);
				fetchApps();
			},
		);

		const appStateSub = AppState.addEventListener("change", (nextState) => {
			if (nextState === "active") {
				fetchApps();
			}
		});

		return () => {
			frozenSub.remove();
			quickFreezeSub.remove();
			appStateSub.remove();
		};
	}, [fetchApps]);

	useEffect(() => {
		killerService.setAutoHibernationConfig(
			settings?.autoHibernation ?? false,
			hibernationList,
		);
	}, [settings?.autoHibernation, hibernationList]);

	useEffect(() => {
		killerService.setQuickActionNotification(
			settings?.quickActionNotif ?? false,
		);
	}, [settings?.quickActionNotif]);

	if (currentScreen === "add_apps") {
		return <AddAppsScreen />;
	}

	const targetApps = apps.filter((app) =>
		hibernationList.includes(app.packageName),
	);
	const activeTargetsCount = targetApps.filter((app) => !app.isStopped).length;

	return (
		<View className="flex-1 bg-slate-950">
			<SettingsModal />
			<AboutModal />
			<QuickFreezeModal
				visible={showQuickFreezeModal}
				onClose={() => setShowQuickFreezeModal(false)}
			/>

			<View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-900 bg-slate-950">
				<View>
					<Text className="text-2xl font-black text-white tracking-wider">
						KILL<Text className="text-rose-500">APP</Text>
					</Text>
					<Text className="text-slate-400 text-xs font-semibold">
						Penganalisis & Hibernasi 1-Klik
					</Text>
				</View>

				<HeaderMenu
					options={[
						{
							label: "Pengaturan",
							onPress: () => setCurrentScreen("settings"),
						},
						{
							label: "Tentang",
							onPress: () => setCurrentScreen("about"),
						},
					]}
				/>
			</View>

			{killMessage && (
				<Pressable
					onPress={clearKillMessage}
					className="mx-6 mt-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl flex-row justify-between items-center shadow-lg"
				>
					<Text className="text-slate-200 text-xs font-semibold flex-1">
						{killMessage}
					</Text>
					<Text className="text-rose-400 font-bold ml-3">✕</Text>
				</Pressable>
			)}

			{hibernationList.length === 0 ? (
				<View className="flex-1 items-center justify-center px-8">
					<View className="w-24 h-24 rounded-full bg-slate-900 border border-slate-800 items-center justify-center mb-6 shadow-inner">
						<Text className="text-4xl">🍃</Text>
					</View>
					<Text className="text-white font-bold text-xl mb-2 text-center">
						Selamat Datang di KillApp
					</Text>
					<Text className="text-slate-400 text-center text-sm leading-6 mb-8">
						Belum ada aplikasi yang ditambahkan ke daftar hibernasi. Tekan
						tombol + di bawah untuk memilih aplikasi latar belakang yang ingin
						dimatikan otomatis.
					</Text>
				</View>
			) : (
				<ScrollView className="flex-1 px-4 pt-4 mb-24">
					<View className="flex-row items-center justify-between mb-3 px-2">
						<Text className="text-slate-400 font-bold text-xs tracking-wider uppercase">
							Daftar Hibernasi ({hibernationList.length})
						</Text>
						{activeTargetsCount > 0 && (
							<Text className="text-emerald-400 font-semibold text-xs">
								{activeTargetsCount} Aktif Berjalan
							</Text>
						)}
					</View>

					{targetApps.map((app) => (
						<View
							key={app.packageName}
							className="flex-row items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl mb-2.5 shadow-md"
						>
							<View className="flex-row items-center flex-1 pr-3">
								{app.icon ? (
									<Image
										source={{ uri: app.icon }}
										className="w-11 h-11 rounded-xl mr-3 bg-slate-800/80"
									/>
								) : (
									<View className="w-11 h-11 rounded-xl mr-3 bg-slate-800 items-center justify-center">
										<Text className="text-white font-bold text-base">
											{app.appName.charAt(0).toUpperCase()}
										</Text>
									</View>
								)}

								<View className="flex-1">
									<View className="flex-row items-center gap-2">
										<Text
											numberOfLines={1}
											className="text-white font-bold text-base flex-1"
										>
											{app.appName}
										</Text>
										{app.isGcm && (
											<View className="bg-sky-500/20 border border-sky-500/30 px-2 py-0.5 rounded">
												<Text className="text-[10px] font-bold text-sky-400">
													GCM
												</Text>
											</View>
										)}
										<View
											className={`px-2 py-0.5 rounded border ${
												app.isStopped
													? "bg-slate-800 border-slate-700"
													: "bg-emerald-500/20 border-emerald-500/30"
											}`}
										>
											<Text
												className={`text-[10px] font-bold ${
													app.isStopped ? "text-slate-400" : "text-emerald-400"
												}`}
											>
												{app.isStopped ? "Zzz" : "Aktif"}
											</Text>
										</View>
									</View>
									<Text
										numberOfLines={1}
										className="text-slate-400 text-xs mt-1"
									>
										{app.packageName}
									</Text>
								</View>
							</View>

							<Pressable
								onPress={() => removeFromHibernation(app.packageName)}
								className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center active:bg-slate-700"
							>
								<Text className="text-rose-400 font-bold text-sm">✕</Text>
							</Pressable>
						</View>
					))}
				</ScrollView>
			)}

			{hibernationList.length > 0 && (
				<View className="absolute bottom-6 left-6 right-28">
					<Pressable
						onPress={killHibernationApps}
						disabled={isKilling || activeTargetsCount === 0}
						className={`py-4 px-6 rounded-2xl items-center justify-center shadow-2xl flex-row gap-3 ${
							activeTargetsCount > 0
								? "bg-rose-600 active:bg-rose-500 border border-rose-400/30"
								: "bg-slate-900 border border-slate-800 opacity-80"
						}`}
					>
						{isKilling && <ActivityIndicator color="#ffffff" size="small" />}
						<Text className="text-white font-black text-sm tracking-wider">
							{isKilling
								? "MEMATIKAN..."
								: `HIBERNASI SEKARANG (${activeTargetsCount})`}
						</Text>
					</Pressable>
				</View>
			)}

			<View className="absolute bottom-6 right-6">
				<Pressable
					onPress={() => setCurrentScreen("add_apps")}
					className="w-16 h-16 bg-sky-600 rounded-full items-center justify-center shadow-2xl active:bg-sky-500 border border-sky-400/30"
				>
					<Text className="text-white font-black text-3xl">+</Text>
				</Pressable>
			</View>
		</View>
	);
};
