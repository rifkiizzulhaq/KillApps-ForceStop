import type React from "react";
import { useState } from "react";
import {
	Alert,
	Modal,
	PermissionsAndroid,
	Platform,
	Pressable,
	ScrollView,
	Switch,
	Text,
	View,
} from "react-native";
import { useAppStore } from "../stores/useAppStore";
import { ShizukuStatusCard } from "./ShizukuStatusCard";

export const SettingsModal: React.FC = () => {
	const currentScreen = useAppStore((state) => state.currentScreen);
	const setCurrentScreen = useAppStore((state) => state.setCurrentScreen);
	const settings = useAppStore((state) => state.settings);
	const updateSetting = useAppStore((state) => state.updateSetting);

	const [activeTab, setActiveTab] = useState<"main" | "troubleshoot">("main");

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
		Alert.alert(
			"Pilih Mode Bekerja",
			"Tentukan metode eksekusi untuk mematikan aplikasi:",
			[
				{
					text: "Shizuku (Rekomendasi)",
					onPress: () => updateSetting("workingMode", "shizuku"),
				},
				{
					text: "Root (Akses Penuh)",
					onPress: () => {
						updateSetting("workingMode", "root");
						Alert.alert(
							"Mode Root",
							"Pastikan perangkat Anda sudah di-root dengan Magisk atau KernelSU agar fitur ini bekerja optimal.",
						);
					},
				},
				{ text: "Batal", style: "cancel" },
			],
		);
	};

	const handleLongPressNavBar = () => {
		Alert.alert(
			"Pintasan Bilah Navigasi",
			"Pilih aksi saat tombol Home/Navigasi ditekan lama:",
			[
				{ text: "Hibernasi Semua & Matikan Layar" },
				{ text: "Buka Dasbor KillApp" },
				{ text: "Nonaktifkan" },
			],
		);
	};

	const showTroubleGuide = (title: string, content: string) => {
		Alert.alert(title, content, [{ text: "Mengerti" }]);
	};

	return (
		<Modal
			visible={currentScreen === "settings"}
			animationType="slide"
			transparent={true}
			onRequestClose={() => setCurrentScreen("home")}
		>
			<View className="flex-1 bg-black/80 justify-end">
				<View className="bg-slate-950 border-t border-slate-800 rounded-t-3xl h-[88%] flex-col">
					<View className="flex-row items-center justify-between p-6 border-b border-slate-900">
						<View>
							<Text className="text-white font-black text-xl tracking-wide">
								Pengaturan
							</Text>
							<Text className="text-emerald-400 font-medium text-xs mt-0.5">
								Konfigurasi Lanjutan bergaya Greenify
							</Text>
						</View>
						<Pressable
							onPress={() => setCurrentScreen("home")}
							className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 items-center justify-center active:bg-slate-800"
						>
							<Text className="text-slate-300 font-bold text-base">✕</Text>
						</Pressable>
					</View>

					<View className="flex-row border-b border-slate-900 bg-slate-950/50 px-6 pt-2">
						<Pressable
							onPress={() => setActiveTab("main")}
							className={`pb-3 mr-8 border-b-2 ${
								activeTab === "main"
									? "border-emerald-500"
									: "border-transparent"
							}`}
						>
							<Text
								className={`font-bold text-sm ${
									activeTab === "main" ? "text-emerald-400" : "text-slate-400"
								}`}
							>
								Fitur Utama
							</Text>
						</Pressable>
						<Pressable
							onPress={() => setActiveTab("troubleshoot")}
							className={`pb-3 border-b-2 ${
								activeTab === "troubleshoot"
									? "border-emerald-500"
									: "border-transparent"
							}`}
						>
							<Text
								className={`font-bold text-sm ${
									activeTab === "troubleshoot"
										? "text-emerald-400"
										: "text-slate-400"
								}`}
							>
								Troubleshooting & Geeks
							</Text>
						</Pressable>
					</View>

					<ScrollView
						className="flex-1 px-6 pt-4"
						showsVerticalScrollIndicator={false}
					>
						<ShizukuStatusCard />

						{activeTab === "main" ? (
							<View className="pb-12">
								<Text className="text-slate-500 font-black text-[11px] tracking-wider uppercase mb-2 mt-4">
									1. Mode Eksekusi
								</Text>
								<Pressable
									onPress={handleWorkingModePress}
									className="bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-3 flex-row items-center justify-between active:bg-slate-800/80"
								>
									<View className="flex-1 pr-3">
										<Text className="text-white font-bold text-base">
											Mode Bekerja
										</Text>
										<Text className="text-slate-400 text-xs mt-0.5">
											{settings?.workingMode === "root"
												? "Root (Akses Superuser Penuh)"
												: "Shizuku (Akses Tanpa Root via ADB)"}
										</Text>
									</View>
									<View className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
										<Text className="text-emerald-400 font-bold text-xs uppercase">
											Ubah
										</Text>
									</View>
								</Pressable>

								<Text className="text-slate-500 font-black text-[11px] tracking-wider uppercase mb-2 mt-4">
									2. Cerdas & Deteksi Lanjutan
								</Text>
								<View className="bg-slate-900 border border-slate-800 rounded-2xl mb-3 px-4 py-1 divide-y divide-slate-800/80">
									<View className="py-3 flex-row items-center justify-between">
										<View className="flex-1 pr-4">
											<Text className="text-white font-bold text-sm">
												Smart Hibernation
											</Text>
											<Text className="text-slate-400 text-[11px] mt-0.5">
												Analisis pintar untuk menunda hibernasi saat aplikasi
												sedang melakukan tugas penting.
											</Text>
										</View>
										<Switch
											value={settings?.smartHibernation ?? true}
											onValueChange={(v) =>
												updateSetting("smartHibernation", v)
											}
											trackColor={{ false: "#334155", true: "#059669" }}
											thumbColor={
												settings?.smartHibernation ? "#34d399" : "#94a3b8"
											}
										/>
									</View>

									<View className="py-3 flex-row items-center justify-between">
										<View className="flex-1 pr-4">
											<Text className="text-white font-bold text-sm">
												Finer Detection (Media Playback)
											</Text>
											<Text className="text-slate-400 text-[11px] mt-0.5">
												Mencegah pemotongan pemutaran musik atau video yang
												berjalan di latar belakang.
											</Text>
										</View>
										<Switch
											value={settings?.finerMediaDetection ?? false}
											onValueChange={(v) =>
												updateSetting("finerMediaDetection", v)
											}
											trackColor={{ false: "#334155", true: "#059669" }}
											thumbColor={
												settings?.finerMediaDetection ? "#34d399" : "#94a3b8"
											}
										/>
									</View>
								</View>

								<Text className="text-slate-500 font-black text-[11px] tracking-wider uppercase mb-2 mt-4">
									3. Intensitas & Kebangkitan
								</Text>
								<View className="bg-slate-900 border border-slate-800 rounded-2xl mb-3 px-4 py-1 divide-y divide-slate-800/80">
									<View className="py-3 flex-row items-center justify-between">
										<View className="flex-1 pr-4">
											<Text className="text-white font-bold text-sm">
												Hibernasi Dangkal
											</Text>
											<Text className="text-slate-400 text-[11px] mt-0.5">
												Membekukan aktivitas sementara tanpa mematikan total
												proses aplikasi (Android 9+).
											</Text>
										</View>
										<Switch
											value={settings?.shallowHibernation ?? false}
											onValueChange={(v) =>
												updateSetting("shallowHibernation", v)
											}
											trackColor={{ false: "#334155", true: "#059669" }}
											thumbColor={
												settings?.shallowHibernation ? "#34d399" : "#94a3b8"
											}
										/>
									</View>

									<View className="py-3 flex-row items-center justify-between">
										<View className="flex-1 pr-4">
											<Text className="text-white font-bold text-sm">
												Wake-up Tracking and Cut-off
											</Text>
											<Text className="text-slate-400 text-[11px] mt-0.5">
												Lacak aplikasi yang sering terbangun sendiri dan potong
												rantai pemicunya.
											</Text>
										</View>
										<Switch
											value={settings?.wakeUpTracking ?? true}
											onValueChange={(v) => updateSetting("wakeUpTracking", v)}
											trackColor={{ false: "#334155", true: "#059669" }}
											thumbColor={
												settings?.wakeUpTracking ? "#34d399" : "#94a3b8"
											}
										/>
									</View>
								</View>

								<Text className="text-slate-500 font-black text-[11px] tracking-wider uppercase mb-2 mt-4">
									4. Otomatisasi & Pengecualian
								</Text>
								<View className="bg-slate-900 border border-slate-800 rounded-2xl mb-3 px-4 py-1 divide-y divide-slate-800/80">
									<View className="py-3 flex-row items-center justify-between">
										<View className="flex-1 pr-4">
											<Text className="text-white font-bold text-sm">
												Otomatis Hibernasi
											</Text>
											<Text className="text-slate-400 text-[11px] mt-0.5">
												Eksekusi pembersihan latar belakang otomatis setelah
												layar ponsel dimatikan.
											</Text>
										</View>
										<Switch
											value={settings?.autoHibernation ?? false}
											onValueChange={(v) => updateSetting("autoHibernation", v)}
											trackColor={{ false: "#334155", true: "#059669" }}
											thumbColor={
												settings?.autoHibernation ? "#34d399" : "#94a3b8"
											}
										/>
									</View>

									<View className="py-3 flex-row items-center justify-between">
										<View className="flex-1 pr-4">
											<Text className="text-white font-bold text-sm">
												Always Ignore Background-free
											</Text>
											<Text className="text-slate-400 text-[11px] mt-0.5">
												Lewati aplikasi yang sudah bersih dan tidak memiliki
												layanan latar belakang aktif.
											</Text>
										</View>
										<Switch
											value={settings?.ignoreBackgroundFree ?? false}
											onValueChange={(v) =>
												updateSetting("ignoreBackgroundFree", v)
											}
											trackColor={{ false: "#334155", true: "#059669" }}
											thumbColor={
												settings?.ignoreBackgroundFree ? "#34d399" : "#94a3b8"
											}
										/>
									</View>

									<View className="py-3 flex-row items-center justify-between">
										<View className="flex-1 pr-4">
											<Text className="text-white font-bold text-sm">
												Greenify Aplikasi System
											</Text>
											<Text className="text-slate-400 text-[11px] mt-0.5">
												Tampilkan dan izinkan penambahan aplikasi sistem inti ke
												dalam daftar hibernasi.
											</Text>
										</View>
										<Switch
											value={settings?.hibernateSystemApps ?? false}
											onValueChange={(v) =>
												updateSetting("hibernateSystemApps", v)
											}
											trackColor={{ false: "#334155", true: "#059669" }}
											thumbColor={
												settings?.hibernateSystemApps ? "#34d399" : "#94a3b8"
											}
										/>
									</View>
								</View>

								<Text className="text-slate-500 font-black text-[11px] tracking-wider uppercase mb-2 mt-4">
									5. Pintasan & Notifikasi
								</Text>
								<View className="bg-slate-900 border border-slate-800 rounded-2xl mb-6 px-4 py-1 divide-y divide-slate-800/80">
									<View className="py-3 flex-row items-center justify-between">
										<View className="flex-1 pr-4">
											<Text className="text-white font-bold text-sm">
												Quick Action Notification
											</Text>
											<Text className="text-slate-400 text-[11px] mt-0.5">
												Tampilkan pintasan hibernasi cepat 1-ketuk pada panel
												notifikasi atas.
											</Text>
										</View>
										<Switch
											value={settings?.quickActionNotif ?? false}
											onValueChange={handleQuickNotifChange}
											trackColor={{ false: "#334155", true: "#059669" }}
											thumbColor={
												settings?.quickActionNotif ? "#34d399" : "#94a3b8"
											}
										/>
									</View>

									<Pressable
										onPress={handleLongPressNavBar}
										className="py-3 flex-row items-center justify-between"
									>
										<View className="flex-1 pr-4">
											<Text className="text-white font-bold text-sm">
												Long-press Action on Nav-bar
											</Text>
											<Text className="text-slate-400 text-[11px] mt-0.5">
												Aksi cepat saat menekan lama tombol Home atau bilah
												navigasi bawah.
											</Text>
										</View>
										<Text className="text-emerald-400 font-bold text-xs">
											Atur →
										</Text>
									</Pressable>

									<View className="py-3 flex-row items-center justify-between">
										<View className="flex-1 pr-4">
											<Text className="text-white font-bold text-sm">
												Don&apos;t Remove Notification
											</Text>
											<Text className="text-slate-400 text-[11px] mt-0.5">
												Jaga agar kartu notifikasi penting tidak ikut terhapus
												saat mematikan aplikasi.
											</Text>
										</View>
										<Switch
											value={settings?.dontRemoveNotif ?? false}
											onValueChange={(v) => updateSetting("dontRemoveNotif", v)}
											trackColor={{ false: "#334155", true: "#059669" }}
											thumbColor={
												settings?.dontRemoveNotif ? "#34d399" : "#94a3b8"
											}
										/>
									</View>
								</View>
							</View>
						) : (
							<View className="pb-12">
								<Text className="text-slate-500 font-black text-[11px] tracking-wider uppercase mb-2 mt-4">
									10. Troubleshooting (Pusat Bantuan)
								</Text>
								<View className="bg-slate-900 border border-slate-800 rounded-2xl mb-4 p-2 divide-y divide-slate-800/80">
									<Pressable
										onPress={() =>
											showTroubleGuide(
												"1. Apps are not auto-hibernating",
												"Jika aplikasi tidak otomatis mati:\n\n• Wake-up Tracker: Aktifkan fitur ini di tab utama untuk mendeteksi aplikasi mana yang membangunkan proses.\n• Quick Action Notification: Gunakan pintasan di panel notifikasi untuk mematikan secara instan.",
											)
										}
										className="p-3.5 flex-row items-center justify-between active:bg-slate-800/50 rounded-xl"
									>
										<View className="flex-1 pr-3">
											<Text className="text-white font-bold text-sm">
												1. Apps are not auto-hibernating
											</Text>
											<Text className="text-slate-400 text-[11px] mt-0.5">
												Berisi Wake-up tracker dan solusi Quick action
												notification.
											</Text>
										</View>
										<Text className="text-slate-500 font-bold">ℹ️</Text>
									</Pressable>

									<Pressable
										onPress={() =>
											showTroubleGuide(
												"2. Auto-hibernation Diagnostics",
												"Pastikan izin Shizuku tidak dicabut oleh sistem manajemen baterai agresif (seperti MIUI / ColorOS / FuntouchOS). Kunci aplikasi KillApp di recent apps agar tidak terbunuh.",
											)
										}
										className="p-3.5 flex-row items-center justify-between active:bg-slate-800/50 rounded-xl"
									>
										<View className="flex-1 pr-3">
											<Text className="text-white font-bold text-sm">
												2. Auto-hibernation
											</Text>
											<Text className="text-slate-400 text-[11px] mt-0.5">
												Diagnosa kendala penghentian otomatis di latar belakang.
											</Text>
										</View>
										<Text className="text-slate-500 font-bold">🔧</Text>
									</Pressable>

									<Pressable
										onPress={() =>
											showTroubleGuide(
												"3. Accessibility Service",
												'Jika mode Shizuku tidak tersedia, layanan Aksesibilitas dapat digunakan sebagai alternatif untuk menekan tombol "Force Stop" secara otomatis di pengaturan Android.',
											)
										}
										className="p-3.5 flex-row items-center justify-between active:bg-slate-800/50 rounded-xl"
									>
										<View className="flex-1 pr-3">
											<Text className="text-white font-bold text-sm">
												3. Accessibility Service
											</Text>
											<Text className="text-slate-400 text-[11px] mt-0.5">
												Pengaturan layanan bantuan otomatisasi tanpa Shizuku.
											</Text>
										</View>
										<Text className="text-slate-500 font-bold">⚙️</Text>
									</Pressable>
								</View>

								<Text className="text-slate-500 font-black text-[11px] tracking-wider uppercase mb-2 mt-4">
									12. Eksklusif & Lanjutan
								</Text>
								<View className="bg-slate-900 border border-slate-800 rounded-2xl mb-6 p-2">
									<Pressable
										onPress={() =>
											showTroubleGuide(
												"Extras for Geek 🤓",
												"Selamat datang di zona Geek!\n\n• Aggressive Doze: Memaksa Android langsung masuk ke mode Doze mendalam.\n• GCM Push Wake-up Bypass: Mengabaikan kebangkitan paksa oleh Google Cloud Messaging.\n• Deep Trim Memory: Membersihkan cache RAM setelah hibernasi.",
											)
										}
										className="p-3.5 flex-row items-center justify-between active:bg-slate-800/50 rounded-xl"
									>
										<View className="flex-1 pr-3">
											<View className="flex-row items-center gap-2">
												<Text className="text-amber-400 font-black text-sm">
													⚡ Extras for Geek
												</Text>
												<View className="bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
													<Text className="text-[9px] font-black text-amber-400 uppercase">
														PRO
													</Text>
												</View>
											</View>
											<Text className="text-slate-400 text-[11px] mt-1">
												Kumpulan fitur eksperimental tingkat lanjut untuk
												pengguna mahir dan developer.
											</Text>
										</View>
										<Text className="text-amber-400 font-bold text-lg">🚀</Text>
									</Pressable>
								</View>
							</View>
						)}
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
};
