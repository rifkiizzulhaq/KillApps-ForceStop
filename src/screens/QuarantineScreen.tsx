import { ArrowLeft, Search, Snowflake, X } from "lucide-react-native";
import type React from "react";
import { useEffect, useState } from "react";
import {
	BackHandler,
	Image,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
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
		const success = await freezeQuarantinePackage(pkg, nextState);
		if (success) {
			setFrozenSet((prev) => {
				const next = new Set(prev);
				if (nextState) next.add(pkg);
				else next.delete(pkg);
				return next;
			});
			// Jika difreeze, otomatis hapus dari hibernationList agar tidak muncul di home screen
			if (nextState) {
				removeFromHibernation(pkg);
			}
		}
		setProcessingPkg(null);
	};

	const filteredApps = apps.filter(
		(app) =>
			app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			app.packageName.toLowerCase().includes(searchQuery.toLowerCase()),
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

				<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
					{apps.length === 0 ? (
						<View className="p-6 bg-gray-500/10 rounded-2xl items-center my-8">
							<Text
								className={`${colors.subTextClass} text-xs text-center leading-relaxed`}
							>
								Daftar aplikasi belum dimuat. Silakan kembali ke layar utama
								terlebih dahulu agar sistem dapat memindai daftar aplikasi di HP
								Anda.
							</Text>
						</View>
					) : filteredApps.length === 0 ? (
						<View className="p-6 bg-gray-500/10 rounded-2xl items-center my-8">
							<Text
								className={`${colors.subTextClass} text-xs text-center leading-relaxed`}
							>
								Tidak ada aplikasi yang cocok dengan pencarian "{searchQuery}".
							</Text>
						</View>
					) : (
						filteredApps.slice(0, 50).map((app) => {
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
						})
					)}
				</ScrollView>
			</View>
		</View>
	);
};
