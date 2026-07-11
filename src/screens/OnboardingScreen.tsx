import { Check } from "lucide-react-native";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	PermissionsAndroid,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { InfoModal } from "../components/modals/InfoModal";
import { PermissionsSlide } from "../components/onboarding/PermissionsSlide";
import { WelcomeSlide } from "../components/onboarding/WelcomeSlide";
import { WorkingModeSlide } from "../components/onboarding/WorkingModeSlide";
import { useTheme } from "../hooks/useTheme";
import { useAppStore } from "../stores/useAppStore";

export const OnboardingScreen: React.FC = () => {
	const [step, setStep] = useState<number>(1);
	const [isVerifying, setIsVerifying] = useState<boolean>(false);
	const [modalState, setModalState] = useState({
		visible: false,
		title: "",
		content: "",
	});

	const [notifGranted, setNotifGranted] = useState<boolean>(
		Platform.OS !== "android" || Number(Platform.Version) < 33,
	);

	const settings = useAppStore((state) => state.settings);
	const completeOnboarding = useAppStore((state) => state.completeOnboarding);

	const isShizukuActive = useAppStore((state) => state.isShizukuActive);
	const isPermissionGranted = useAppStore((state) => state.isPermissionGranted);
	const isRootActive = useAppStore((state) => state.isRootActive);
	const _isLoading = useAppStore((state) => state.isLoading);

	const checkWorkingModeStatus = useAppStore(
		(state) => state.checkWorkingModeStatus,
	);

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

	const startVerification = useCallback(
		async (mode: string) => {
			setIsVerifying(true);
			try {
				await checkWorkingModeStatus();
				const state = useAppStore.getState();
				if (
					mode !== "root" &&
					state.isShizukuActive &&
					!state.isPermissionGranted
				) {
					setTimeout(() => {
						useAppStore.getState().requestShizukuPermission();
					}, 400);
				}
			} finally {
				setIsVerifying(false);
			}
		},
		[checkWorkingModeStatus],
	);

	const prevStep = useRef(step);

	useEffect(() => {
		prevStep.current = step;
	}, [step]);

	const allPermsGranted = notifGranted;
	const isNextActive = step !== 2 || allPermsGranted;

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
				{step === 1 && <WelcomeSlide />}
				{step === 2 && (
					<PermissionsSlide
						sdkLevel={sdkLevel}
						getAndroidVersionName={getAndroidVersionName}
						notifGranted={notifGranted}
						checkSystemPermissions={checkSystemPermissions}
					/>
				)}
				{step === 3 && (
					<WorkingModeSlide
						isVerifying={isVerifying}
						setIsVerifying={setIsVerifying}
						startVerification={startVerification}
						isModeVerified={isModeVerified}
					/>
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
						disabled={!isNextActive}
						className={`px-6 py-3.5 rounded-xl flex-row items-center gap-2 border border-transparent ${
							isNextActive
								? `${colors.primaryBtnClass} active:opacity-80`
								: isDark
									? "bg-zinc-800 border-zinc-700 opacity-50"
									: "bg-zinc-200 border-zinc-300 opacity-50"
						}`}
					>
						<Text
							className={`font-black text-sm ${
								isNextActive
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
								setModalState({
									visible: true,
									title: "Layanan Belum Aktif",
									content:
										"Silakan izinkan atau aktifkan mode Shizuku/Root terlebih dahulu agar aplikasi dapat bekerja.",
								});
							} else {
								completeOnboarding();
							}
						}}
						disabled={isVerifying}
						className={`px-6 py-3.5 rounded-xl flex-row items-center gap-2 border ${
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
							Masuk ke Aplikasi
						</Text>
						{isModeVerified && !isVerifying && (
							<Check size={18} color={isDark ? "#000" : "#fff"} />
						)}
					</Pressable>
				)}
			</View>
			<InfoModal
				visible={modalState.visible}
				title={modalState.title}
				content={modalState.content}
				onClose={() => setModalState({ ...modalState, visible: false })}
			/>
		</View>
	);
};
