import type React from "react";
import {
	PermissionsAndroid,
	Platform,
	Pressable,
	Text,
	View,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";

interface Props {
	sdkLevel: number;
	getAndroidVersionName: (api: number) => string;
	notifGranted: boolean;
	checkSystemPermissions: () => void;
}

export const PermissionsSlide: React.FC<Props> = ({
	sdkLevel,
	getAndroidVersionName,
	notifGranted,
	checkSystemPermissions,
}) => {
	const { colors, isDark } = useTheme();
	let permCounter = 1;

	return (
		<View className="py-4">
			<Text className={`${colors.textClass} text-2xl font-black mb-1`}>
				Perizinan Android
			</Text>
			<Text className={`${colors.subTextClass} text-xs font-semibold mb-6`}>
				Terdeteksi: {getAndroidVersionName(sdkLevel)}
			</Text>

			<View className="gap-3">
				<View
					className={`${colors.cardClass} border ${colors.cardBorderClass} p-4 rounded-2xl flex-row items-center justify-between`}
				>
					<Text className={`${colors.textClass} font-bold text-sm flex-1 mr-2`}>
						{permCounter++}. Akses Daftar Semua Aplikasi
					</Text>
					<View
						className={`px-2.5 py-1 rounded border ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-200 border-zinc-300"}`}
					>
						<Text
							className={`text-[10px] font-black uppercase ${colors.textClass}`}
						>
							OTOMATIS AKTIF
						</Text>
					</View>
				</View>

				<View
					className={`${colors.cardClass} border ${colors.cardBorderClass} p-4 rounded-2xl flex-row items-center justify-between`}
				>
					<Text className={`${colors.textClass} font-bold text-sm flex-1 mr-2`}>
						{permCounter++}. Izin Notifikasi Sistem
					</Text>
					{sdkLevel >= 33 ? (
						<Pressable
							onPress={async () => {
								if (Platform.OS === "android") {
									await PermissionsAndroid.request(
										"android.permission.POST_NOTIFICATIONS",
									);
									checkSystemPermissions();
								}
							}}
							className={`px-3 py-1.5 rounded border ${notifGranted ? (isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-200 border-zinc-300") : colors.primaryBtnClass}`}
						>
							<Text
								className={`text-[10px] font-black uppercase ${notifGranted ? colors.textClass : colors.primaryBtnTextClass}`}
							>
								{notifGranted ? "DIZINKAN" : "MINTA IZIN"}
							</Text>
						</Pressable>
					) : (
						<View
							className={`px-2.5 py-1 rounded border ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-200 border-zinc-300"}`}
						>
							<Text
								className={`text-[10px] font-black uppercase ${colors.textClass}`}
							>
								OTOMATIS AKTIF
							</Text>
						</View>
					)}
				</View>
			</View>
		</View>
	);
};
