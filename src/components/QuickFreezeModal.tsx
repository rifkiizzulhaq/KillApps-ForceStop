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
import { useAppStore } from "../stores/useAppStore";
import type { AppInfo } from "../types/app";

interface QuickFreezeModalProps {
	visible: boolean;
	onClose: () => void;
}

export const QuickFreezeModal: React.FC<QuickFreezeModalProps> = ({
	visible,
	onClose,
}) => {
	const apps = useAppStore((state) => state.apps);
	const hibernationList = useAppStore((state) => state.hibernationList);
	const killSingleApp = useAppStore((state) => state.killSingleApp);
	const killHibernationApps = useAppStore((state) => state.killHibernationApps);
	const isKilling = useAppStore((state) => state.isKilling);

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
				<View className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[85%]">
					<View className="flex-row items-center justify-between pb-4 border-b border-slate-900 mb-4">
						<View className="flex-row items-center gap-2.5">
							<View className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 items-center justify-center">
								<Snowflake color="#f43f5e" size={22} />
							</View>
							<View>
								<Text className="text-white font-black text-lg tracking-wider">
									Pilih Spesifik
								</Text>
								<Text className="text-slate-400 text-xs font-semibold">
									Klik aplikasi untuk memunculkan tombol freeze
								</Text>
							</View>
						</View>
						<Pressable
							onPress={handleClose}
							className="w-10 h-10 rounded-full bg-slate-900 items-center justify-center active:bg-slate-800 border border-slate-800"
						>
							<X color="#94a3b8" size={20} />
						</Pressable>
					</View>

					{activeTargets.length === 0 ? (
						<View className="py-12 items-center justify-center">
							<Text className="text-slate-400 font-bold text-center text-sm mb-1">
								Semua aplikasi target sudah tidur pulas.
							</Text>
							<Text className="text-slate-500 text-center text-xs">
								Tidak ada aplikasi aktif yang perlu dibekukan saat ini.
							</Text>
						</View>
					) : (
						<>
							<Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
								Jajaran Aplikasi Aktif ({activeTargets.length})
							</Text>
							<ScrollView className="mb-4 max-h-60">
								<View className="flex-row flex-wrap justify-between">
									{activeTargets.map((app) => {
										const isSelected =
											selectedApp?.packageName === app.packageName;
										return (
											<Pressable
												key={app.packageName}
												onPress={() => setSelectedApp(app)}
												className={`w-[48%] p-3 rounded-2xl mb-2.5 border flex-row items-center ${
													isSelected
														? "bg-rose-500/20 border-rose-500"
														: "bg-slate-900 border-slate-800"
												}`}
											>
												{app.icon ? (
													<Image
														source={{ uri: app.icon }}
														className="w-9 h-9 rounded-xl mr-2.5 bg-slate-800"
													/>
												) : (
													<View className="w-9 h-9 rounded-xl mr-2.5 bg-slate-800 items-center justify-center">
														<Text className="text-white font-bold text-sm">
															{app.appName.charAt(0).toUpperCase()}
														</Text>
													</View>
												)}
												<View className="flex-1">
													<Text
														numberOfLines={1}
														className={`font-bold text-xs ${
															isSelected ? "text-rose-300" : "text-white"
														}`}
													>
														{app.appName}
													</Text>
													<Text
														numberOfLines={1}
														className="text-slate-400 text-[10px] mt-0.5"
													>
														{isSelected ? "Dipilih" : "Aktif"}
													</Text>
												</View>
											</Pressable>
										);
									})}
								</View>
							</ScrollView>

							{selectedApp && (
								<View className="p-4 bg-slate-900 border border-rose-500/50 rounded-2xl mb-4 shadow-lg">
									<View className="flex-row items-center justify-between mb-3">
										<View className="flex-row items-center flex-1 pr-2">
											{selectedApp.icon ? (
												<Image
													source={{ uri: selectedApp.icon }}
													className="w-10 h-10 rounded-xl mr-3 bg-slate-800"
												/>
											) : (
												<View className="w-10 h-10 rounded-xl mr-3 bg-slate-800 items-center justify-center">
													<Text className="text-white font-bold text-sm">
														{selectedApp.appName.charAt(0).toUpperCase()}
													</Text>
												</View>
											)}
											<View className="flex-1">
												<Text
													numberOfLines={1}
													className="text-white font-bold text-sm"
												>
													{selectedApp.appName}
												</Text>
												<Text className="text-rose-400 text-xs font-semibold mt-0.5">
													Siap dibekukan spesifik
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
										className="w-full py-3.5 bg-rose-600 rounded-xl items-center justify-center flex-row gap-2 active:bg-rose-500 shadow-md border border-rose-400/30"
									>
										{isKilling ? (
											<ActivityIndicator color="#ffffff" size="small" />
										) : (
											<>
												<PauseCircle color="#ffffff" size={18} />
												<Text className="text-white font-black text-xs tracking-wider">
													FREEZE {selectedApp.appName.toUpperCase()}
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
							className="w-full py-3.5 bg-slate-900 border border-slate-800 rounded-2xl items-center justify-center flex-row gap-2 active:bg-slate-800"
						>
							{isKilling ? (
								<ActivityIndicator color="#ffffff" size="small" />
							) : (
								<>
									<Snowflake color="#f43f5e" size={16} />
									<Text className="text-rose-400 font-bold text-xs tracking-wider">
										FREEZE SEMUA ({activeTargets.length})
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
