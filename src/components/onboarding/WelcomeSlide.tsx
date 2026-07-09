import { Settings, Shield, Zap } from "lucide-react-native";
import type React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export const WelcomeSlide: React.FC = () => {
	const { colors, isDark } = useTheme();

	return (
		<View className="py-4">
			<View
				className={`w-16 h-16 rounded-2xl ${colors.cardClass} border ${colors.cardBorderClass} items-center justify-center mb-5`}
			>
				<Zap size={32} color={colors.iconColor} />
			</View>
			<Text className={`${colors.textClass} text-2xl font-black mb-1.5`}>
				Selamat Datang di KillApps
			</Text>
			<Text className={`${colors.subTextClass} text-xs leading-relaxed mb-6`}>
				Aplikasi pembersih latar belakang tingkat lanjut untuk menjaga ponsel
				Anda tetap cepat, hemat baterai, dan bebas lemot.
			</Text>
			<View className="w-full gap-3.5">
				<View
					className={`${colors.cardClass} border ${colors.cardBorderClass} p-4 rounded-2xl flex-row items-start gap-3.5`}
				>
					<View
						className={`p-2.5 rounded-xl ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}
					>
						<Settings size={20} color={colors.iconColor} />
					</View>
					<View className="flex-1">
						<Text className={`${colors.textClass} font-bold text-sm mb-1`}>
							Penghentian Aplikasi Latar Belakang
						</Text>
						<Text
							className={`${colors.subTextClass} text-[11px] leading-relaxed`}
						>
							Menutup paksa atau membekukan aplikasi yang diam-diam berjalan di
							latar belakang hanya dengan 1 ketukan tanpa membuat ponsel lag.
						</Text>
					</View>
				</View>
				<View
					className={`${colors.cardClass} border ${colors.cardBorderClass} p-4 rounded-2xl flex-row items-start gap-3.5`}
				>
					<View
						className={`p-2.5 rounded-xl ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}
					>
						<Shield size={20} color={colors.iconColor} />
					</View>
					<View className="flex-1">
						<Text className={`${colors.textClass} font-bold text-sm mb-1`}>
							Penghematan RAM & Baterai Maksimal
						</Text>
						<Text
							className={`${colors.subTextClass} text-[11px] leading-relaxed`}
						>
							Menyapu bersih sisa memori cache dan memotong sinyal pemicu
							kebangkitan aplikasi, sehingga baterai awet dan RAM melonjak lega.
						</Text>
					</View>
				</View>
				<View
					className={`${colors.cardClass} border ${colors.cardBorderClass} p-4 rounded-2xl flex-row items-start gap-3.5`}
				>
					<View
						className={`p-2.5 rounded-xl ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}
					>
						<Zap size={20} color={colors.iconColor} />
					</View>
					<View className="flex-1">
						<Text className={`${colors.textClass} font-bold text-sm mb-1`}>
							Otomatisasi & Perlindungan Pintar
						</Text>
						<Text
							className={`${colors.subTextClass} text-[11px] leading-relaxed`}
						>
							Membersihkan otomatis saat layar ponsel dimatikan serta melindungi
							pemutaran musik dan navigasi GPS agar tidak terganggu.
						</Text>
					</View>
				</View>
			</View>
		</View>
	);
};
