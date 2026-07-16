import { Plus, Search, X } from "lucide-react-native";
import type React from "react";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	AppState,
	DeviceEventEmitter,
	FlatList,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { HeaderMenu } from "../components/common/HeaderMenu";
import { ModeStatusCard } from "../components/common/ModeStatusCard";
import { HomeEmptyState } from "../components/home/HomeEmptyState";
import { KillMessageCard } from "../components/home/KillMessageCard";
import { HibernationListItem } from "../components/lists/HibernationListItem";
import { AboutModal } from "../components/modals/AboutModal";
import { InfoModal } from "../components/modals/InfoModal";
import { QuickKillModal } from "../components/modals/QuickKillModal";
import { SettingsModal } from "../components/modals/SettingsModal";
import { useTheme } from "../hooks/useTheme";
import { CRITICAL_PACKAGES, killerService } from "../services/killer";
import { useAppStore } from "../stores/useAppStore";

export const HomeScreen: React.FC = () => {
	const apps = useAppStore((state) => state.apps);
	const hibernationList = useAppStore((state) => state.hibernationList);
	const isShizukuActive = useAppStore((state) => state.isShizukuActive);
	const isPermissionGranted = useAppStore((state) => state.isPermissionGranted);
	const isRootActive = useAppStore((state) => state.isRootActive);
	const isLoading = useAppStore((state) => state.isLoading);
	const isKilling = useAppStore((state) => state.isKilling);
	const killMessage = useAppStore((state) => state.killMessage);
	const webviewModalVisible = useAppStore((state) => state.webviewModalVisible);
	const setWebviewModalVisible = useAppStore(
		(state) => state.setWebviewModalVisible,
	);
	const removeFromHibernation = useAppStore(
		(state) => state.removeFromHibernation,
	);
	const killHibernationApps = useAppStore((state) => state.killHibernationApps);
	const killSingleApp = useAppStore((state) => state.killSingleApp);

	const fetchApps = useAppStore((state) => state.fetchApps);
	const clearKillMessage = useAppStore((state) => state.clearKillMessage);
	const setCurrentScreen = useAppStore((state) => state.setCurrentScreen);
	const settings = useAppStore((state) => state.settings);
	const { colors, isDark } = useTheme();

	const isModeVerified =
		settings.workingMode === "root"
			? isRootActive
			: isShizukuActive && isPermissionGranted;

	const [searchQuery, setSearchQuery] = useState("");
	const [showQuickKillModal, setShowQuickKillModal] = useState(false);

	useEffect(() => {
		if (apps.length === 0) {
			fetchApps();
		}

		const subscription = DeviceEventEmitter.addListener(
			"ON_APP_KILLED_NOTIF",
			async () => {
				await killHibernationApps();
			},
		);

		const notifSub = DeviceEventEmitter.addListener(
			"ON_NOTIF_ACTION_CLICKED",
			async () => {
				await killHibernationApps();
			},
		);

		const singleSub = DeviceEventEmitter.addListener(
			"ON_SINGLE_KILL_CLICKED",
			async (event: { packageName?: string }) => {
				if (event?.packageName) {
					await killSingleApp(event.packageName);
				}
			},
		);

		const freezeAllSub = DeviceEventEmitter.addListener(
			"ON_FREEZE_ALL_CLICKED",
			() => {
				setShowQuickKillModal(true);
			},
		);

		const frozenSub = DeviceEventEmitter.addListener("onAppsFrozen", () => {
			setTimeout(() => {
				fetchApps(true);
			}, 200);
		});

		const appStateSub = AppState.addEventListener("change", (nextAppState) => {
			if (nextAppState === "active") {
				fetchApps(true);
			}
		});

		return () => {
			subscription.remove();
			notifSub.remove();
			singleSub.remove();
			freezeAllSub.remove();
			frozenSub.remove();
			appStateSub.remove();
		};
	}, [killHibernationApps, killSingleApp, fetchApps, apps.length]);

	useEffect(() => {
		killerService.setAutoHibernationConfig(
			Boolean(isModeVerified && settings?.autoHibernation),
			hibernationList,
		);
	}, [isModeVerified, settings?.autoHibernation, hibernationList]);

	useEffect(() => {
		killerService.setQuickActionNotification(
			Boolean(isModeVerified && settings?.quickActionNotif),
		);
	}, [isModeVerified, settings?.quickActionNotif]);

	useEffect(() => {
		if (killMessage) {
			const timer = setTimeout(() => {
				clearKillMessage();
			}, 6000);
			return () => clearTimeout(timer);
		}
	}, [killMessage, clearKillMessage]);

	const targetApps = apps
		.filter((app) => hibernationList.includes(app.packageName))
		.filter(
			(app) =>
				app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				app.packageName.toLowerCase().includes(searchQuery.toLowerCase()),
		);

	const filterSmart = (app: import("../types/app").AppInfo) =>
		!(
			settings?.smartHibernation &&
			(app.isSmartProtected || CRITICAL_PACKAGES.has(app.packageName))
		);

	const activeApps = targetApps.filter((a) => !a.isStopped && filterSmart(a));
	const hibernatedApps = targetApps.filter(
		(a) => a.isStopped && filterSmart(a),
	);

	const filteredTargetApps = targetApps.filter(filterSmart);
	const activeTargetsCount = settings?.ignoreBackgroundFree
		? activeApps.length
		: filteredTargetApps.length;

	return (
		<View className={`flex-1 ${colors.bgClass}`}>
			<SettingsModal />
			<AboutModal />
			<QuickKillModal
				visible={showQuickKillModal}
				onClose={() => setShowQuickKillModal(false)}
			/>

			<View
				className={`flex-row items-center justify-between px-6 py-4 border-b ${colors.borderClass} ${colors.bgClass}`}
			>
				<View className="shrink-0">
					<View className="flex-row items-baseline shrink-0">
						<Text
							className={`text-2xl font-black ${colors.textClass} tracking-wider shrink-0`}
						>
							KILL
						</Text>
						<Text
							className={`text-2xl font-black ${colors.subTextClass} tracking-wider shrink-0`}
						>
							APPS
						</Text>
					</View>
					<Text className={`${colors.subTextClass} text-xs font-semibold`}>
						KillApps - Penghemat Baterai & RAM
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

			{!isModeVerified && (
				<View className="px-4 pt-3">
					<ModeStatusCard />
				</View>
			)}

			{killMessage && (
				<KillMessageCard
					killMessage={killMessage}
					clearKillMessage={clearKillMessage}
					isSmartHibernation={Boolean(settings?.smartHibernation)}
					isShallowHibernation={Boolean(settings?.shallowHibernation)}
				/>
			)}

			{hibernationList.length > 0 && (isLoading || apps.length === 0) ? (
				<View className="flex-1 items-center justify-center px-8">
					<ActivityIndicator size="large" color={colors.iconColor} />
					<Text
						testID="loading-state-text"
						className={`${colors.textClass} font-bold text-base mt-4 mb-1 text-center`}
					>
						Memuat Daftar KillApps...
					</Text>
					<Text className={`${colors.subTextClass} text-center text-xs`}>
						Memeriksa aplikasi yang sudah dilist
					</Text>
				</View>
			) : targetApps.length === 0 && searchQuery === "" ? (
				<HomeEmptyState />
			) : (
				<>
					<View className="px-4 pt-3 pb-1">
						<View
							className={`flex-row items-center ${colors.inputBgClass} border ${colors.borderClass} rounded-xl px-3.5 py-2.5`}
						>
							<Search size={18} color={colors.subIconColor} />
							<TextInput
								testID="search-input"
								placeholder="Cari di daftar KillApps..."
								placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
								value={searchQuery}
								onChangeText={setSearchQuery}
								className={`flex-1 ${colors.textClass} text-sm ml-2.5 p-0 font-medium`}
							/>
							{searchQuery.length > 0 && (
								<Pressable onPress={() => setSearchQuery("")} className="p-1">
									<X size={16} color={colors.subIconColor} />
								</Pressable>
							)}
						</View>
					</View>

					<FlatList
						className="flex-1 px-4 pt-3 mb-24"
						showsVerticalScrollIndicator={false}
						decelerationRate={settings?.smoothScroll ? 0.992 : "normal"}
						overScrollMode="never"
						data={
							targetApps.length === 0
								? []
								: [
										...(activeApps.length > 0
											? [
													{
														type: "header" as const,
														id: "header-active",
														title: `Sedang Aktif (${activeApps.length})`,
														dotColor: "bg-emerald-500",
													},
													...activeApps.map((app) => ({
														type: "app" as const,
														id: `active-${app.packageName}`,
														app,
													})),
												]
											: []),
										...(hibernatedApps.length > 0
											? [
													{
														type: "header" as const,
														id: "header-hibernated",
														title: `Sudah Di-kill / Tertidur (${hibernatedApps.length})`,
														dotColor: "bg-zinc-400 dark:bg-zinc-600",
													},
													...hibernatedApps.map((app) => ({
														type: "app" as const,
														id: `hibernated-${app.packageName}`,
														app,
													})),
												]
											: []),
									]
						}
						keyExtractor={(item) => item.id}
						initialNumToRender={15}
						maxToRenderPerBatch={10}
						windowSize={5}
						ListHeaderComponent={
							<View className="flex-row items-center justify-between mb-3 px-2">
								<Text
									className={`${colors.captionClass} font-bold text-xs tracking-wider uppercase`}
								>
									Daftar KillApps ({targetApps.length})
								</Text>
							</View>
						}
						ListEmptyComponent={
							<View className="items-center justify-center pt-16 px-6">
								<Search size={36} color={colors.subIconColor} opacity={0.5} />
								<Text
									testID="not-found-text"
									className={`${colors.textClass} font-bold text-base mt-4 mb-1 text-center`}
								>
									Aplikasi Tidak Ditemukan
								</Text>
								<Text
									className={`${colors.subTextClass} text-center text-xs leading-5`}
								>
									Tidak ada aplikasi yang cocok dengan kata kunci "{searchQuery}
									".
								</Text>
							</View>
						}
						renderItem={({ item }) => {
							if (item.type === "header") {
								return (
									<View
										className={`flex-row items-center gap-2 mb-2.5 px-2 ${item.id === "header-hibernated" && activeApps.length > 0 ? "mt-4" : ""}`}
									>
										<View className={`w-2 h-2 rounded-full ${item.dotColor}`} />
										<Text
											className={`${colors.textClass} font-black text-xs tracking-wider uppercase`}
										>
											{item.title}
										</Text>
									</View>
								);
							}

							const app = item.app;
							return (
								<HibernationListItem
									key={app.packageName}
									app={app}
									onRemove={removeFromHibernation}
									onKill={killSingleApp}
									disabled={!isModeVerified}
									isSmartProtected={Boolean(
										settings?.smartHibernation &&
											(app.isSmartProtected ||
												CRITICAL_PACKAGES.has(app.packageName)),
									)}
									isMediaApp={Boolean(
										settings?.finerMediaDetection && app.isMediaApp,
									)}
								/>
							);
						}}
					/>
				</>
			)}

			{targetApps.length > 0 && (
				<View
					style={{ elevation: 10 }}
					className="absolute bottom-6 left-6 right-24 z-50"
				>
					<Pressable
						testID="fab-kill-all"
						onPress={killHibernationApps}
						disabled={!isModeVerified || isKilling || activeTargetsCount === 0}
						className={`w-full h-14 px-4 rounded-2xl items-center justify-center flex-row gap-3 border transition-all ${
							isModeVerified && activeTargetsCount > 0
								? isDark
									? "bg-zinc-800 border-zinc-600 active:opacity-80"
									: "bg-zinc-900 border-zinc-700 active:opacity-80"
								: `${colors.cardClass} ${colors.cardBorderClass} opacity-40`
						}`}
					>
						{isKilling && <ActivityIndicator color="#ffffff" size="small" />}
						<Text
							testID="fab-kill-text"
							numberOfLines={1}
							className={`font-black text-xs sm:text-sm tracking-wider ${
								isModeVerified && activeTargetsCount > 0
									? "text-white"
									: colors.subTextClass
							}`}
						>
							{isKilling
								? "MEMATIKAN..."
								: `KILLAPPS SEKARANG (${activeTargetsCount})`}
						</Text>
					</Pressable>
				</View>
			)}

			<Pressable
				testID="fab-add"
				onPress={() => {
					if (!isModeVerified) return;
					setCurrentScreen("add_apps");
				}}
				disabled={!isModeVerified}
				style={{ elevation: 10 }}
				className={`absolute bottom-6 right-6 z-50 w-14 h-14 rounded-full items-center justify-center transition-all border ${
					!isModeVerified
						? `${colors.cardClass} ${colors.cardBorderClass} opacity-40`
						: isDark
							? "bg-zinc-800 border-zinc-600 active:opacity-80"
							: "bg-zinc-900 border-zinc-700 active:opacity-80"
				}`}
			>
				<Plus size={28} color="#ffffff" strokeWidth={3} />
			</Pressable>

			<InfoModal
				visible={webviewModalVisible}
				title="Aplikasi WebView Dilewati"
				content={
					"Sistem melewati proses kill untuk aplikasi WebView karena saat ini sedang digunakan sebagai penyedia WebView default di Opsi Developer (agar tidak crash).\n\nUbah pengaturan default-nya ke 'Android System WebView' terlebih dahulu untuk bisa mematikannya."
				}
				onClose={() => setWebviewModalVisible(false)}
			/>
		</View>
	);
};
