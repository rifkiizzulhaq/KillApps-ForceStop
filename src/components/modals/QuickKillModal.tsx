import { PauseCircle, Snowflake, X } from "lucide-react-native";
import type React from "react";
import { useState } from "react";
import {
	ActivityIndicator,
	Image,
	Modal,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useAppStore } from "../../stores/useAppStore";
import type { AppInfo } from "../../types/app";

interface QuickKillModalProps {
	visible: boolean;
	onClose: () => void;
}

export const QuickKillModal: React.FC<QuickKillModalProps> = ({
	visible,
	onClose,
}) => {
	const apps = useAppStore((state) => state.apps);
	const settings = useAppStore((state) => state.settings);
	const hibernationList = useAppStore((state) => state.hibernationList);
	const killSingleApp = useAppStore((state) => state.killSingleApp);
	const killHibernationApps = useAppStore((state) => state.killHibernationApps);
	const isKilling = useAppStore((state) => state.isKilling);
	const { colors, isDark } = useTheme();

	const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);

	const activeTargets = apps.filter(
		(app) => hibernationList.includes(app.packageName) && !app.isStopped,
	);

	const handleClose = () => {
		setSelectedApp(null);
		onClose();
	};

	return (
		<Modal
			animationType="fade"
			transparent={true}
			visible={visible}
			onRequestClose={handleClose}
		>
			<View className="flex-1 bg-black/80 justify-center px-5">
				<View
					className={`${colors.modalBgClass} border ${colors.borderClass} rounded-3xl p-6 max-h-[85%]`}
				>
					<View
						className={`flex-row items-center justify-between pb-4 border-b ${colors.borderClass} mb-4`}
					>
						<View className="flex-row items-center gap-2.5">
							<View
								className={`w-10 h-10 rounded-xl ${colors.cardClass} border ${colors.cardBorderClass} items-center justify-center`}
							>
								<Snowflake color={colors.iconColor} size={22} />
							</View>
							<View>
								<Text
									className={`${colors.textClass} font-black text-lg tracking-wider`}
								>
									Pilih Spesifik
								</Text>
								<Text
									className={`${colors.subTextClass} text-xs font-semibold`}
								>
									Klik aplikasi untuk memunculkan tombol penghentian
								</Text>
							</View>
						</View>
						<Pressable
							onPress={handleClose}
							className={`w-10 h-10 rounded-full ${colors.cardClass} items-center justify-center active:opacity-70 border ${colors.cardBorderClass}`}
						>
							<X color={colors.iconColor} size={20} />
						</Pressable>
					</View>

					{activeTargets.length === 0 ? (
						<View className="py-12 items-center justify-center">
							<Text
								className={`${colors.subTextClass} font-bold text-center text-sm mb-1`}
							>
								Semua aplikasi target sudah dihentikan prosesnya.
							</Text>
							<Text className={`${colors.captionClass} text-center text-xs`}>
								Tidak ada aplikasi aktif yang perlu dihentikan saat ini.
							</Text>
						</View>
					) : (
						<>
							<Text
								className={`${colors.captionClass} text-xs font-bold uppercase tracking-wider mb-3`}
							>
								Jajaran Aplikasi Aktif ({activeTargets.length})
							</Text>
							<ScrollView
								className="mb-4 max-h-60"
								decelerationRate={settings?.smoothScroll ? 0.992 : "normal"}
								overScrollMode="never"
							>
								<View className="flex-row flex-wrap justify-between">
									{activeTargets.map((app) => {
										const isSelected =
											selectedApp?.packageName === app.packageName;
										return (
											<Pressable
												key={app.packageName}
												onPress={() => setSelectedApp(app)}
												className={`w-[48%] mb-2.5 p-3 rounded-2xl border flex-row items-center gap-2.5 active:opacity-70 ${
													isSelected
														? `${colors.primaryBtnClass} ${isDark ? "border-white" : "border-black"}`
														: `${colors.cardClass} ${colors.cardBorderClass}`
												}`}
											>
												{app.icon ? (
													<Image
														source={{ uri: app.icon }}
														className={`w-9 h-9 rounded-xl ${colors.secondaryBtnClass}`}
													/>
												) : (
													<View
														className={`w-9 h-9 rounded-xl ${colors.secondaryBtnClass} items-center justify-center`}
													>
														<Text
															className={`${isSelected ? colors.primaryBtnTextClass : colors.textClass} font-bold`}
														>
															{app.appName.charAt(0).toUpperCase()}
														</Text>
													</View>
												)}
												<Text
													numberOfLines={1}
													className={`font-bold text-xs flex-1 ${
														isSelected
															? colors.primaryBtnTextClass
															: colors.textClass
													}`}
												>
													{app.appName}
												</Text>
											</Pressable>
										);
									})}
								</View>
							</ScrollView>
							{selectedApp && (
								<View
									className={`p-4 rounded-2xl ${colors.cardClass} border ${colors.cardBorderClass} mb-4`}
								>
									<View className="flex-row items-center justify-between mb-3">
										<View className="flex-row items-center gap-2.5 flex-1 pr-2">
											{selectedApp.icon ? (
												<Image
													source={{ uri: selectedApp.icon }}
													className={`w-10 h-10 rounded-xl ${colors.secondaryBtnClass}`}
												/>
											) : (
												<View
													className={`w-10 h-10 rounded-xl ${colors.secondaryBtnClass} items-center justify-center`}
												>
													<Text className={`${colors.textClass} font-black`}>
														{selectedApp.appName.substring(0, 2).toUpperCase()}
													</Text>
												</View>
											)}
											<View className="flex-1">
												<Text
													numberOfLines={1}
													className={`${colors.textClass} font-bold text-sm`}
												>
													{selectedApp.appName}
												</Text>
												<Text
													className={`${colors.subTextClass} text-xs font-semibold mt-0.5`}
												>
													Siap dihentikan spesifik
												</Text>
											</View>
										</View>
									</View>

									<Pressable
										disabled={isKilling}
										onPress={async () => {
											await killSingleApp(selectedApp.packageName);
											setSelectedApp(null);
										}}
										className={`w-full py-3.5 ${colors.primaryBtnClass} rounded-xl items-center justify-center flex-row gap-2 active:opacity-80 border ${isDark ? "border-white" : "border-black"}`}
									>
										{isKilling ? (
											<ActivityIndicator
												color={
													colors.primaryBtnTextClass === "text-black"
														? "#000000"
														: "#ffffff"
												}
												size="small"
											/>
										) : (
											<>
												<PauseCircle
													color={
														colors.primaryBtnTextClass === "text-black"
															? "#000000"
															: "#ffffff"
													}
													size={18}
												/>
												<Text
													className={`${colors.primaryBtnTextClass} font-black text-xs tracking-wider`}
												>
													KILL {selectedApp.appName.toUpperCase()}
												</Text>
											</>
										)}
									</Pressable>
								</View>
							)}
						</>
					)}

					{activeTargets.length > 1 && (
						<Pressable
							disabled={isKilling}
							onPress={async () => {
								setSelectedApp(null);
								await killHibernationApps();
								if (activeTargets.length <= 1) {
									handleClose();
								}
							}}
							className={`w-full py-3.5 ${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl items-center justify-center flex-row gap-2 active:opacity-80`}
						>
							{isKilling ? (
								<ActivityIndicator color={colors.iconColor} size="small" />
							) : (
								<>
									<Snowflake color={colors.iconColor} size={16} />
									<Text
										className={`${colors.textClass} font-bold text-xs tracking-wider`}
									>
										KILL SEMUA ({activeTargets.length})
									</Text>
								</>
							)}
						</Pressable>
					)}
				</View>
			</View>
		</Modal>
	);
};
