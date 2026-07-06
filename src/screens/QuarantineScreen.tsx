import {
	AlertTriangle,
	ArrowLeft,
	Search,
	Snowflake,
	X,
} from "lucide-react-native";
import type React from "react";
import { useEffect, useState } from "react";
import {
	BackHandler,
	FlatList,
	Image,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { InfoModal } from "../components/modals/InfoModal";
import { useTheme } from "../hooks/useTheme";
import {
	freezeQuarantinePackage,
	getQuarantinePackages,
} from "../services/killerService";
import { useAppStore } from "../stores/useAppStore";

export const QuarantineScreen: React.FC = () => {
	const { colors, isDark } = useTheme();
	const apps = useAppStore((state) => state.apps);
	const setCurrentScreen = useAppStore((state) => state.setCurrentScreen);
	const removeFromHibernation = useAppStore(
		(state) => state.removeFromHibernation,
	);
	const [frozenSet, setFrozenSet] = useState<Set<string>>(new Set());
	const [processingPkg, setProcessingPkg] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [modalState, setModalState] = useState({
		visible: false,
		title: "",
		content: "",
	});

	useEffect(() => {
		const onBackPress = () => {
			setCurrentScreen("settings");
			return true;
		};
		const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
		return () => sub.remove();
	}, [setCurrentScreen]);

	useEffect(() => {
		getQuarantinePackages().then((pkgs) => {
			setFrozenSet(new Set(pkgs));
		});
	}, []);

	const toggleFreeze = async (pkg: string) => {
		if (processingPkg) return;
		setProcessingPkg(pkg);
		const currentlyFrozen = frozenSet.has(pkg);
		const nextState = !currentlyFrozen;
		const { success, errorCode } = await freezeQuarantinePackage(
			pkg,
			nextState,
		);
		if (success) {
			setFrozenSet((prev) => {
				const next = new Set(prev);
				if (nextState) next.add(pkg);
				else next.delete(pkg);
				return next;
			});
			if (nextState) {
				removeFromHibernation(pkg);
			}
		} else {
			const title = nextState ? "Gagal Membekukan" : "Gagal Mencairkan";
			let message = "Terjadi kesalahan tak terduga. Pastikan Shizuku aktif.";
			if (errorCode === "webview_provider") {
				message =
					"Aplikasi ini sedang digunakan sebagai mesin perender web (WebView) utama oleh sistem Anda. Membekukannya sekarang akan membuat aplikasi lain error/blank putih.\n\n" +
					"Cara aman untuk membekukannya:\n" +
					"1. Install 'Android System WebView' dari Play Store (jika belum ada).\n" +
					"2. Buka Pengaturan HP Anda, cari 'Penerapan WebView' atau 'WebView'.\n" +
					"3. Ubah centangnya ke 'Android System WebView'.\n" +
					"4. Kembali ke sini dan bekukan aplikasi ini.";
			} else if (errorCode === "system_protected") {
				message =
					"Aplikasi ini diproteksi oleh sistem Android atau ROM perangkat Anda " +
					"dan tidak dapat dinonaktifkan melalui jalur ADB/Shizuku.\n\n" +
					"Untuk membekukan aplikasi sistem, diperlukan akses Root.";
			} else if (errorCode === "unfreeze_failed") {
				message =
					"Gagal mengaktifkan kembali aplikasi. " +
					"Coba aktifkan manual melalui Pengaturan → Aplikasi di HP Anda.";
			}
			setModalState({ visible: true, title, content: message });
		}
		setProcessingPkg(null);
	};

	const filteredApps = apps
		.filter(
			(app) =>
				app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				app.packageName.toLowerCase().includes(searchQuery.toLowerCase()),
		)
		.sort((a, b) => {
			const aFrozen = frozenSet.has(a.packageName);
			const bFrozen = frozenSet.has(b.packageName);
			if (aFrozen && !bFrozen) return -1;
			if (!aFrozen && bFrozen) return 1;
			return a.appName.localeCompare(b.appName);
		});

	return (
		<View className={`flex-1 ${colors.bgClass}`}>
			<View
				className={`flex-row items-center justify-between px-6 py-4 border-b ${colors.borderClass} ${colors.bgClass}`}
			>
				<View className="flex-row items-center gap-4">
					<Pressable
						onPress={() => setCurrentScreen("settings")}
						className={`w-10 h-10 items-center justify-center rounded-full ${colors.secondaryBtnClass}`}
					>
						<ArrowLeft size={24} color={colors.iconColor} />
					</Pressable>
					<View className="flex-row items-center space-x-2">
						<Snowflake size={22} color="#3b82f6" />
						<View className="ml-2">
							<Text className={`${colors.textClass} font-bold text-lg`}>
								Deep Freeze Vault
							</Text>
							<Text className={`${colors.subTextClass} text-xs`}>
								Karantina dan penonaktifan total aplikasi di OS
							</Text>
						</View>
					</View>
				</View>
			</View>

			<View className="flex-1 p-4">
				<View
					className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl p-3.5 mb-3`}
				>
					<Text className={`${colors.subTextClass} text-[11px] leading-4`}>
						Aplikasi yang dibekukan di sini akan{" "}
						<Text className="font-bold text-blue-500">DINONAKTIFKAN TOTAL</Text>{" "}
						dari sistem Android (0 MB RAM & 0% Baterai). Ikon aplikasi sementara
						hilang dari homescreen HP sampai Anda mencairkannya kembali.
					</Text>
					<View className="mt-3 pt-3 border-t border-amber-500/20">
						<View className="flex-row items-center gap-1.5 mb-1.5">
							<AlertTriangle size={14} color="#f59e0b" />
							<Text className={`${colors.textClass} font-bold text-xs`}>
								Batas Kemampuan OS
							</Text>
						</View>
						<Text className={`${colors.subTextClass} text-[11px] leading-4`}>
							Setiap OS Android punya aturan berbeda. Beberapa aplikasi mungkin
							menolak dibekukan total tanpa adanya akses Root yang memadai.
						</Text>
					</View>
				</View>

				<View
					className={`flex-row items-center ${colors.inputBgClass} border ${colors.borderClass} rounded-xl px-3.5 py-2.5 mb-3`}
				>
					<Search size={18} color={colors.subIconColor} />
					<TextInput
						placeholder="Cari aplikasi untuk dibekukan..."
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

				{apps.length === 0 ? (
					<View className="p-6 bg-gray-500/10 rounded-2xl items-center my-8 mx-4">
						<Text
							className={`${colors.subTextClass} text-xs text-center leading-relaxed`}
						>
							Daftar aplikasi belum dimuat. Silakan kembali ke layar utama
							terlebih dahulu agar sistem dapat memindai daftar aplikasi di HP
							Anda.
						</Text>
					</View>
				) : filteredApps.length === 0 ? (
					<View className="p-6 bg-gray-500/10 rounded-2xl items-center my-8 mx-4">
						<Text
							className={`${colors.subTextClass} text-xs text-center leading-relaxed`}
						>
							Tidak ada aplikasi yang cocok dengan pencarian "{searchQuery}".
						</Text>
					</View>
				) : (
					<FlatList
						data={filteredApps}
						keyExtractor={(item) => item.packageName}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{ paddingBottom: 20 }}
						initialNumToRender={15}
						maxToRenderPerBatch={10}
						windowSize={5}
						renderItem={({ item: app }) => {
							const isFrozen = frozenSet.has(app.packageName);
							const isBusy = processingPkg === app.packageName;
							return (
								<View
									key={app.packageName}
									className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl p-3.5 mb-2 flex-row items-center justify-between`}
								>
									<View className="flex-row items-center flex-1 pr-3">
										{app.icon ? (
											<Image
												source={{ uri: app.icon }}
												className={`w-10 h-10 rounded-xl mr-3 ${colors.secondaryBtnClass}`}
											/>
										) : (
											<View
												className={`w-10 h-10 rounded-xl mr-3 ${colors.secondaryBtnClass} items-center justify-center`}
											>
												<Text
													className={`${colors.textClass} font-bold text-base`}
												>
													{app.appName.charAt(0).toUpperCase()}
												</Text>
											</View>
										)}
										<View className="flex-1">
											<Text
												className={`${colors.textClass} font-bold text-sm`}
												numberOfLines={1}
											>
												{app.appName}
											</Text>
											<Text
												className={`${colors.captionClass} text-[11px] mt-0.5`}
												numberOfLines={1}
											>
												{app.packageName}
											</Text>
										</View>
									</View>
									<Pressable
										onPress={() => toggleFreeze(app.packageName)}
										disabled={isBusy}
										className={`px-3.5 py-2 rounded-xl ${isFrozen ? "bg-blue-500" : "bg-gray-500/20"}`}
									>
										<Text
											className={`${isFrozen ? "text-white" : colors.textClass} font-bold text-xs`}
										>
											{isBusy ? "..." : isFrozen ? "BEKU" : "BEKUKAN"}
										</Text>
									</Pressable>
								</View>
							);
						}}
					/>
				)}
			</View>
			<InfoModal
				visible={modalState.visible}
				title={modalState.title}
				content={modalState.content}
				onClose={() => setModalState({ ...modalState, visible: false })}
			/>
		</View>
	);
};
