import type React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useAppStore } from "../stores/useAppStore";

export const AboutModal: React.FC = () => {
	const currentScreen = useAppStore((state) => state.currentScreen);
	const setCurrentScreen = useAppStore((state) => state.setCurrentScreen);

	return (
		<Modal
			visible={currentScreen === "about"}
			animationType="fade"
			transparent={true}
			onRequestClose={() => setCurrentScreen("home")}
		>
			<View className="flex-1 bg-black/80 justify-center items-center p-6">
				<View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm items-center shadow-2xl">
					<View className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-500/30 items-center justify-center mb-4">
						<Text className="text-rose-500 font-black text-2xl">⚡</Text>
					</View>

					<Text className="text-white font-bold text-xl mb-1">KillApp</Text>
					<Text className="text-slate-400 text-xs font-semibold mb-4">
						Versi 1.0 (Shizuku Edition)
					</Text>

					<Text className="text-slate-300 text-center text-sm leading-6 mb-6">
						Aplikasi pembunuh proses latar belakang massal 1-Klik alternatif
						Greenify tanpa hak akses Root menggunakan teknologi Shizuku API.
					</Text>

					<Pressable
						onPress={() => setCurrentScreen("home")}
						className="bg-slate-800 w-full py-3 rounded-xl items-center active:bg-slate-700"
					>
						<Text className="text-white font-bold text-sm">Tutup</Text>
					</Pressable>
				</View>
			</View>
		</Modal>
	);
};
