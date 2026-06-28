import type React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { useAppStore } from "../stores/useAppStore";

export const ShizukuStatusCard: React.FC = () => {
	const isShizukuActive = useAppStore((state) => state.isShizukuActive);
	const isPermissionGranted = useAppStore((state) => state.isPermissionGranted);
	const isLoading = useAppStore((state) => state.isLoading);
	const checkShizukuStatus = useAppStore((state) => state.checkShizukuStatus);
	const requestShizukuPermission = useAppStore(
		(state) => state.requestShizukuPermission,
	);
	const { colors } = useTheme();

	return (
		<View
			className={`${colors.cardClass} border ${colors.cardBorderClass} p-5 rounded-2xl mb-4`}
		>
			<View className="flex-row items-center justify-between mb-3">
				<View className="flex-row items-center gap-3">
					<View
						className={`w-3 h-3 rounded-full ${
							isShizukuActive && isPermissionGranted
								? "bg-emerald-500"
								: "bg-zinc-500"
						}`}
					/>
					<Text className={`${colors.textClass} font-bold text-base`}>
						Status Shizuku
					</Text>
				</View>
				<Pressable
					onPress={checkShizukuStatus}
					accessibilityRole="button"
					className={`px-3 py-1 ${colors.secondaryBtnClass} border ${colors.borderClass} rounded-lg active:opacity-70`}
				>
					<Text
						className={`text-xs ${colors.secondaryBtnTextClass} font-medium`}
					>
						Refresh
					</Text>
				</Pressable>
			</View>

			<Text className={`${colors.subTextClass} text-sm mb-4`}>
				{!isShizukuActive
					? "Layanan Shizuku tidak terdeteksi aktif di perangkat ini. Harap jalankan aplikasi Shizuku terlebih dahulu."
					: !isPermissionGranted
						? "Shizuku aktif, tetapi aplikasi ini belum memiliki izin akses."
						: "Terhubung dan izin diberikan. Aplikasi siap mengeksekusi KillApps."}
			</Text>

			{isShizukuActive && !isPermissionGranted && (
				<Pressable
					onPress={requestShizukuPermission}
					disabled={isLoading}
					accessibilityRole="button"
					className={`${colors.primaryBtnClass} py-3 rounded-xl items-center justify-center active:opacity-80 flex-row gap-2`}
				>
					{isLoading && (
						<ActivityIndicator
							color={
								colors.primaryBtnTextClass === "text-black"
									? "#000000"
									: "#ffffff"
							}
							size="small"
						/>
					)}
					<Text className={`${colors.primaryBtnTextClass} font-black text-sm`}>
						Minta Izin Shizuku
					</Text>
				</Pressable>
			)}
		</View>
	);
};
