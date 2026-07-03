import {
	AlertTriangle,
	ArrowRight,
	RotateCcw,
	Snowflake,
	Sparkles,
} from "lucide-react-native";
import type React from "react";
import { useState } from "react";
import {
	PermissionsAndroid,
	Platform,
	Pressable,
	Text,
	View,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import {
	checkBatteryOptimization,
	requestBatteryOptimization,
	showNativeTimePicker,
} from "../../services/killerService";
import { useAppStore } from "../../stores/useAppStore";
import { InfoModal } from "../modals/InfoModal";
import { SelectionModal } from "../modals/SelectionModal";
import { SettingToggleRow } from "./SettingToggleRow";

export const SettingsMainTab: React.FC = () => {
	const settings = useAppStore((state) => state.settings);
	const updateSetting = useAppStore((state) => state.updateSetting);
	const resetOnboarding = useAppStore((state) => state.resetOnboarding);
	const setCurrentScreen = useAppStore((state) => state.setCurrentScreen);
	const isRootActive = useAppStore((state) => state.isRootActive);
	const isShizukuActive = useAppStore((state) => state.isShizukuActive);
	const isPermissionGranted = useAppStore((state) => state.isPermissionGranted);
	const { colors, isDark } = useTheme();

	const isModeVerified =
		settings.workingMode === "root"
			? isRootActive
			: isShizukuActive && isPermissionGranted;

	const [workingModeModal, setWorkingModeModal] = useState(false);
	const [rootInfoModal, setRootInfoModal] = useState(false);
	const [batteryModal, setBatteryModal] = useState(false);
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

	const handleQuickNotifChange = async (v: boolean) => {
		if (v && Platform.OS === "android" && Number(Platform.Version) >= 33) {
			try {
				await PermissionsAndroid.request(
					PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
				);
			} catch {}
		}
		updateSetting("quickActionNotif", v);
	};

	const handleWorkingModePress = () => {
		setWorkingModeModal(true);
	};

	return (
		<View className="pb-12">
			<Text
				className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-4`}
			>
				1. Tampilan & Tema
			</Text>
			<View
				className={`${colors.cardClass} border ${colors.cardBorderClass} p-4 rounded-2xl mb-5`}
			>
				<Text className={`${colors.textClass} font-bold text-base`}>
					Tema Aplikasi
				</Text>
				<Text className={`${colors.subTextClass} text-xs mt-0.5 mb-3.5`}>
					Pilih mode warna antarmuka terang, gelap, atau ikuti sistem
				</Text>
				<View className="flex-row gap-2.5">
					{[
						{ id: "system", label: "Sistem" },
						{ id: "dark", label: "Gelap" },
						{ id: "light", label: "Terang" },
					].map((item) => {
						const isSelected =
							settings?.themeMode === item.id ||
							(!settings?.themeMode && item.id === "system");
						return (
							<Pressable
								testID={`btn-theme-${item.id}`}
								key={item.id}
								onPress={() => {
									updateSetting(
										"themeMode",
										item.id as "system" | "light" | "dark",
									);
								}}
								android_ripple={{
									color: isDark ? "#3f3f46" : "#e4e4e7",
									borderless: false,
								}}
								className={`flex-1 py-3 rounded-xl items-center justify-center border ${
									isSelected
										? `${colors.primaryBtnClass} ${isDark ? "border-white" : "border-black"}`
										: `${colors.inputBgClass} ${colors.borderClass} active:opacity-70`
								}`}
							>
								<Text
									className={`font-black text-xs ${
										isSelected
											? colors.primaryBtnTextClass
											: colors.subTextClass
									}`}
								>
									{item.label}
								</Text>
							</Pressable>
						);
					})}
				</View>
			</View>

			<View
				className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-5 px-4`}
			>
				<SettingToggleRow
					title="Gulir Mulus (Smooth Scroll)"
					subtitle="Animasi gulir daftar aplikasi yang lebih halus dan responsif saat di-scroll."
					value={settings?.smoothScroll ?? true}
					onValueChange={(v) => updateSetting("smoothScroll", v)}
				/>
			</View>

			<Text
				className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2`}
			>
				2. Mode Eksekusi
			</Text>
			<Pressable
				testID="btn-working-mode"
				onPress={handleWorkingModePress}
				className={`${colors.cardClass} border ${colors.cardBorderClass} p-4 rounded-2xl mb-3 flex-row items-center justify-between active:opacity-70`}
			>
				<View className="flex-1 pr-3">
					<Text className={`${colors.textClass} font-bold text-base`}>
						Mode Bekerja
					</Text>
					<Text className={`${colors.subTextClass} text-xs mt-0.5`}>
						{settings?.workingMode === "root"
							? "Root (Akses Superuser Penuh)"
							: "Shizuku (Akses Tanpa Root via ADB)"}
					</Text>
				</View>
				<View
					className={`${colors.secondaryBtnClass} px-3 py-1 rounded-full border ${colors.borderClass}`}
				>
					<Text
						className={`${colors.secondaryBtnTextClass} font-bold text-xs uppercase`}
					>
						Ubah
					</Text>
				</View>
			</Pressable>

			<View
				testID="unverified-disabled-wrapper"
				pointerEvents={isModeVerified ? "auto" : "none"}
				style={{ opacity: isModeVerified ? 1 : 0.4 }}
			>
				<Text
					className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-4`}
				>
					3. Cerdas & Deteksi Lanjutan
				</Text>
				<View
					className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-3 px-4 py-1 divide-y ${colors.dividerClass}`}
				>
					<SettingToggleRow
						title="Smart KillApps"
						subtitle="Analisis pintar untuk menunda eksekusi saat aplikasi sedang melakukan tugas penting."
						value={settings?.smartHibernation ?? true}
						onValueChange={(v) => updateSetting("smartHibernation", v)}
					/>
					<SettingToggleRow
						title="Finer Detection (Media Playback)"
						subtitle="Mencegah pemotongan pemutaran musik atau video yang berjalan di latar belakang."
						value={settings?.finerMediaDetection ?? false}
						onValueChange={(v) => updateSetting("finerMediaDetection", v)}
					/>
				</View>

				<Text
					className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-4`}
				>
					4. Intensitas & Kebangkitan
				</Text>
				<View
					className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-3 px-4 py-1 divide-y ${colors.dividerClass}`}
				>
					<SettingToggleRow
						title="KillApps Dangkal (Shallow)"
						subtitle="Bekukan app tanpa force-stop total (Android 9+). GCM wake-up tetap diblokir agar app tidak bisa bangkit sendiri."
						value={settings?.shallowHibernation ?? false}
						onValueChange={(v) => updateSetting("shallowHibernation", v)}
					/>
					<SettingToggleRow
						title="Wake-up Tracking and Cut-off"
						subtitle="Blokir wakelock dan background activity setelah kill, agar aplikasi tidak bisa terbangun kembali sendiri."
						value={settings?.wakeUpTracking ?? true}
						onValueChange={(v) => updateSetting("wakeUpTracking", v)}
					/>
				</View>

				<Text
					className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-4`}
				>
					5. Otomatisasi & Pengecualian
				</Text>
				<View
					className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-3 px-4 py-1 divide-y ${colors.dividerClass}`}
				>
					<SettingToggleRow
						title="Otomatis KillApps"
						subtitle="Eksekusi penghentian aplikasi latar belakang otomatis setelah layar ponsel dimatikan."
						value={settings?.autoHibernation ?? false}
						onValueChange={(v) => updateSetting("autoHibernation", v)}
					/>
					<SettingToggleRow
						title="Always Ignore Background-free"
						subtitle="Lewati aplikasi yang sudah bersih dan tidak memiliki layanan latar belakang aktif."
						value={settings?.ignoreBackgroundFree ?? false}
						onValueChange={(v) => updateSetting("ignoreBackgroundFree", v)}
					/>
					<SettingToggleRow
						title="Sertakan Aplikasi Sistem"
						subtitle="Tampilkan aplikasi sistem non-kritis di daftar agar bisa ditambahkan. App sistem kritis (SystemUI, GMS, dll) tetap diproteksi otomatis."
						value={settings?.hibernateSystemApps ?? false}
						onValueChange={(v) => updateSetting("hibernateSystemApps", v)}
					/>
					<Pressable
						testID="battery-optimization-button"
						onPress={async () => {
							const ignored = await checkBatteryOptimization();
							if (ignored) {
								setBatteryModal(true);
							} else {
								await requestBatteryOptimization();
							}
						}}
						className="py-3 flex-row items-center justify-between active:opacity-70"
					>
						<View className="flex-1 pr-4">
							<Text className={`${colors.textClass} font-semibold text-sm`}>
								Abaikan Optimasi Baterai
							</Text>
							<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
								Izinkan aplikasi berjalan tanpa batasan baterai untuk fitur
								otomatisasi saat layar mati.
							</Text>
						</View>
						<ArrowRight size={18} color={colors.subIconColor} />
					</Pressable>
				</View>

				<Text
					className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-4`}
				>
					6. Pintasan & Notifikasi
				</Text>
				<View
					className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-6 px-4 py-1 divide-y ${colors.dividerClass}`}
				>
					<SettingToggleRow
						title="Quick Action Notification"
						subtitle="Tampilkan pintasan eksekusi cepat 1-ketuk pada panel notifikasi atas."
						value={settings?.quickActionNotif ?? false}
						onValueChange={handleQuickNotifChange}
					/>

					<SettingToggleRow
						title="Don&apos;t Remove Notification"
						subtitle="Bekukan app agar notifikasi masuk tetap tampil. GCM wake-up tidak diblokir supaya push notification dari server tetap diterima."
						value={settings?.dontRemoveNotif ?? false}
						onValueChange={(v) => updateSetting("dontRemoveNotif", v)}
					/>
					{settings?.dontRemoveNotif && settings?.wakeUpTracking && (
						<View className="flex-row items-start gap-2.5 py-3 border-t border-amber-500/20">
							<AlertTriangle
								size={14}
								color="#f59e0b"
								style={{ marginTop: 1 }}
							/>
							<Text
								className={`${colors.subTextClass} text-[11px] leading-4 flex-1`}
							>
								<Text className="text-amber-500 font-bold">Perhatian: </Text>
								{
									"Don't Remove Notification & Wake-up Tracking aktif bersamaan. Push notif mungkin masih bisa masuk via GCM, tapi semua aktivitas background lainnya tetap diblokir oleh Wake-up Tracking."
								}
							</Text>
						</View>
					)}
				</View>

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
					/>

					<SettingToggleRow
						title="GCM Push Wake-up Bypass"
						subtitle="Seringkali aplikasi e-commerce/medsos yang dibunuh tiba-tiba hidup lagi karena ada sinyal promo dari server Google. Fitur ini memblokir sinyal kebangkitan itu. Contoh: Shopee/IG benar-benar mati total sampai Anda klik sendiri."
						value={settings?.gcmWakeupBypass ?? true}
						onValueChange={(v) => updateSetting("gcmWakeupBypass", v)}
					/>

					<SettingToggleRow
						title="Deep Trim Memory"
						subtitle="Setelah aplikasi dimatikan, sisa cache sampah masih tertahan di RAM. Fitur ini menyapu bersih sisa memori sampai akar. Contoh: RAM kosong melonjak lega & HP langsung terasa jauh lebih cepat (anti-lemot)."
						value={settings?.deepTrimMemory ?? false}
						onValueChange={(v) => updateSetting("deepTrimMemory", v)}
					/>

					<SettingToggleRow
						title="Phantom Process Slayer"
						subtitle="Menonaktifkan pembatasan 32 phantom process bawaan Android 12+, mencegah anak proses yang tertinggal memenuhi kuota sistem."
						value={settings?.phantomSlayer ?? false}
						onValueChange={(v) => updateSetting("phantomSlayer", v)}
					/>
				</View>
			</View>

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
							Bekukan aplikasi seutuhnya sampai lenyap sementara dari sistem. 0
							MB RAM & 0% Baterai.
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
						<Text className="text-white font-bold text-xs ml-1.5">DASBOR</Text>
					</Pressable>
				</View>

				<SettingToggleRow
					title="Bedtime Zero-Drain Shield"
					subtitle={`Saat layar mati di jam tidur (${fmtTime(settings?.bedtimeStart ?? 1380)}\u2013${fmtTime(settings?.bedtimeEnd ?? 300)}), otomatis eksekusi daftar KillApps. Jika Aggressive Doze aktif, tidur hemat daya akan langsung dimaksimalkan seketika tanpa menunggu.`}
					value={settings?.bedtimeShield ?? false}
					onValueChange={(v) => updateSetting("bedtimeShield", v)}
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
				/>

				<SettingToggleRow
					title="RAM Crunch Auto-Slayer"
					subtitle="Otomatis mengeksekusi pembersihan latar belakang secara real-time saat memori RAM sisa di HP anjlok di bawah 15%."
					value={settings?.ramCrunchSlayer ?? false}
					onValueChange={(v) => updateSetting("ramCrunchSlayer", v)}
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
							Menjadwalkan eksekusi pembersihan otomatis secara berkala di latar
							belakang tanpa membuka aplikasi.
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

			<SelectionModal
				visible={workingModeModal}
				title="Pilih Mode Bekerja"
				subtitle="Tentukan metode eksekusi untuk mematikan aplikasi di latar belakang:"
				options={[
					{
						id: "shizuku",
						label: "Shizuku",
						badgeType: "emerald",
						description:
							"Akses nirkabel berkecepatan tinggi via ADB tanpa perlu root. Sangat stabil dan aman.",
					},
					{
						id: "root",
						label: "Root Akses",
						badgeType: "amber",
						description:
							"Eksekusi langsung ke kernel sistem daya tinggi. Membutuhkan perizinan Magisk atau KernelSU.",
					},
				]}
				selectedId={settings?.workingMode}
				onSelect={(id) => {
					updateSetting("workingMode", id as "shizuku" | "root");
					if (id === "root") {
						setTimeout(() => setRootInfoModal(true), 300);
					}
				}}
				onClose={() => setWorkingModeModal(false)}
			/>

			<InfoModal
				visible={rootInfoModal}
				title="Informasi Mode Root"
				content="Pastikan perangkat Anda sudah di-root menggunakan Magisk atau KernelSU. Berikan izin Superuser (Grant) saat diminta oleh pop-up sistem agar fitur eksekusi cepat ini bekerja optimal tanpa hambatan."
				onClose={() => setRootInfoModal(false)}
			/>

			<InfoModal
				visible={batteryModal}
				title="Sudah Diizinkan"
				content="Aplikasi KillApps saat ini sudah diizinkan oleh sistem Android berjalan tanpa batasan baterai."
				onClose={() => setBatteryModal(false)}
			/>

			<SelectionModal
				visible={autoKillModal}
				title="Auto-Kill Scheduler"
				subtitle="Pilih interval waktu pembersihan latar belakang otomatis:"
				options={[
					{
						id: "0",
						label: "Nonaktif (Matikan)",
						badgeType: "default",
						description: "Tidak melakukan pembersihan berkala.",
					},
					{
						id: "1",
						label: "Setiap 1 Jam",
						badgeType: "cyan",
						description:
							"Membersihkan latar belakang secara otomatis setiap 1 jam sekali.",
					},
					{
						id: "2",
						label: "Setiap 2 Jam",
						badgeType: "cyan",
						description:
							"Membersihkan latar belakang secara otomatis setiap 2 jam sekali.",
					},
					{
						id: "4",
						label: "Setiap 4 Jam",
						badgeType: "emerald",
						description:
							"Membersihkan latar belakang secara otomatis setiap 4 jam sekali (Sangat Disarankan).",
					},
					{
						id: "8",
						label: "Setiap 8 Jam",
						badgeType: "cyan",
						description:
							"Membersihkan latar belakang secara otomatis setiap 8 jam sekali.",
					},
				]}
				selectedId={String(settings?.autoKillScheduler || 0)}
				onSelect={(id) => {
					updateSetting("autoKillScheduler", Number(id));
				}}
				onClose={() => setAutoKillModal(false)}
			/>
		</View>
	);
};
