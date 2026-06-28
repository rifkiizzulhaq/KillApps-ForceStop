import type React from "react";
import { useEffect } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { AppListItem } from "../components/AppListItem";
import { HeaderMenu } from "../components/HeaderMenu";
import { useAppStore } from "../stores/useAppStore";

export const AddAppsScreen: React.FC = () => {
	const currentScreen = useAppStore((state) => state.currentScreen);
	const setCurrentScreen = useAppStore((state) => state.setCurrentScreen);
	const apps = useAppStore((state) => state.apps);
	const hibernationList = useAppStore((state) => state.hibernationList);
	const isLoading = useAppStore((state) => state.isLoading);
	const showSystemApps = useAppStore((state) => state.showSystemApps);
	const toggleShowSystemApps = useAppStore(
		(state) => state.toggleShowSystemApps,
	);
	const fetchApps = useAppStore((state) => state.fetchApps);
	const addSelectedToHibernation = useAppStore(
		(state) => state.addSelectedToHibernation,
	);

	useEffect(() => {
		if (currentScreen === "add_apps" && apps.length === 0) {
			fetchApps();
		}
	}, [currentScreen, apps.length, fetchApps]);

	if (currentScreen !== "add_apps") {
		return null;
	}

	const filteredApps = apps.filter(
		(app) =>
			!hibernationList.includes(app.packageName) &&
			(showSystemApps || !app.isSystemApp),
	);
	const runningApps = filteredApps.filter((app) => !app.isStopped);
	const otherApps = filteredApps.filter((app) => app.isStopped);
	const selectedCount = filteredApps.filter((app) => app.isSelected).length;

	return (
		<View className="flex-1 bg-slate-950">
			<View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-900 bg-slate-950">
				<View className="flex-row items-center gap-4">
					<Pressable
						onPress={() => setCurrentScreen("home")}
						className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-900"
					>
						<Text className="text-white font-bold text-lg">←</Text>
					</Pressable>
					<View>
						<Text className="text-white font-bold text-lg">
							Penganalisis Aplikasi
						</Text>
						<Text className="text-slate-400 text-xs">
							Pilih aplikasi untuk dihibernasi
						</Text>
					</View>
				</View>

				<HeaderMenu
					options={[
						{
							label: "Tampilkan Aplikasi Sistem",
							active: showSystemApps,
							onPress: toggleShowSystemApps,
						},
					]}
				/>
			</View>

			{isLoading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#f43f5e" />
					<Text className="text-slate-400 mt-3 text-sm">
						Memindai aplikasi di latar belakang...
					</Text>
				</View>
			) : (
				<ScrollView className="flex-1 px-4 pt-4">
					<View className="mb-6">
						<View className="flex-row items-center justify-between mb-3 px-1">
							<Text className="text-emerald-400 font-bold text-xs tracking-wider uppercase">
								Berjalan di Latar Belakang ({runningApps.length})
							</Text>
						</View>
						{runningApps.length === 0 ? (
							<View className="p-4 bg-slate-900/40 rounded-xl border border-slate-900 items-center">
								<Text className="text-slate-500 text-xs">
									Tidak ada aplikasi pihak ketiga yang aktif berjalan.
								</Text>
							</View>
						) : (
							runningApps.map((app) => (
								<AppListItem key={app.packageName} app={app} />
							))
						)}
					</View>

					<View className="mb-24">
						<View className="flex-row items-center justify-between mb-3 px-1">
							<Text className="text-slate-400 font-bold text-xs tracking-wider uppercase">
								Aplikasi Lainnya ({otherApps.length})
							</Text>
						</View>
						{otherApps.map((app) => (
							<AppListItem key={app.packageName} app={app} />
						))}
					</View>
				</ScrollView>
			)}

			{selectedCount > 0 && (
				<View className="absolute bottom-6 right-6">
					<Pressable
						onPress={addSelectedToHibernation}
						className="w-16 h-16 bg-emerald-600 rounded-full items-center justify-center shadow-2xl active:bg-emerald-500 border border-emerald-400/30"
					>
						<Text className="text-white font-black text-2xl">✓</Text>
					</Pressable>
				</View>
			)}
		</View>
	);
};
