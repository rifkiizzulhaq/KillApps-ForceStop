import {
	AlertTriangle,
	RotateCcw,
	Snowflake,
	Sparkles,
} from "lucide-react-native";
import type React from "react";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { showNativeTimePicker } from "../../services/killer";
import { useAppStore } from "../../stores/useAppStore";
import { AutoKillModal } from "../modals/AutoKillModal";
import { SettingToggleRow } from "./SettingToggleRow";

export const SettingsProSuiteTab: React.FC = () => {
	const settings = useAppStore((state) => state.settings);
	const updateSetting = useAppStore((state) => state.updateSetting);
	const resetOnboarding = useAppStore((state) => state.resetOnboarding);
	const setCurrentScreen = useAppStore((state) => state.setCurrentScreen);
	const isRootActive = useAppStore((state) => state.isRootActive);
	const isShizukuActive = useAppStore((state) => state.isShizukuActive);
	const isPermissionGranted = useAppStore((state) => state.isPermissionGranted);
	const { colors } = useTheme();

	const isModeVerified =
		settings.workingMode === "root"
			? isRootActive
			: isShizukuActive && isPermissionGranted;

	const [autoKillModal, setAutoKillModal] = useState(false);

	const handlePickBedtimeStart = async () => {
		const min = await showNativeTimePicker(settings?.bedtimeStart ?? 1380);
		if (min !== null) updateSetting("bedtimeStart", min);
	};

	const handlePickBedtimeEnd = async () => {
		const min = await showNativeTimePicker(settings?.bedtimeEnd ?? 300);
		if (min !== null) updateSetting("bedtimeEnd", min);
	};

	const fmtTime = (totalMin: number) =>
		`${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;

	return (
		<View>
			<View
				testID="unverified-disabled-wrapper-pro"
				pointerEvents={isModeVerified ? "auto" : "none"}
				style={{ opacity: isModeVerified ? 1 : 0.4 }}
			>
				<Text
					className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-4`}
				>
					7. Fitur Ekstrem
				</Text>
				<View
					className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-6 px-4 py-3 divide-y ${colors.dividerClass}`}
				>
					<View className="pb-3 mb-1">
						<View className="flex-row items-center gap-1.5 mb-1">
							<AlertTriangle size={15} color="#f59e0b" />
							<Text className={`${colors.textClass} font-black text-xs`}>
								Pahami Sebelum Mengaktifkan!
							</Text>
						</View>
						<Text className={`${colors.subTextClass} text-[11px] leading-4`}>
							Fitur di bawah ini mengintervensi sistem Android secara agresif.
							Jangan asal aktifkan jika Anda tidak membutuhkan efisiensi
							ekstrem.
						</Text>
					</View>

					<SettingToggleRow
						title="Aggressive Doze Mode"
						subtitle="Normalnya HP menunggu 30-60 menit setelah layar mati untuk tidur hemat daya. Fitur ini memaksa sistem langsung tertidur lelap detik itu juga. Contoh: Baterai tetap utuh 100% saat ditaruh di saku/tidur malam."
						value={settings?.aggressiveDoze ?? false}
						onValueChange={(v) => updateSetting("aggressiveDoze", v)}
						disabled={!isModeVerified}
					/>

					<SettingToggleRow
						title="GCM Push Wake-up Bypass"
						subtitle="Seringkali aplikasi e-commerce/medsos yang dibunuh tiba-tiba hidup lagi karena ada sinyal promo dari server Google. Fitur ini memblokir sinyal kebangkitan itu. Contoh: Shopee/IG benar-benar mati total sampai Anda klik sendiri."
						value={settings?.gcmWakeupBypass ?? true}
						onValueChange={(v) => updateSetting("gcmWakeupBypass", v)}
						disabled={!isModeVerified}
					/>

					<SettingToggleRow
						title="Deep Trim Memory"
						subtitle="Saat app dibekukan (Shallow), mengirim sinyal ke prosesnya yang masih hidup di RAM agar membuang cache internal sebesar-besarnya. Hanya efektif jika Shallow Hibernation aktif."
						value={settings?.deepTrimMemory ?? false}
						onValueChange={(v) => updateSetting("deepTrimMemory", v)}
						disabled={!isModeVerified}
					/>
					{settings?.deepTrimMemory && !settings?.shallowHibernation && (
						<View className="flex-row items-start gap-2.5 py-3 border-t border-amber-500/20">
							<AlertTriangle
								size={14}
								color="#f59e0b"
								style={{ marginTop: 1 }}
							/>
							<Text
								className={`${colors.subTextClass} text-[11px] leading-4 flex-1`}
							>
								<Text className="text-amber-500 font-bold">Tidak aktif: </Text>
								{
									"Deep Trim Memory membutuhkan Shallow Hibernation aktif. Aktifkan Shallow Hibernation di seksi Intensitas & Kebangkitan terlebih dahulu."
								}
							</Text>
						</View>
					)}

					{Platform.OS === "android" && Number(Platform.Version) >= 31 && (
						<SettingToggleRow
							title="Phantom Process Slayer"
							subtitle="Menonaktifkan pembatasan 32 phantom process bawaan Android 12+, mencegah anak proses yang tertinggal memenuhi kuota sistem."
							value={settings?.phantomSlayer ?? false}
							onValueChange={(v) => updateSetting("phantomSlayer", v)}
							disabled={!isModeVerified}
						/>
					)}
				</View>
			</View>

			<View
				testID="pro-suite-disabled-wrapper"
				pointerEvents={isModeVerified ? "auto" : "none"}
				style={{ opacity: isModeVerified ? 1 : 0.4 }}
			>
				<Text
					className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-4`}
				>
					8. KILLAPPS PRO SUITE (EKSKLUSIF)
				</Text>
				<View
					className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-4 p-4`}
				>
					<View className="flex-row items-center justify-between pb-3.5 border-b border-gray-500/20">
						<View className="flex-1 pr-4">
							<Text className={`${colors.textClass} font-bold text-sm`}>
								Deep Freeze Vault (Karantina)
							</Text>
							<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
								Bekukan aplikasi seutuhnya sampai lenyap sementara dari sistem.
								0 MB RAM & 0% Baterai.
							</Text>
						</View>
						<Pressable
							onPress={() => setCurrentScreen("quarantine")}
							className="bg-blue-600 px-3 py-1.5 rounded-xl flex-row items-center"
						>
							<Snowflake size={14} color="#fff" />
							<Text className="text-white font-bold text-xs ml-1.5">BUKA</Text>
						</Pressable>
					</View>

					<View className="flex-row items-center justify-between py-3.5 border-b border-gray-500/20">
						<View className="flex-1 pr-4">
							<Text className={`${colors.textClass} font-bold text-sm`}>
								Live Impact & Forensik
							</Text>
							<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
								Lihat statistik penghematan RAM nyata & pelacak aplikasi paling
								bandel hari ini.
							</Text>
						</View>
						<Pressable
							onPress={() => setCurrentScreen("pro_analytics")}
							className="bg-emerald-600 px-3 py-1.5 rounded-xl flex-row items-center"
						>
							<Sparkles size={14} color="#fff" />
							<Text className="text-white font-bold text-xs ml-1.5">
								DASBOR
							</Text>
						</Pressable>
					</View>

					<SettingToggleRow
						title="Bedtime Zero-Drain Shield"
						subtitle={`Saat layar mati di jam tidur (${fmtTime(settings?.bedtimeStart ?? 1380)}\u2013${fmtTime(settings?.bedtimeEnd ?? 300)}), otomatis eksekusi daftar KillApps. Jika Aggressive Doze aktif, tidur hemat daya akan langsung dimaksimalkan seketika tanpa menunggu.`}
						value={settings?.bedtimeShield ?? false}
						onValueChange={(v) => updateSetting("bedtimeShield", v)}
						disabled={!isModeVerified}
					/>

					{settings?.bedtimeShield && (
						<View className="py-3 flex-row items-center justify-between border-t border-gray-500/10">
							<View className="flex-1 pr-4">
								<Text className={`${colors.textClass} font-semibold text-sm`}>
									Jam Tidur Kustom
								</Text>
								<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
									Atur jam mulai dan berakhir sesuai jadwal tidur Anda.
								</Text>
							</View>
							<View className="flex-row items-center gap-2">
								<Pressable
									onPress={handlePickBedtimeStart}
									className={`px-3 py-1.5 rounded-xl ${colors.secondaryBtnClass} border ${colors.borderClass} active:opacity-70`}
								>
									<Text className={`${colors.textClass} font-bold text-xs`}>
										{fmtTime(settings?.bedtimeStart ?? 1380)}
									</Text>
								</Pressable>
								<Text className={`${colors.subTextClass} text-xs`}>→</Text>
								<Pressable
									onPress={handlePickBedtimeEnd}
									className={`px-3 py-1.5 rounded-xl ${colors.secondaryBtnClass} border ${colors.borderClass} active:opacity-70`}
								>
									<Text className={`${colors.textClass} font-bold text-xs`}>
										{fmtTime(settings?.bedtimeEnd ?? 300)}
									</Text>
								</Pressable>
							</View>
						</View>
					)}

					<SettingToggleRow
						title="Emergency Smart Triggers"
						subtitle="Otomatis mengeksekusi pembantaian massal saat baterai kritis (< 20%) atau suhu HP melampaui batas panas (> 40°C)."
						value={settings?.emergencyTrigger ?? false}
						onValueChange={(v) => updateSetting("emergencyTrigger", v)}
						disabled={!isModeVerified}
					/>

					<SettingToggleRow
						title="RAM Crunch Auto-Slayer"
						subtitle="Otomatis mengeksekusi pembersihan latar belakang secara real-time saat memori RAM sisa di HP anjlok di bawah 15%."
						value={settings?.ramCrunchSlayer ?? false}
						onValueChange={(v) => updateSetting("ramCrunchSlayer", v)}
						disabled={!isModeVerified}
					/>

					<Pressable
						onPress={() => setAutoKillModal(true)}
						className="py-3 flex-row items-center justify-between active:opacity-70"
					>
						<View className="flex-1 pr-4">
							<Text className={`${colors.textClass} font-bold text-sm`}>
								Auto-Kill Scheduler
							</Text>
							<Text
								className={`${colors.subTextClass} text-[11px] mt-0.5 leading-4`}
							>
								Menjadwalkan eksekusi pembersihan otomatis secara berkala di
								latar belakang tanpa membuka aplikasi.
							</Text>
						</View>
						<View className="flex-row items-center">
							<Text className="text-blue-500 font-bold text-xs mr-2">
								{settings?.autoKillScheduler === 1
									? "1 Jam"
									: settings?.autoKillScheduler === 2
										? "2 Jam"
										: settings?.autoKillScheduler === 4
											? "4 Jam"
											: settings?.autoKillScheduler === 8
												? "8 Jam"
												: "Nonaktif"}
							</Text>
						</View>
					</Pressable>
				</View>
			</View>

			<Text
				className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-4`}
			>
				9. Sistem & Reset
			</Text>
			<View
				className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-6 p-2`}
			>
				<Pressable
					onPress={resetOnboarding}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className="text-rose-500 font-bold text-sm">Reset Total</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Mereset seluruh pengaturan, daftar aplikasi, dan membuka kembali
							layar sambutan awal dari nol.
						</Text>
					</View>
					<RotateCcw size={20} color="#f43f5e" />
				</Pressable>
			</View>

			<AutoKillModal
				visible={autoKillModal}
				onClose={() => setAutoKillModal(false)}
			/>
		</View>
	);
};
