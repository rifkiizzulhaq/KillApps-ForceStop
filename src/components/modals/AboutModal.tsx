import { Zap } from "lucide-react-native";
import type React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useAppStore } from "../../stores/useAppStore";

export const AboutModal: React.FC = () => {
	const currentScreen = useAppStore((state) => state.currentScreen);
	const setCurrentScreen = useAppStore((state) => state.setCurrentScreen);
	const { colors } = useTheme();

	return (
		<Modal
			visible={currentScreen === "about"}
			animationType="slide"
			transparent={true}
			onRequestClose={() => setCurrentScreen("home")}
		>
			<View className="flex-1 bg-black/80 justify-end">
				<Pressable className="flex-1" onPress={() => setCurrentScreen("home")} />
				<View
					className={`${colors.modalBgClass} border-t ${colors.borderClass} rounded-t-3xl p-6 pb-8 items-center`}
				>
					<View className="w-12 h-1.5 bg-zinc-500/30 rounded-full mb-6" />
					<View
						className={`w-16 h-16 rounded-2xl ${colors.secondaryBtnClass} border ${colors.borderClass} items-center justify-center mb-4`}
					>
						<Zap size={32} color={colors.iconColor} fill={colors.iconColor} />
					</View>

					<Text className={`${colors.textClass} font-bold text-xl mb-1`}>
						KillApps
					</Text>
					<Text className={`${colors.subTextClass} text-xs font-semibold mb-4`}>
						Versi 1.0 (Shizuku Edition)
					</Text>

					<Text
						className={`${colors.textClass} text-center text-sm leading-6 mb-6`}
					>
						Aplikasi pembunuh proses latar belakang massal 1-Klik alternatif
						tanpa hak akses Root menggunakan teknologi Shizuku API.
					</Text>

					<Pressable
						onPress={() => setCurrentScreen("home")}
						className={`${colors.primaryBtnClass} w-full py-3 rounded-xl items-center active:opacity-80`}
					>
						<Text
							className={`${colors.primaryBtnTextClass} font-black text-sm`}
						>
							Tutup
						</Text>
					</Pressable>
				</View>
			</View>
		</Modal>
	);
};
