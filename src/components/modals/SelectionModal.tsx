import { Check, Shield, X } from "lucide-react-native";
import type React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export interface SelectionOption {
	id: string;
	label: string;
	description?: string;
	badge?: string;
	badgeType?: "emerald" | "amber" | "cyan" | "default";
}

interface SelectionModalProps {
	visible: boolean;
	title: string;
	subtitle?: string;
	options: SelectionOption[];
	selectedId?: string;
	onSelect: (id: string) => void;
	onClose: () => void;
}

export const SelectionModal: React.FC<SelectionModalProps> = ({
	visible,
	title,
	subtitle,
	options,
	selectedId,
	onSelect,
	onClose,
}) => {
	const { colors, isDark } = useTheme();

	const getBadgeClasses = (type?: string) => {
		switch (type) {
			case "emerald":
				return "bg-emerald-500/20 border-emerald-500/40 text-emerald-400";
			case "amber":
				return "bg-amber-500/20 border-amber-500/40 text-amber-400";
			case "cyan":
				return "bg-cyan-500/20 border-cyan-500/40 text-cyan-400";
			default:
				return "bg-zinc-500/20 border-zinc-500/40 text-zinc-300";
		}
	};

	return (
		<Modal
			visible={visible}
			transparent={true}
			animationType="slide"
			onRequestClose={onClose}
		>
			<View className="flex-1 bg-black/80 justify-end">
				<Pressable className="flex-1" onPress={onClose} />
				<View
					className={`w-full ${colors.modalBgClass} border-t ${colors.borderClass} rounded-t-3xl p-6 pb-8 shadow-2xl max-h-[88%]`}
				>
					<View className="w-12 h-1.5 bg-zinc-500/30 rounded-full self-center mb-5" />
					<View className="flex-row items-start justify-between mb-5">
						<View className="flex-1 pr-3">
							<View className="flex-row items-center gap-2 mb-1">
								<Shield size={20} color={isDark ? "#34d399" : "#10b981"} />
								<Text className={`${colors.textClass} font-black text-xl`}>
									{title}
								</Text>
							</View>
							{subtitle ? (
								<Text
									className={`${colors.subTextClass} text-xs leading-relaxed`}
								>
									{subtitle}
								</Text>
							) : null}
						</View>
						<Pressable
							onPress={onClose}
							className={`w-9 h-9 rounded-full ${colors.cardClass} border ${colors.borderClass} items-center justify-center active:opacity-70`}
						>
							<X size={18} color={colors.iconColor} />
						</Pressable>
					</View>

					<ScrollView showsVerticalScrollIndicator={false} className="max-h-96">
						<View className="gap-3 pb-2">
							{options.map((item) => {
								const isSelected = selectedId === item.id;
								return (
									<Pressable
										key={item.id}
										onPress={() => {
											onSelect(item.id);
											onClose();
										}}
										className={`p-4 rounded-2xl border transition-all ${
											isSelected
												? isDark
													? "bg-emerald-950/40 border-emerald-500/80"
													: "bg-emerald-50 border-emerald-600"
												: `${colors.cardClass} ${colors.borderClass} active:opacity-70`
										}`}
									>
										<View className="flex-row items-center justify-between mb-1.5">
											<View className="flex-row items-center gap-2 flex-1 pr-2">
												<Text
													className={`font-extrabold text-base ${
														isSelected
															? isDark
																? "text-emerald-400"
																: "text-emerald-700"
															: colors.textClass
													}`}
												>
													{item.label}
												</Text>
												{item.badge ? (
													<View
														className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${getBadgeClasses(
															item.badgeType,
														)}`}
													>
														<Text
															className={`text-[9px] font-black tracking-wider ${getBadgeClasses(item.badgeType).split(" ").pop()}`}
														>
															{item.badge}
														</Text>
													</View>
												) : null}
											</View>
											<View
												className={`w-6 h-6 rounded-full border items-center justify-center ${
													isSelected
														? "bg-emerald-500 border-emerald-500"
														: `border-zinc-500/40 ${colors.inputBgClass}`
												}`}
											>
												{isSelected ? (
													<Check size={14} color="#ffffff" strokeWidth={3} />
												) : null}
											</View>
										</View>
										{item.description ? (
											<Text
												className={`text-xs leading-relaxed ${isSelected ? (isDark ? "text-emerald-200/80" : "text-emerald-800/80") : colors.subTextClass}`}
											>
												{item.description}
											</Text>
										) : null}
									</Pressable>
								);
							})}
						</View>
					</ScrollView>

					<Pressable
						onPress={onClose}
						className={`mt-4 py-3.5 rounded-2xl border ${colors.borderClass} ${colors.cardClass} items-center justify-center active:opacity-70`}
					>
						<Text
							className={`${colors.subTextClass} font-bold text-xs uppercase tracking-wider`}
						>
							Batal / Tutup
						</Text>
					</Pressable>
				</View>
			</View>
		</Modal>
	);
};
