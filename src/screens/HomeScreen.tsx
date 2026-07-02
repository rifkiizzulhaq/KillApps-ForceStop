import { Brain, Layers, Plus, Search, Snowflake, X } from "lucide-react-native";
import type React from "react";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	AppState,
	DeviceEventEmitter,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { HeaderMenu } from "../components/common/HeaderMenu";
import { ShizukuStatusCard } from "../components/common/ShizukuStatusCard";
import { HibernationListItem } from "../components/lists/HibernationListItem";
import { AboutModal } from "../components/modals/AboutModal";
import { QuickKillModal } from "../components/modals/QuickKillModal";
import { SettingsModal } from "../components/modals/SettingsModal";
import { useTheme } from "../hooks/useTheme";
import { killerService } from "../services/killerService";
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
	const removeFromHibernation = useAppStore(
		(state) => state.removeFromHibernation,
	);
	const killHibernationApps = useAppStore((state) => state.killHibernationApps);
	const killSingleApp = useAppStore((state) => state.killSingleApp);
	const checkShizukuStatus = useAppStore((state) => state.checkShizukuStatus);
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
		checkShizukuStatus();
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
	}, [
		checkShizukuStatus,
		killHibernationApps,
		killSingleApp,
		fetchApps,
		apps.length,
	]);

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

	const activeApps = targetApps.filter((a) => !a.isStopped);
	const hibernatedApps = targetApps.filter((a) => a.isStopped);
	const activeTargetsCount = settings?.ignoreBackgroundFree
		? activeApps.length
		: targetApps.length;

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
					<ShizukuStatusCard />
				</View>
			)}

			{killMessage && (
				<Pressable
					testID="kill-message-pressable"
					onPress={clearKillMessage}
					className={`mx-4 mt-3 ${colors.cardClass} border ${colors.cardBorderClass} p-4 rounded-2xl flex-row justify-between items-center`}
				>
					<View className="flex-1 mr-2">
						<Text
							testID="kill-message-text"
							className={`${colors.textClass} text-xs font-semibold leading-5`}
						>
							{killMessage}
						</Text>
						{(settings?.smartHibernation || settings?.shallowHibernation) && (
							<View className="flex-row flex-wrap items-center gap-2 mt-2">
								{settings?.smartHibernation && (
									<View className="flex-row items-center bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
										<Brain size={13} color="#3b82f6" />
										<Text className="text-[11px] text-blue-500 font-bold ml-1.5">
											Smart KillApps aktif
										</Text>
									</View>
								)}
								{settings?.shallowHibernation && (
									<View className="flex-row items-center bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
										<Snowflake size={13} color="#06b6d4" />
										<Text className="text-[11px] text-cyan-500 font-bold ml-1.5">
											KillApps dangkal diterapkan
										</Text>
									</View>
								)}
							</View>
						)}
					</View>
					<View className="ml-2">
						<X size={16} color={colors.iconColor} />
					</View>
				</Pressable>
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
				<View className="flex-1 items-center justify-center px-8">
					<View
						className={`w-24 h-24 rounded-full ${colors.cardClass} border ${colors.cardBorderClass} items-center justify-center mb-6`}
					>
						<Layers size={40} color={colors.iconColor} />
					</View>
					<Text
						testID="empty-state-text"
						className={`${colors.textClass} font-bold text-xl mb-2 text-center`}
					>
						Selamat Datang di KillApps
					</Text>
					<Text
						className={`${colors.subTextClass} text-center text-sm leading-6 mb-8`}
					>
						Belum ada aplikasi yang ditambahkan ke daftar KillApps. Tekan tombol
						+ di bawah untuk memilih aplikasi latar belakang yang ingin
						dimatikan otomatis.
					</Text>
				</View>
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

					<ScrollView
						className="flex-1 px-4 pt-3 mb-24"
						showsVerticalScrollIndicator={false}
						decelerationRate={settings?.smoothScroll ? 0.992 : "normal"}
						overScrollMode="never"
					>
						<View className="flex-row items-center justify-between mb-3 px-2">
							<Text
								className={`${colors.captionClass} font-bold text-xs tracking-wider uppercase`}
							>
								Daftar KillApps ({targetApps.length})
							</Text>
						</View>

						{targetApps.length === 0 ? (
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
						) : (
							<View className="pb-2">
								{activeApps.length > 0 && (
									<View className="mb-4">
										<View className="flex-row items-center gap-2 mb-2.5 px-2">
											<View className="w-2 h-2 rounded-full bg-emerald-500" />
											<Text
												testID="active-header"
												className={`${colors.textClass} font-black text-xs tracking-wider uppercase`}
											>
												Sedang Aktif ({activeApps.length})
											</Text>
										</View>
										{activeApps.map((app) => (
											<HibernationListItem
												key={app.packageName}
												app={app}
												onRemove={removeFromHibernation}
												onKill={killSingleApp}
												disabled={!isModeVerified}
											/>
										))}
									</View>
								)}

								{hibernatedApps.length > 0 && (
									<View className="mb-2">
										<View
											className={`flex-row items-center gap-2 mb-2.5 px-2 ${activeApps.length > 0 ? "mt-2" : ""}`}
										>
											<View className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
											<Text
												testID="hibernated-header"
												className={`${colors.captionClass} font-bold text-xs tracking-wider uppercase`}
											>
												Sudah Di-kill / Tertidur ({hibernatedApps.length})
											</Text>
										</View>
										{hibernatedApps.map((app) => (
											<HibernationListItem
												key={app.packageName}
												app={app}
												onRemove={removeFromHibernation}
												onKill={killSingleApp}
												disabled={!isModeVerified}
											/>
										))}
									</View>
								)}
							</View>
						)}
					</ScrollView>
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
		</View>
	);
};
