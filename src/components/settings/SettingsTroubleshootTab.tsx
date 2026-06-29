import { Info, Rocket, Settings, Wrench, Zap } from "lucide-react-native";
import type React from "react";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { InfoModal } from "../modals/InfoModal";

export const SettingsTroubleshootTab: React.FC = () => {
	const { colors } = useTheme();
	const [infoModal, setInfoModal] = useState<{
		visible: boolean;
		title: string;
		content: string;
	}>({
		visible: false,
		title: "",
		content: "",
	});

	const showTroubleGuide = (title: string, content: string) => {
		setInfoModal({ visible: true, title, content });
	};

	return (
		<View className="pb-12">
			<Text
				className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-4`}
			>
				10. Troubleshooting (Pusat Bantuan)
			</Text>
			<View
				className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-4 p-2 divide-y ${colors.dividerClass}`}
			>
				<Pressable
					onPress={() =>
						showTroubleGuide(
							"1. Aplikasi tidak mati otomatis (Auto KillApps)",
							"Jika aplikasi tidak otomatis mati:\n\n• Wake-up Tracker: Aktifkan fitur ini di tab utama untuk mendeteksi aplikasi mana yang membangunkan proses.\n• Quick Action Notification: Gunakan pintasan di panel notifikasi untuk mematikan secara instan.",
						)
					}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							1. Aplikasi tidak mati otomatis
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Berisi Wake-up tracker dan solusi Quick action notification.
						</Text>
					</View>
					<Info size={18} color={colors.subIconColor} />
				</Pressable>

				<Pressable
					onPress={() =>
						showTroubleGuide(
							"2. Diagnosa Auto KillApps",
							"Pastikan izin Shizuku tidak dicabut oleh sistem manajemen baterai agresif (seperti MIUI / ColorOS / FuntouchOS). Kunci aplikasi KillApps di recent apps agar tidak terbunuh.",
						)
					}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							2. Diagnosa Auto KillApps
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Diagnosa kendala penghentian otomatis di latar belakang.
						</Text>
					</View>
					<Wrench size={18} color={colors.subIconColor} />
				</Pressable>

				<Pressable
					onPress={() =>
						showTroubleGuide(
							"3. Accessibility Service",
							'Jika mode Shizuku tidak tersedia, layanan Aksesibilitas dapat digunakan sebagai alternatif untuk menekan tombol "Force Stop" secara otomatis di pengaturan Android.',
						)
					}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							3. Accessibility Service
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Pengaturan layanan bantuan otomatisasi tanpa Shizuku.
						</Text>
					</View>
					<Settings size={18} color={colors.subIconColor} />
				</Pressable>
			</View>

			<Text
				className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-4`}
			>
				12. Eksklusif & Lanjutan
			</Text>
			<View
				className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-6 p-2`}
			>
				<Pressable
					onPress={() =>
						showTroubleGuide(
							"Extras for Geek",
							"Selamat datang di zona Geek!\n\n• Aggressive Doze: Memaksa Android langsung masuk ke mode Doze mendalam.\n• GCM Push Wake-up Bypass: Mengabaikan kebangkitan paksa oleh Google Cloud Messaging.\n• Deep Trim Memory: Membersihkan cache RAM setelah proses KillApps.",
						)
					}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<View className="flex-row items-center gap-2">
							<View className="flex-row items-center gap-1.5">
								<Zap
									size={15}
									color={colors.iconColor}
									fill={colors.iconColor}
								/>
								<Text className={`${colors.textClass} font-black text-sm`}>
									Extras for Geek
								</Text>
							</View>
							<View
								className={`${colors.secondaryBtnClass} px-2 py-0.5 rounded border ${colors.borderClass}`}
							>
								<Text
									className={`text-[9px] font-black ${colors.secondaryBtnTextClass} uppercase`}
								>
									PRO
								</Text>
							</View>
						</View>
						<Text className={`${colors.subTextClass} text-[11px] mt-1`}>
							Kumpulan fitur eksperimental tingkat lanjut untuk pengguna mahir
							dan developer.
						</Text>
					</View>
					<Rocket size={20} color={colors.iconColor} />
				</Pressable>
			</View>

			<InfoModal
				visible={infoModal.visible}
				title={infoModal.title}
				content={infoModal.content}
				onClose={() => setInfoModal((prev) => ({ ...prev, visible: false }))}
			/>
		</View>
	);
};
