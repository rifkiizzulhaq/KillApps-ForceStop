import { Check, ShieldAlert, Terminal, Zap } from "lucide-react-native";
import type React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useAppStore } from "../../stores/useAppStore";

interface Props {
	isVerifying: boolean;
	setIsVerifying: (val: boolean) => void;
	startVerification: (mode: string) => void;
	isModeVerified: boolean;
}

export const WorkingModeSlide: React.FC<Props> = ({
	isVerifying,
	setIsVerifying,
	startVerification,
	isModeVerified,
}) => {
	const { colors, isDark } = useTheme();
	const settings = useAppStore((state) => state.settings);
	const updateSetting = useAppStore((state) => state.updateSetting);
	const currentMode = settings.workingMode;

	const isShizukuActive = useAppStore((state) => state.isShizukuActive);
	const isPermissionGranted = useAppStore((state) => state.isPermissionGranted);
	const requestShizukuPermission = useAppStore(
		(state) => state.requestShizukuPermission,
	);
	const checkWorkingModeStatus = useAppStore(
		(state) => state.checkWorkingModeStatus,
	);

	return (
		<View className="py-4">
			<Text className={`${colors.textClass} text-2xl font-black mb-2`}>
				Pilih Mode Kerja
			</Text>
			<Text className={`${colors.subTextClass} text-xs mb-6`}>
				Pilih mode eksekusi untuk KillApps.
			</Text>

			<Pressable
				onPress={() => {
					updateSetting("workingMode", "shizuku");
					setIsVerifying(true);
					checkWorkingModeStatus().finally(() => {
						setIsVerifying(false);
						const state = useAppStore.getState();
						if (state.isShizukuActive && !state.isPermissionGranted) {
							setTimeout(() => {
								useAppStore.getState().requestShizukuPermission();
							}, 400);
						}
					});
				}}
				className={`p-5 rounded-2xl mb-4 border transition-all ${
					currentMode === "shizuku"
						? isDark
							? "bg-zinc-800 border-white"
							: "bg-zinc-200 border-black"
						: `${colors.cardClass} ${colors.cardBorderClass}`
				}`}
			>
				<View className="flex-row items-center justify-between">
					<View className="flex-row items-center gap-3">
						<Terminal size={20} color={colors.iconColor} />
						<Text className={`font-bold text-base ${colors.textClass}`}>
							Mode Non-Root (Shizuku)
						</Text>
					</View>
					{currentMode === "shizuku" && (
						<Check size={20} color={colors.iconColor} />
					)}
				</View>
			</Pressable>

			<Pressable
				onPress={() => {
					updateSetting("workingMode", "root");
					setIsVerifying(true);
					checkWorkingModeStatus().finally(() => setIsVerifying(false));
				}}
				className={`p-5 rounded-2xl mb-6 border transition-all ${
					currentMode === "root"
						? isDark
							? "bg-zinc-800 border-white"
							: "bg-zinc-200 border-black"
						: `${colors.cardClass} ${colors.cardBorderClass}`
				}`}
			>
				<View className="flex-row items-center justify-between">
					<View className="flex-row items-center gap-3">
						<Zap size={20} color={colors.iconColor} />
						<Text className={`font-bold text-base ${colors.textClass}`}>
							Mode Root (Superuser)
						</Text>
					</View>
					{currentMode === "root" && (
						<Check size={20} color={colors.iconColor} />
					)}
				</View>
			</Pressable>

			<View
				className={`p-4 rounded-2xl border ${colors.cardBorderClass} ${colors.cardClass} flex-row items-center justify-between`}
			>
				<View className="flex-row items-center gap-3 flex-1">
					{isVerifying ? (
						<ActivityIndicator size="small" color={colors.iconColor} />
					) : isModeVerified ? (
						<Check size={20} color={colors.iconColor} />
					) : (
						<ShieldAlert size={20} color={colors.iconColor} />
					)}
					<View className="flex-1 mr-2">
						<Text className={`${colors.textClass} font-bold text-xs`}>
							Status: {currentMode === "root" ? "Root" : "Shizuku"}
						</Text>
						<Text className={`${colors.subTextClass} text-[11px]`}>
							{isVerifying
								? "Memeriksa status..."
								: isModeVerified
									? "Layanan aktif & siap digunakan"
									: currentMode === "root"
										? "Superuser tidak terdeteksi / ditolak"
										: isShizukuActive && !isPermissionGranted
											? "Shizuku berjalan, izin belum diberikan"
											: "Shizuku tidak aktif"}
						</Text>
					</View>
				</View>

				{!isVerifying && !isModeVerified && (
					<Pressable
						onPress={() => {
							if (
								currentMode === "shizuku" &&
								isShizukuActive &&
								!isPermissionGranted
							) {
								requestShizukuPermission();
							} else {
								startVerification(currentMode);
							}
						}}
						className={`px-3 py-1.5 rounded border ${colors.primaryBtnClass}`}
					>
						<Text
							className={`text-[10px] font-black uppercase ${colors.primaryBtnTextClass}`}
						>
							{currentMode === "shizuku" &&
							isShizukuActive &&
							!isPermissionGranted
								? "MINTA IZIN"
								: "CEK ULANG"}
						</Text>
					</Pressable>
				)}
			</View>
		</View>
	);
};
