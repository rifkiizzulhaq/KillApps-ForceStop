import { ArrowRight } from "lucide-react-native";
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
} from "../../services/killer";
import { useAppStore } from "../../stores/useAppStore";
import { BatteryOptimizationModal } from "../modals/BatteryOptimizationModal";
import { WorkingModeModal } from "../modals/WorkingModeModal";
import { SettingToggleRow } from "./SettingToggleRow";

export const SettingsBasicTab: React.FC = () => {
	const settings = useAppStore((state) => state.settings);
	const updateSetting = useAppStore((state) => state.updateSetting);
	const isRootActive = useAppStore((state) => state.isRootActive);
	const isShizukuActive = useAppStore((state) => state.isShizukuActive);
	const isPermissionGranted = useAppStore((state) => state.isPermissionGranted);
	const { colors, isDark } = useTheme();

	const isModeVerified =
		settings.workingMode === "root"
			? isRootActive
			: isShizukuActive && isPermissionGranted;

	const [workingModeModal, setWorkingModeModal] = useState(false);
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

	return (
		<View>
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
				onPress={() => setWorkingModeModal(true)}
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
						disabled={!isModeVerified}
					/>
					<SettingToggleRow
						title="Finer Detection (Media Playback)"
						subtitle="Mencegah pemotongan pemutaran musik atau video yang berjalan di latar belakang."
						value={settings?.finerMediaDetection ?? false}
						onValueChange={(v) => updateSetting("finerMediaDetection", v)}
						disabled={!isModeVerified}
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
						disabled={!isModeVerified}
					/>
					<SettingToggleRow
						title="Wake-up Tracking and Cut-off"
						subtitle="Blokir wakelock dan background activity setelah kill, agar aplikasi tidak bisa terbangun kembali sendiri."
						value={settings?.wakeUpTracking ?? true}
						onValueChange={(v) => updateSetting("wakeUpTracking", v)}
						disabled={!isModeVerified}
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
						disabled={!isModeVerified}
					/>
					<SettingToggleRow
						title="Always Ignore Background-free"
						subtitle="Lewati aplikasi yang sudah bersih dan tidak memiliki layanan latar belakang aktif."
						value={settings?.ignoreBackgroundFree ?? false}
						onValueChange={(v) => updateSetting("ignoreBackgroundFree", v)}
						disabled={!isModeVerified}
					/>
					<SettingToggleRow
						title="Sertakan Aplikasi Sistem"
						subtitle="Tampilkan aplikasi sistem non-kritis di daftar agar bisa ditambahkan. App sistem kritis (SystemUI, GMS, dll) tetap diproteksi otomatis."
						value={settings?.hibernateSystemApps ?? false}
						onValueChange={(v) => updateSetting("hibernateSystemApps", v)}
						disabled={!isModeVerified}
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
						disabled={!isModeVerified}
					/>

					<SettingToggleRow
						title="Don&apos;t Remove Notification"
						subtitle="Bekukan app agar notifikasi masuk tetap tampil. GCM wake-up tidak diblokir supaya push notification dari server tetap diterima."
						value={settings?.dontRemoveNotif ?? false}
						onValueChange={(v) => updateSetting("dontRemoveNotif", v)}
						disabled={!isModeVerified}
					/>
					{settings?.dontRemoveNotif && settings?.wakeUpTracking && (
						<View className="flex-row items-start gap-2.5 py-3 border-t border-amber-500/20">
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
			</View>

			<WorkingModeModal
				visible={workingModeModal}
				onClose={() => setWorkingModeModal(false)}
			/>

			<BatteryOptimizationModal
				visible={batteryModal}
				onClose={() => setBatteryModal(false)}
			/>
		</View>
	);
};
