import { AlertTriangle, ArrowRight, RotateCcw } from "lucide-react-native";
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
} from "../../services/killerService";
import { useAppStore } from "../../stores/useAppStore";
import { InfoModal } from "../modals/InfoModal";
import { SelectionModal } from "../modals/SelectionModal";
import { SettingToggleRow } from "./SettingToggleRow";

export const SettingsMainTab: React.FC = () => {
	const settings = useAppStore((state) => state.settings);
	const updateSetting = useAppStore((state) => state.updateSetting);
	const resetOnboarding = useAppStore((state) => state.resetOnboarding);
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
						subtitle="Membekukan aktivitas sementara tanpa mematikan total proses aplikasi (Android 9+)."
						value={settings?.shallowHibernation ?? false}
						onValueChange={(v) => updateSetting("shallowHibernation", v)}
					/>
					<SettingToggleRow
						title="Wake-up Tracking and Cut-off"
						subtitle="Lacak aplikasi yang sering terbangun sendiri dan potong rantai pemicunya."
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
						subtitle="Tampilkan dan izinkan penambahan aplikasi sistem inti ke dalam daftar KillApps."
						value={settings?.hibernateSystemApps ?? false}
						onValueChange={(v) => updateSetting("hibernateSystemApps", v)}
					/>
					<Pressable
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
						subtitle="Jaga agar kartu notifikasi penting tidak ikut terhapus saat mematikan aplikasi."
						value={settings?.dontRemoveNotif ?? false}
						onValueChange={(v) => updateSetting("dontRemoveNotif", v)}
					/>
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
				</View>
			</View>

			<Text
				className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-4`}
			>
				8. Sistem & Reset
			</Text>
			<View
				className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-6 p-2`}
			>
				<Pressable
					onPress={resetOnboarding}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className="text-rose-500 font-bold text-sm">
							Reset Total
						</Text>
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
		</View>
	);
};
