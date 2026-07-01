import {
	Check,
	Settings,
	Shield,
	ShieldAlert,
	Terminal,
	Zap,
} from "lucide-react-native";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	PermissionsAndroid,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { useTheme } from "../hooks/useTheme";
import { useAppStore } from "../stores/useAppStore";

export const OnboardingScreen: React.FC = () => {
	const [step, setStep] = useState<number>(1);
	const [isVerifying, setIsVerifying] = useState<boolean>(false);

	const [notifGranted, setNotifGranted] = useState<boolean>(
		Platform.OS !== "android" || Number(Platform.Version) < 33,
	);

	const settings = useAppStore((state) => state.settings);
	const updateSetting = useAppStore((state) => state.updateSetting);
	const completeOnboarding = useAppStore((state) => state.completeOnboarding);

	const isShizukuActive = useAppStore((state) => state.isShizukuActive);
	const isPermissionGranted = useAppStore((state) => state.isPermissionGranted);
	const isRootActive = useAppStore((state) => state.isRootActive);
	const _isLoading = useAppStore((state) => state.isLoading);

	const checkShizukuStatus = useAppStore((state) => state.checkShizukuStatus);
	const requestShizukuPermission = useAppStore(
		(state) => state.requestShizukuPermission,
	);
	const checkRootStatus = useAppStore((state) => state.checkRootStatus);

	const { colors, isDark } = useTheme();
	const currentMode = settings.workingMode;

	const isModeVerified =
		currentMode === "root"
			? isRootActive
			: isShizukuActive && isPermissionGranted;

	const sdkLevel = Platform.OS === "android" ? Number(Platform.Version) : 33;

	const getAndroidVersionName = (api: number) => {
		if (api >= 34) return `Android 14+ (API ${api})`;
		if (api === 33) return `Android 13 (API 33)`;
		if (api === 32) return `Android 12L (API 32)`;
		if (api === 31) return `Android 12 (API 31)`;
		if (api === 30) return `Android 11 (API 30)`;
		if (api === 29) return `Android 10 (API 29)`;
		if (api === 28) return `Android 9.0 Pie (API 28)`;
		if (api === 27 || api === 26) return `Android 8.0/8.1 Oreo (API ${api})`;
		if (api === 25 || api === 24) return `Android 7.0/7.1 Nougat (API ${api})`;
		if (api === 23) return `Android 6.0 Marshmallow (API 23)`;
		if (api >= 21) return `Android 5.0/5.1 Lollipop (API ${api})`;
		return `Android API ${api}`;
	};

	const checkSystemPermissions = useCallback(async () => {
		if (Platform.OS === "android") {
			if (sdkLevel >= 33) {
				const granted = await PermissionsAndroid.check(
					"android.permission.POST_NOTIFICATIONS",
				);
				setNotifGranted(granted);
			} else {
				setNotifGranted(true);
			}
		} else {
			setNotifGranted(true);
		}
	}, [sdkLevel]);

	useEffect(() => {
		if (step === 2) {
			checkSystemPermissions();
		}
	}, [step, checkSystemPermissions]);

	const startVerification = useCallback(async () => {
		setIsVerifying(true);
		try {
			if (currentMode === "root") {
				await checkRootStatus();
			} else {
				await checkShizukuStatus();
			}
		} finally {
			setIsVerifying(false);
		}
	}, [currentMode, checkRootStatus, checkShizukuStatus]);

	useEffect(() => {
		if (step === 3) {
			startVerification();
		}
	}, [step, startVerification]);

	const allPermsGranted = notifGranted;

	let permCounter = 1;

	return (
		<View className={`flex-1 ${colors.bgClass}`}>
			<View className="px-6 pt-8 pb-4 flex-row items-center justify-between border-b border-zinc-800/20">
				<View className="flex-row items-baseline shrink-0">
					<Text
						className={`text-xl font-black ${colors.textClass} tracking-wider shrink-0`}
					>
						KILL
					</Text>
					<Text
						className={`text-xl font-black ${colors.subTextClass} tracking-wider shrink-0`}
					>
						APPS
					</Text>
				</View>
				<View className="flex-row gap-1.5 items-center">
					{[1, 2, 3].map((s) => (
						<View
							key={s}
							className={`h-2 rounded-full transition-all ${
								s === step
									? isDark
										? "w-6 bg-white"
										: "w-6 bg-black"
									: s < step
										? isDark
											? "w-2 bg-zinc-400"
											: "w-2 bg-zinc-600"
										: isDark
											? "w-2 bg-zinc-800"
											: "w-2 bg-zinc-300"
							}`}
						/>
					))}
				</View>
			</View>

			<ScrollView
				className="flex-1 px-6 pt-6"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 40 }}
			>
				{step === 1 && (
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
							Aplikasi pembersih latar belakang tingkat lanjut untuk menjaga ponsel Anda tetap cepat, hemat baterai, dan bebas lemot.
						</Text>
						<View className="w-full gap-3.5">
							<View
								className={`${colors.cardClass} border ${colors.cardBorderClass} p-4 rounded-2xl flex-row items-start gap-3.5`}
							>
								<View className={`p-2.5 rounded-xl ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}>
									<Settings size={20} color={colors.iconColor} />
								</View>
								<View className="flex-1">
									<Text className={`${colors.textClass} font-bold text-sm mb-1`}>
										Penghentian Aplikasi Latar Belakang
									</Text>
									<Text className={`${colors.subTextClass} text-[11px] leading-relaxed`}>
										Menutup paksa atau membekukan aplikasi yang diam-diam berjalan di latar belakang hanya dengan 1 ketukan tanpa membuat ponsel lag.
									</Text>
								</View>
							</View>
							<View
								className={`${colors.cardClass} border ${colors.cardBorderClass} p-4 rounded-2xl flex-row items-start gap-3.5`}
							>
								<View className={`p-2.5 rounded-xl ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}>
									<Shield size={20} color={colors.iconColor} />
								</View>
								<View className="flex-1">
									<Text className={`${colors.textClass} font-bold text-sm mb-1`}>
										Penghematan RAM & Baterai Maksimal
									</Text>
									<Text className={`${colors.subTextClass} text-[11px] leading-relaxed`}>
										Menyapu bersih sisa memori cache dan memotong sinyal pemicu kebangkitan aplikasi, sehingga baterai awet dan RAM melonjak lega.
									</Text>
								</View>
							</View>
							<View
								className={`${colors.cardClass} border ${colors.cardBorderClass} p-4 rounded-2xl flex-row items-start gap-3.5`}
							>
								<View className={`p-2.5 rounded-xl ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}>
									<Zap size={20} color={colors.iconColor} />
								</View>
								<View className="flex-1">
									<Text className={`${colors.textClass} font-bold text-sm mb-1`}>
										Otomatisasi & Perlindungan Pintar
									</Text>
									<Text className={`${colors.subTextClass} text-[11px] leading-relaxed`}>
										Membersihkan otomatis saat layar ponsel dimatikan serta melindungi pemutaran musik dan navigasi GPS agar tidak terganggu.
									</Text>
								</View>
							</View>
						</View>
					</View>
				)}

				{step === 2 && (
					<View className="py-4">
						<Text className={`${colors.textClass} text-2xl font-black mb-1`}>
							Perizinan Android
						</Text>
						<Text
							className={`${colors.subTextClass} text-xs font-semibold mb-6`}
						>
							Terdeteksi: {getAndroidVersionName(sdkLevel)}
						</Text>

						<View className="gap-3">
							<View
								className={`${colors.cardClass} border ${colors.cardBorderClass} p-4 rounded-2xl flex-row items-center justify-between`}
							>
								<Text
									className={`${colors.textClass} font-bold text-sm flex-1 mr-2`}
								>
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
								<Text
									className={`${colors.textClass} font-bold text-sm flex-1 mr-2`}
								>
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
				)}

				{step === 3 && (
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
								checkShizukuStatus().finally(() => setIsVerifying(false));
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
								checkRootStatus().finally(() => setIsVerifying(false));
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
											startVerification();
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
				)}
			</ScrollView>

			<View
				className={`p-6 border-t ${colors.borderClass} ${colors.bgClass} flex-row justify-between items-center`}
			>
				{step > 1 ? (
					<Pressable
						onPress={() => setStep(step - 1)}
						className={`${colors.secondaryBtnClass} px-5 py-3 rounded-xl active:opacity-70`}
					>
						<Text
							className={`${colors.secondaryBtnTextClass} font-bold text-sm`}
						>
							Kembali
						</Text>
					</Pressable>
				) : (
					<View />
				)}

				{step < 3 ? (
					<Pressable
						onPress={() => setStep(step + 1)}
						disabled={step === 2 && !allPermsGranted}
						className={`px-6 py-3.5 rounded-xl flex-row items-center gap-2 transition-all ${
							step !== 2 || allPermsGranted
								? `${colors.primaryBtnClass} active:opacity-80`
								: isDark
									? "bg-zinc-800 border border-zinc-700 opacity-80"
									: "bg-zinc-200 border border-zinc-300 opacity-80"
						}`}
					>
						<Text
							className={`font-black text-sm ${
								step !== 2 || allPermsGranted
									? colors.primaryBtnTextClass
									: isDark
										? "text-zinc-400"
										: "text-zinc-500"
							}`}
						>
							Lanjut
						</Text>
					</Pressable>
				) : (
					<Pressable
						onPress={() => {
							if (!isModeVerified) {
								Alert.alert(
									"Layanan Belum Aktif",
									"Silakan izinkan atau aktifkan mode Shizuku/Root terlebih dahulu agar aplikasi dapat bekerja.",
								);
							} else {
								completeOnboarding();
							}
						}}
						disabled={isVerifying}
						className={`px-6 py-3.5 rounded-xl flex-row items-center gap-2 transition-all border ${
							isModeVerified && !isVerifying
								? `${colors.primaryBtnClass} border-transparent active:opacity-80`
								: isDark
									? "bg-zinc-800 border-zinc-700 active:opacity-80"
									: "bg-zinc-200 border-zinc-300 active:opacity-80"
						}`}
					>
						<Text
							className={`font-black text-sm ${
								isModeVerified && !isVerifying
									? colors.primaryBtnTextClass
									: colors.textClass
							}`}
						>
							Masuk ke Aplikasi Utama
						</Text>
						{isModeVerified && !isVerifying && (
							<Check size={18} color={isDark ? "#000" : "#fff"} />
						)}
					</Pressable>
				)}
			</View>
		</View>
	);
};
