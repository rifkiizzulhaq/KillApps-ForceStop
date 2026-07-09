import { X } from "lucide-react-native";
import type React from "react";
import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useAppStore } from "../../stores/useAppStore";
import { ModeStatusCard } from "../common/ModeStatusCard";
import { SettingsMainTab } from "../settings/SettingsMainTab";
import { SettingsTroubleshootTab } from "../settings/SettingsTroubleshootTab";

export const SettingsModal: React.FC = () => {
	const currentScreen = useAppStore((state) => state.currentScreen);
	const setCurrentScreen = useAppStore((state) => state.setCurrentScreen);
	const settings = useAppStore((state) => state.settings);
	const [activeTab, setActiveTab] = useState<"main" | "troubleshoot">("main");
	const { colors, isDark } = useTheme();
	const scrollRef = useRef<ScrollView>(null);
	const initialScrollY = useRef(useAppStore.getState().settingsScrollY);

	return (
		<Modal
			visible={currentScreen === "settings"}
			animationType="slide"
			transparent={true}
			onRequestClose={() => setCurrentScreen("home")}
		>
			<View className="flex-1 bg-black/80 justify-end">
				<View
					className={`${colors.modalBgClass} border-t ${colors.borderClass} rounded-t-3xl h-[88%] flex-col`}
				>
					<View
						className={`flex-row items-center justify-between p-6 border-b ${colors.borderClass}`}
					>
						<View>
							<Text
								className={`${colors.textClass} font-black text-xl tracking-wide`}
							>
								Pengaturan
							</Text>
							<Text
								className={`${colors.subTextClass} font-medium text-xs mt-0.5`}
							>
								Konfigurasi Lanjutan KillApps
							</Text>
						</View>
						<Pressable
							onPress={() => setCurrentScreen("home")}
							className={`w-9 h-9 rounded-full ${colors.cardClass} border ${colors.borderClass} items-center justify-center active:opacity-70`}
						>
							<X size={18} color={colors.iconColor} />
						</Pressable>
					</View>

					<View
						className={`flex-row border-b ${colors.borderClass} ${colors.modalBgClass} px-6 pt-2`}
					>
						<Pressable
							onPress={() => setActiveTab("main")}
							className={`pb-3 mr-8 border-b-2 ${
								activeTab === "main"
									? isDark
										? "border-white"
										: "border-black"
									: "border-transparent"
							}`}
						>
							<Text
								className={`font-bold text-sm ${
									activeTab === "main" ? colors.textClass : colors.captionClass
								}`}
							>
								Fitur Utama
							</Text>
						</Pressable>
						<Pressable
							onPress={() => setActiveTab("troubleshoot")}
							className={`pb-3 border-b-2 ${
								activeTab === "troubleshoot"
									? isDark
										? "border-white"
										: "border-black"
									: "border-transparent"
							}`}
						>
							<Text
								className={`font-bold text-sm ${
									activeTab === "troubleshoot"
										? colors.textClass
										: colors.captionClass
								}`}
							>
								Panduan & Penjelasan
							</Text>
						</Pressable>
					</View>

					<ScrollView
						ref={scrollRef}
						className="flex-1 px-6 pt-4"
						showsVerticalScrollIndicator={false}
						nestedScrollEnabled={true}
						keyboardShouldPersistTaps="handled"
						decelerationRate={settings?.smoothScroll ? 0.992 : "normal"}
						overScrollMode="never"
						onLayout={() => {
							if (initialScrollY.current > 0) {
								scrollRef.current?.scrollTo({
									y: initialScrollY.current,
									animated: false,
								});
							}
						}}
						onScrollEndDrag={(e) =>
							useAppStore
								.getState()
								.setSettingsScrollY(e.nativeEvent.contentOffset.y)
						}
						onMomentumScrollEnd={(e) =>
							useAppStore
								.getState()
								.setSettingsScrollY(e.nativeEvent.contentOffset.y)
						}
					>
						<ModeStatusCard />

						{activeTab === "main" ? (
							<SettingsMainTab />
						) : (
							<SettingsTroubleshootTab />
						)}
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
};
