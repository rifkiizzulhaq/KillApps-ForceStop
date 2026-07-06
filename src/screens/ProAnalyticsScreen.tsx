import {
	ArrowLeft,
	Search,
	ShieldAlert,
	Sparkles,
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
import { useTheme } from "../hooks/useTheme";
import {
	getImpactAnalytics,
	getResurrectionDetectiveReport,
} from "../services/killerService";
import { useAppStore } from "../stores/useAppStore";
import type { ImpactAnalytics, ResurrectionItem } from "../types/app";

export const ProAnalyticsScreen: React.FC = () => {
	const { colors, isDark } = useTheme();
	const apps = useAppStore((state) => state.apps);
	const setCurrentScreen = useAppStore((state) => state.setCurrentScreen);
	const [analytics, setAnalytics] = useState<ImpactAnalytics | null>(null);
	const [resurrections, setResurrections] = useState<ResurrectionItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const onBackPress = () => {
			setCurrentScreen("settings");
			return true;
		};
		const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
		return () => sub.remove();
	}, [setCurrentScreen]);

	useEffect(() => {
		setLoading(true);
		Promise.all([getImpactAnalytics(), getResurrectionDetectiveReport()])
			.then(([analyticsData, resurrectionData]) => {
				if (analyticsData) setAnalytics(analyticsData);
				if (resurrectionData) setResurrections(resurrectionData);
			})
			.finally(() => setLoading(false));
	}, []);

	const filteredResurrections = resurrections.filter(
		(item) =>
			item.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.packageName.toLowerCase().includes(searchQuery.toLowerCase()),
	);

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
						<Sparkles size={22} color="#10b981" />
						<View className="ml-2">
							<Text className={`${colors.textClass} font-bold text-lg`}>
								Live Impact & Forensik
							</Text>
							<Text className={`${colors.subTextClass} text-xs`}>
								Telemetri penghematan & pelacak aplikasi bandel
							</Text>
						</View>
					</View>
				</View>
			</View>

			{loading ? (
				<View className="py-16 items-center flex-1 p-4">
					<Text className={`${colors.subTextClass} text-sm`}>
						Menganalisis data telemetri sistem...
					</Text>
				</View>
			) : (
				<FlatList
					className="flex-1"
					contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
					showsVerticalScrollIndicator={false}
					data={filteredResurrections}
					keyExtractor={(item) => item.packageName}
					initialNumToRender={15}
					maxToRenderPerBatch={10}
					windowSize={5}
					ListHeaderComponent={
						<View>
							{(analytics?.lastRamBeforeMb ?? 0) > 0 && (
								<View className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5 mb-4">
									<Text className="text-blue-500 font-extrabold text-xs tracking-wider uppercase mb-4">
										DAMPAK EKSEKUSI TERAKHIR (REAL-TIME)
									</Text>
									<View className="flex-row justify-between mb-3">
										<Text className={`${colors.subTextClass} text-sm`}>
											Free RAM Sebelum:
										</Text>
										<Text className={`${colors.textClass} font-bold text-sm`}>
											{(analytics?.lastRamBeforeMb ?? 0).toFixed(0)} MB
										</Text>
									</View>
									<View className="flex-row justify-between mb-3">
										<Text className={`${colors.subTextClass} text-sm`}>
											Free RAM Sesudah:
										</Text>
										<Text className={`${colors.textClass} font-bold text-sm`}>
											{(analytics?.lastRamAfterMb ?? 0).toFixed(0)} MB
										</Text>
									</View>
									<View className="flex-row justify-between pt-3 border-t border-blue-500/20">
										<Text className={`${colors.subTextClass} text-sm font-bold`}>
											Memori Terbebas Instan:
										</Text>
										<Text className="text-blue-500 font-black text-base">
											+{Math.max(0, (analytics?.lastRamAfterMb ?? 0) - (analytics?.lastRamBeforeMb ?? 0)).toFixed(0)} MB
										</Text>
									</View>
								</View>
							)}

							<View className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 mb-6">
								<Text className="text-emerald-500 font-extrabold text-xs tracking-wider uppercase mb-4">
									BUKTI NYATA PENGHEMATAN (LIFETIME)
								</Text>
								<View className="flex-row justify-between mb-3">
									<Text className={`${colors.subTextClass} text-sm`}>
										Total Aplikasi Dimatikan:
									</Text>
									<Text className={`${colors.textClass} font-bold text-sm`}>
										{analytics?.totalKilledCount || 0} kali
									</Text>
								</View>
								<View className="flex-row justify-between mb-3">
									<Text className={`${colors.subTextClass} text-sm`}>
										Kebangkitan Diblokir:
									</Text>
									<Text className={`${colors.textClass} font-bold text-sm`}>
										{analytics?.blockedWakeupsCount || 0} sinyal
									</Text>
								</View>
								<View className="flex-row justify-between pt-3 border-t border-emerald-500/20">
									<Text className={`${colors.subTextClass} text-sm font-bold`}>
										Estimasi RAM Diselamatkan:
									</Text>
									<Text className="text-emerald-500 font-black text-base">
										{(analytics?.totalRamSavedMb || 0).toFixed(0)} MB
									</Text>
								</View>
							</View>

							<View className="mb-2">
								<View className="flex-row items-center mb-2">
									<ShieldAlert size={20} color="#f43f5e" />
									<Text
										className={`${colors.textClass} font-bold text-base ml-2`}
									>
										Resurrection Detective (Wall of Shame)
									</Text>
								</View>
								<Text className={`${colors.subTextClass} text-xs mb-3 leading-5`}>
									Daftar aplikasi paling bandel yang terus mencoba bangkit
									diam-diam di latar belakang hari ini:
								</Text>

								{resurrections.length > 0 && (
									<View
										className={`flex-row items-center ${colors.inputBgClass} border ${colors.borderClass} rounded-xl px-3.5 py-2.5 mb-3`}
									>
										<Search size={18} color={colors.subIconColor} />
										<TextInput
											placeholder="Cari aplikasi bandel..."
											placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
											value={searchQuery}
											onChangeText={setSearchQuery}
											className={`flex-1 ${colors.textClass} text-sm ml-2.5 p-0 font-medium`}
										/>
										{searchQuery.length > 0 && (
											<Pressable
												onPress={() => setSearchQuery("")}
												className="p-1"
											>
												<X size={16} color={colors.subIconColor} />
											</Pressable>
										)}
									</View>
								)}
							</View>
						</View>
					}
					ListEmptyComponent={
						resurrections.length === 0 ? (
							<View className="p-6 bg-gray-500/10 rounded-2xl items-center my-2">
								<Text className={`${colors.subTextClass} text-xs text-center`}>
									Tidak ada aplikasi bandel terdeteksi hari ini!
								</Text>
							</View>
						) : (
							<View className="p-6 bg-gray-500/10 rounded-2xl items-center my-2">
								<Text className={`${colors.subTextClass} text-xs text-center`}>
									Tidak ada aplikasi yang cocok dengan pencarian "{searchQuery}".
								</Text>
							</View>
						)
					}
					renderItem={({ item }) => {
						const matchedApp = apps.find(
							(a) => a.packageName === item.packageName,
						);
						return (
							<View
								key={item.packageName}
								className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl p-3.5 mb-2 flex-row items-center justify-between`}
							>
								<View className="flex-row items-center flex-1 pr-3">
									{matchedApp?.icon ? (
										<Image
											source={{ uri: matchedApp.icon }}
											className={`w-10 h-10 rounded-xl mr-3 ${colors.secondaryBtnClass}`}
										/>
									) : (
										<View
											className={`w-10 h-10 rounded-xl mr-3 ${colors.secondaryBtnClass} items-center justify-center`}
										>
											<Text className={`${colors.textClass} font-bold text-base`}>
												{item.appName.charAt(0).toUpperCase()}
											</Text>
										</View>
									)}
									<View className="flex-1">
										<Text
											className={`${colors.textClass} font-bold text-sm`}
											numberOfLines={1}
										>
											{item.appName}
										</Text>
										<Text
											className={`${colors.captionClass} text-[11px] mt-0.5`}
											numberOfLines={1}
										>
											{item.packageName}
										</Text>
									</View>
								</View>
								<View className="bg-rose-500/20 px-3 py-1.5 rounded-xl">
									<Text className="text-rose-500 font-black text-xs">
										+{item.restartCount}x bangkit
									</Text>
								</View>
							</View>
						);
					}}
				/>
			)}
		</View>
	);
};
