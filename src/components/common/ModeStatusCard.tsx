import type React from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useAppStore } from "../../stores/useAppStore";

export const ModeStatusCard: React.FC = () => {
	const isShizukuActive = useAppStore((state) => state.isShizukuActive);
	const isPermissionGranted = useAppStore((state) => state.isPermissionGranted);
	const isRootActive = useAppStore((state) => state.isRootActive);
	const settings = useAppStore((state) => state.settings);
	const checkShizukuStatus = useAppStore((state) => state.checkShizukuStatus);
	const checkRootStatus = useAppStore((state) => state.checkRootStatus);
	const { colors } = useTheme();

	const isRoot = settings.workingMode === "root";
	const isVerified = isRoot
		? isRootActive
		: isShizukuActive && isPermissionGranted;

	const handleRefresh = async () => {
		if (isRoot) {
			checkRootStatus();
		} else {
			await checkShizukuStatus();
			const state = useAppStore.getState();
			if (state.isShizukuActive && !state.isPermissionGranted) {
				setTimeout(() => {
					useAppStore.getState().requestShizukuPermission();
				}, 400);
			}
		}
	};

	return (
		<View
			className={`${colors.cardClass} border ${colors.cardBorderClass} p-5 rounded-2xl mb-4`}
		>
			<View className="flex-row items-center justify-between mb-3">
				<View className="flex-row items-center gap-3">
					<View
						className={`w-3 h-3 rounded-full ${
							isVerified ? "bg-emerald-500" : "bg-zinc-500"
						}`}
					/>
					<Text className={`${colors.textClass} font-bold text-base`}>
						{isRoot ? "Status Root" : "Status Shizuku"}
					</Text>
				</View>
				<Pressable
					testID="btn-refresh"
					onPress={handleRefresh}
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

			<Text
				testID="status-text"
				className={`${colors.subTextClass} text-sm mb-4`}
			>
				{isRoot
					? !isRootActive
						? "Akses Superuser (Root) tidak terdeteksi atau ditolak. Harap izinkan akses Root di Magisk/KernelSU."
						: "Akses Superuser (Root) aktif. Aplikasi siap mengeksekusi KillApps."
					: !isShizukuActive
						? "Layanan Shizuku tidak terdeteksi aktif di perangkat ini. Harap jalankan aplikasi Shizuku terlebih dahulu."
						: !isPermissionGranted
							? "Shizuku aktif, tetapi aplikasi ini belum memiliki izin akses."
							: "Terhubung dan izin diberikan. Aplikasi siap mengeksekusi KillApps."}
			</Text>
		</View>
	);
};
