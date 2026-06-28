import type React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useAppStore } from "../stores/useAppStore";

export const ShizukuStatusCard: React.FC = () => {
	const isShizukuActive = useAppStore((state) => state.isShizukuActive);
	const isPermissionGranted = useAppStore((state) => state.isPermissionGranted);
	const isLoading = useAppStore((state) => state.isLoading);
	const checkShizukuStatus = useAppStore((state) => state.checkShizukuStatus);
	const requestShizukuPermission = useAppStore(
		(state) => state.requestShizukuPermission,
	);

	return (
		<View className="bg-slate-900 border border-slate-800 p-5 rounded-2xl mb-4 shadow-lg">
			<View className="flex-row items-center justify-between mb-3">
				<View className="flex-row items-center gap-3">
					<View
						className={`w-3 h-3 rounded-full ${
							isShizukuActive && isPermissionGranted
								? "bg-emerald-500"
								: "bg-rose-500"
						}`}
					/>
					<Text className="text-white font-bold text-base">Status Shizuku</Text>
				</View>
				<Pressable
					onPress={checkShizukuStatus}
					accessibilityRole="button"
					className="px-3 py-1 bg-slate-800 rounded-lg active:bg-slate-700"
				>
					<Text className="text-xs text-slate-300 font-medium">Refresh</Text>
				</Pressable>
			</View>

			<Text className="text-slate-400 text-sm mb-4">
				{!isShizukuActive
					? "Layanan Shizuku tidak terdeteksi aktif di perangkat ini. Harap jalankan aplikasi Shizuku terlebih dahulu."
					: !isPermissionGranted
						? "Shizuku aktif, tetapi aplikasi ini belum memiliki izin akses."
						: "Terhubung dan izin diberikan. Aplikasi siap mengeksekusi force stop."}
			</Text>

			{isShizukuActive && !isPermissionGranted && (
				<Pressable
					onPress={requestShizukuPermission}
					disabled={isLoading}
					accessibilityRole="button"
					className="bg-sky-600 py-3 rounded-xl items-center justify-center active:bg-sky-500 flex-row gap-2"
				>
					{isLoading && <ActivityIndicator color="#ffffff" size="small" />}
					<Text className="text-white font-bold text-sm">
						Minta Izin Shizuku
					</Text>
				</Pressable>
			)}
		</View>
	);
};
