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
import { useTheme } from "../hooks/useTheme";
import { useAppStore } from "../stores/useAppStore";
import { InfoModal } from "./InfoModal";
import { ModernToggle } from "./ModernToggle";
import { SelectionModal } from "./SelectionModal";

export const SettingsMainTab: React.FC = () => {
	const settings = useAppStore((state) => state.settings);
	const updateSetting = useAppStore((state) => state.updateSetting);
	const { colors, isDark } = useTheme();

	const [workingModeModal, setWorkingModeModal] = useState(false);
	const [navBarModal, setNavBarModal] = useState(false);
	const [rootInfoModal, setRootInfoModal] = useState(false);

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

	const handleLongPressNavBar = () => {
		setNavBarModal(true);
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
				className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-5 px-4 py-3 flex-row items-center justify-between`}
			>
				<View className="flex-1 pr-4">
					<Text className={`${colors.textClass} font-bold text-sm`}>
						Gulir Mulus (Smooth Scroll)
					</Text>
					<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
						Animasi gulir daftar aplikasi yang lebih halus dan responsif saat
						di-scroll.
					</Text>
				</View>
				<ModernToggle
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

			<Text
				className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-4`}
			>
				3. Cerdas & Deteksi Lanjutan
			</Text>
			<View
				className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-3 px-4 py-1 divide-y ${colors.dividerClass}`}
			>
				<View className="py-3 flex-row items-center justify-between">
					<View className="flex-1 pr-4">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Smart KillApps
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Analisis pintar untuk menunda eksekusi saat aplikasi sedang
							melakukan tugas penting.
						</Text>
					</View>
					<ModernToggle
						value={settings?.smartHibernation ?? true}
						onValueChange={(v) => updateSetting("smartHibernation", v)}
					/>
				</View>

				<View className="py-3 flex-row items-center justify-between">
					<View className="flex-1 pr-4">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Finer Detection (Media Playback)
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Mencegah pemotongan pemutaran musik atau video yang berjalan di
							latar belakang.
						</Text>
					</View>
					<ModernToggle
						value={settings?.finerMediaDetection ?? false}
						onValueChange={(v) => updateSetting("finerMediaDetection", v)}
					/>
				</View>
			</View>

			<Text
				className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-4`}
			>
				4. Intensitas & Kebangkitan
			</Text>
			<View
				className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-3 px-4 py-1 divide-y ${colors.dividerClass}`}
			>
				<View className="py-3 flex-row items-center justify-between">
					<View className="flex-1 pr-4">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							KillApps Dangkal (Shallow)
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Membekukan aktivitas sementara tanpa mematikan total proses
							aplikasi (Android 9+).
						</Text>
					</View>
					<ModernToggle
						value={settings?.shallowHibernation ?? false}
						onValueChange={(v) => updateSetting("shallowHibernation", v)}
					/>
				</View>

				<View className="py-3 flex-row items-center justify-between">
					<View className="flex-1 pr-4">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Wake-up Tracking and Cut-off
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Lacak aplikasi yang sering terbangun sendiri dan potong rantai
							pemicunya.
						</Text>
					</View>
					<ModernToggle
						value={settings?.wakeUpTracking ?? true}
						onValueChange={(v) => updateSetting("wakeUpTracking", v)}
					/>
				</View>
			</View>

			<Text
				className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-4`}
			>
				5. Otomatisasi & Pengecualian
			</Text>
			<View
				className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-3 px-4 py-1 divide-y ${colors.dividerClass}`}
			>
				<View className="py-3 flex-row items-center justify-between">
					<View className="flex-1 pr-4">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Otomatis KillApps
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Eksekusi penghentian aplikasi latar belakang otomatis setelah
							layar ponsel dimatikan.
						</Text>
					</View>
					<ModernToggle
						value={settings?.autoHibernation ?? false}
						onValueChange={(v) => updateSetting("autoHibernation", v)}
					/>
				</View>

				<View className="py-3 flex-row items-center justify-between">
					<View className="flex-1 pr-4">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Always Ignore Background-free
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Lewati aplikasi yang sudah bersih dan tidak memiliki layanan latar
							belakang aktif.
						</Text>
					</View>
					<ModernToggle
						value={settings?.ignoreBackgroundFree ?? false}
						onValueChange={(v) => updateSetting("ignoreBackgroundFree", v)}
					/>
				</View>

				<View className="py-3 flex-row items-center justify-between">
					<View className="flex-1 pr-4">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Sertakan Aplikasi Sistem
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Tampilkan dan izinkan penambahan aplikasi sistem inti ke dalam
							daftar KillApps.
						</Text>
					</View>
					<ModernToggle
						value={settings?.hibernateSystemApps ?? false}
						onValueChange={(v) => updateSetting("hibernateSystemApps", v)}
					/>
				</View>
			</View>

			<Text
				className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-4`}
			>
				6. Pintasan & Notifikasi
			</Text>
			<View
				className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-6 px-4 py-1 divide-y ${colors.dividerClass}`}
			>
				<View className="py-3 flex-row items-center justify-between">
					<View className="flex-1 pr-4">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Quick Action Notification
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Tampilkan pintasan eksekusi cepat 1-ketuk pada panel notifikasi
							atas.
						</Text>
					</View>
					<ModernToggle
						value={settings?.quickActionNotif ?? false}
						onValueChange={handleQuickNotifChange}
					/>
				</View>

				<Pressable
					onPress={handleLongPressNavBar}
					className="py-3 flex-row items-center justify-between active:opacity-70"
				>
					<View className="flex-1 pr-4">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Long-press Action on Nav-bar
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Aksi cepat saat menekan lama tombol Home atau bilah navigasi
							bawah.
						</Text>
					</View>
					<View className="flex-row items-center gap-1">
						<Text className={`${colors.textClass} font-bold text-xs`}>
							Atur
						</Text>
						<ArrowRight size={14} color={colors.iconColor} />
					</View>
				</Pressable>

				<View className="py-3 flex-row items-center justify-between">
					<View className="flex-1 pr-4">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Don&apos;t Remove Notification
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Jaga agar kartu notifikasi penting tidak ikut terhapus saat
							mematikan aplikasi.
						</Text>
					</View>
					<ModernToggle
						value={settings?.dontRemoveNotif ?? false}
						onValueChange={(v) => updateSetting("dontRemoveNotif", v)}
					/>
				</View>
			</View>

			<SelectionModal
				visible={workingModeModal}
				title="Pilih Mode Bekerja"
				subtitle="Tentukan metode eksekusi untuk mematikan aplikasi di latar belakang:"
				options={[
					{
						id: "shizuku",
						label: "Shizuku",
						badge: "REKOMENDASI",
						badgeType: "emerald",
						description:
							"Akses nirkabel berkecepatan tinggi via ADB tanpa perlu root. Sangat stabil dan aman.",
					},
					{
						id: "root",
						label: "Root Akses",
						badge: "SUPERUSER",
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

			<SelectionModal
				visible={navBarModal}
				title="Pintasan Bilah Navigasi"
				subtitle="Pilih aksi eksekusi cepat saat tombol Home atau Navigasi ditekan lama:"
				options={[
					{
						id: "true",
						label: "Kill Semua & Matikan Layar",
						badge: "AKTIF",
						badgeType: "emerald",
						description:
							"Eksekusi pembersihan instan dan langsung memadamkan layar ponsel Anda.",
					},
					{
						id: "false",
						label: "Nonaktifkan",
						badge: "MATI",
						badgeType: "default",
						description:
							"Tidak melakukan aksi apapun saat tombol ditekan lama.",
					},
				]}
				selectedId={String(settings?.longPressNavBar ?? false)}
				onSelect={(id) => {
					updateSetting("longPressNavBar", id === "true");
				}}
				onClose={() => setNavBarModal(false)}
			/>

			<InfoModal
				visible={rootInfoModal}
				title="Informasi Mode Root"
				content="Pastikan perangkat Anda sudah di-root menggunakan Magisk atau KernelSU. Berikan izin Superuser (Grant) saat diminta oleh pop-up sistem agar fitur eksekusi cepat ini bekerja optimal tanpa hambatan."
				onClose={() => setRootInfoModal(false)}
			/>
		</View>
	);
};
