import { ArrowLeft, Check, Info, Search, X } from "lucide-react-native";
import type React from "react";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	BackHandler,
	Pressable,
	SectionList,
	Text,
	TextInput,
	View,
} from "react-native";
import { HeaderMenu } from "../components/common/HeaderMenu";
import { AppListItem } from "../components/lists/AppListItem";
import { useTheme } from "../hooks/useTheme";
import { useAppStore } from "../stores/useAppStore";

export const AddAppsScreen: React.FC = () => {
	const currentScreen = useAppStore((state) => state.currentScreen);
	const setCurrentScreen = useAppStore((state) => state.setCurrentScreen);
	const apps = useAppStore((state) => state.apps);
	const isLoading = useAppStore((state) => state.isLoading);
	const fetchApps = useAppStore((state) => state.fetchApps);
	const addSelectedToHibernation = useAppStore(
		(state) => state.addSelectedToHibernation,
	);
	const showSystemApps = useAppStore((state) => state.showSystemApps);
	const toggleShowSystemApps = useAppStore(
		(state) => state.toggleShowSystemApps,
	);
	const hibernationList = useAppStore((state) => state.hibernationList);
	const isRootActive = useAppStore((state) => state.isRootActive);
	const isShizukuActive = useAppStore((state) => state.isShizukuActive);
	const isPermissionGranted = useAppStore((state) => state.isPermissionGranted);
	const settings = useAppStore((state) => state.settings);
	const { colors, isDark } = useTheme();

	const isModeVerified =
		settings.workingMode === "root"
			? isRootActive
			: isShizukuActive && isPermissionGranted;

	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [isSearching, setIsSearching] = useState(false);

	useEffect(() => {
		if (currentScreen === "add_apps" && apps.length === 0) {
			fetchApps();
		}
	}, [currentScreen, apps.length, fetchApps]);

	useEffect(() => {
		const onBackPress = () => {
			setCurrentScreen("home");
			return true;
		};
		const subscription = BackHandler.addEventListener(
			"hardwareBackPress",
			onBackPress,
		);
		return () => subscription.remove();
	}, [setCurrentScreen]);

	useEffect(() => {
		setIsSearching(true);
		const timer = setTimeout(() => {
			setDebouncedQuery(searchQuery);
			setIsSearching(false);
		}, 250);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	const runningApps = apps
		.filter((app) => !hibernationList.includes(app.packageName))
		.filter((app) => (showSystemApps ? true : !app.isSystemApp))
		.filter((app) => !app.isStopped)
		.filter(
			(app) =>
				app.appName.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
				app.packageName.toLowerCase().includes(debouncedQuery.toLowerCase()),
		);

	const otherApps = apps
		.filter((app) => !hibernationList.includes(app.packageName))
		.filter((app) => (showSystemApps ? true : !app.isSystemApp))
		.filter((app) => app.isStopped)
		.filter(
			(app) =>
				app.appName.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
				app.packageName.toLowerCase().includes(debouncedQuery.toLowerCase()),
		);

	const selectedCount = apps.filter((a) => a.isSelected).length;

	const sections = [
		{
			title: `Berjalan di Latar Belakang (${runningApps.length})`,
			data: runningApps,
			emptyText: "Tidak ada aplikasi pihak ketiga yang aktif berjalan.",
		},
		{
			title: `Aplikasi Lainnya (${otherApps.length})`,
			data: otherApps,
			emptyText: null,
		},
	];

	return (
		<View className={`flex-1 ${colors.bgClass}`}>
			<View
				className={`flex-row items-center justify-between px-6 py-4 border-b ${colors.borderClass} ${colors.bgClass}`}
			>
				<View className="flex-row items-center gap-4">
					<Pressable
						testID="btn-back"
						onPress={() => setCurrentScreen("home")}
						className={`w-10 h-10 items-center justify-center rounded-full ${colors.secondaryBtnClass}`}
					>
						<ArrowLeft size={24} color={colors.iconColor} />
					</Pressable>
					<View>
						<Text className={`${colors.textClass} font-bold text-lg`}>
							Penganalisis Aplikasi
						</Text>
						<Text className={`${colors.subTextClass} text-xs`}>
							Pilih aplikasi untuk ditambahkan ke KillApps
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

			<View className="px-4 pt-3 pb-1">
				<View
					className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl p-3.5 mb-3`}
				>
					<View className="flex-row items-center gap-2 mb-1.5">
						<Info size={16} color={colors.iconColor} />
						<Text className={`${colors.textClass} font-bold text-xs`}>
							Panduan Memilih Aplikasi & Apa itu GCM?
						</Text>
					</View>
					<Text className={`${colors.subTextClass} text-[11px] leading-4`}>
						• <Text className="font-bold">Sangat Disarankan:</Text> Sosmed,
						game, & e-commerce (Shopee/IG/TikTok) yang boros baterai di latar
						belakang.{"\n"}• <Text className="font-bold">Hindari:</Text>{" "}
						Aplikasi perpesanan utama (WhatsApp/Telegram) atau alarm agar tidak
						telat terima notifikasi penting.{"\n"}•{" "}
						<Text className="font-bold">Fungsi GCM Bypass:</Text> Google Cloud
						Messaging adalah layanan notifikasi promo. Aplikasi yang dipilih ke
						daftar ini tidak akan bisa diam-diam hidup kembali saat menerima
						promo jika GCM Bypass aktif di pengaturan.
					</Text>
				</View>

				<View
					className={`flex-row items-center ${colors.inputBgClass} border ${colors.borderClass} rounded-xl px-3.5 py-2.5`}
				>
					<Search size={18} color={colors.subIconColor} />
					<TextInput
						testID="search-input"
						placeholder="Cari aplikasi untuk ditambahkan..."
						placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
						value={searchQuery}
						onChangeText={setSearchQuery}
						className={`flex-1 ${colors.textClass} text-sm ml-2.5 p-0 font-medium`}
					/>
					{searchQuery.length > 0 && (
						<Pressable
							testID="btn-clear-search"
							onPress={() => setSearchQuery("")}
							className="p-1"
						>
							<X size={16} color={colors.subIconColor} />
						</Pressable>
					)}
				</View>
			</View>

			{isLoading || isSearching ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator
						testID="loading-spinner"
						size="large"
						color={colors.iconColor}
					/>
					<Text className={`${colors.subTextClass} mt-3 text-sm`}>
						{isLoading
							? "Memindai aplikasi di latar belakang..."
							: "Mencari aplikasi..."}
					</Text>
				</View>
			) : (
				<View
					className="flex-1"
					pointerEvents={isModeVerified ? "auto" : "none"}
					style={{ opacity: isModeVerified ? 1 : 0.4 }}
				>
					<SectionList
						testID="app-section-list"
						sections={sections}
						decelerationRate={settings?.smoothScroll ? 0.992 : "normal"}
						keyExtractor={(item) => item.packageName}
						renderItem={({ item }) => <AppListItem app={item} />}
						renderSectionHeader={({ section }) => (
							<View
								className={`flex-row items-center justify-between mb-3 mt-4 px-1 ${colors.bgClass}`}
							>
								<Text
									testID="section-header-text"
									className={`${colors.textClass} font-black text-xs tracking-wider uppercase`}
								>
									{section.title}
								</Text>
							</View>
						)}
						renderSectionFooter={({ section }) =>
							section.data.length === 0 && section.emptyText ? (
								<View
									className={`p-4 ${colors.cardClass} rounded-xl border ${colors.cardBorderClass} items-center mb-6`}
								>
									<Text
										testID="section-empty-text"
										className={`${colors.captionClass} text-xs`}
									>
										{section.emptyText}
									</Text>
								</View>
							) : (
								<View className="mb-6" />
							)
						}
						initialNumToRender={15}
						maxToRenderPerBatch={15}
						windowSize={5}
						contentContainerStyle={{
							paddingHorizontal: 16,
							paddingBottom: 100,
						}}
						stickySectionHeadersEnabled={false}
					/>
				</View>
			)}

			{selectedCount > 0 && (
				<Pressable
					testID="fab-add-selected"
					onPress={() => isModeVerified && addSelectedToHibernation()}
					disabled={!isModeVerified}
					style={{ elevation: 10 }}
					className={`absolute bottom-6 right-6 z-50 w-16 h-16 rounded-full items-center justify-center transition-all border ${
						!isModeVerified
							? "opacity-40 bg-zinc-700 border-zinc-600"
							: isDark
								? "bg-zinc-800 border-zinc-600 active:opacity-80"
								: "bg-zinc-900 border-zinc-700 active:opacity-80"
					}`}
				>
					<Check size={30} color="#ffffff" strokeWidth={3} />
				</Pressable>
			)}
		</View>
	);
};
