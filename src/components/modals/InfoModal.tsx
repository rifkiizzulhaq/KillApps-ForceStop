import { Info, X } from "lucide-react-native";
import type React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

interface InfoModalProps {
	visible: boolean;
	title: string;
	content: string;
	onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
	visible,
	title,
	content,
	onClose,
}) => {
	const { colors, isDark } = useTheme();

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
					className={`w-full ${colors.modalBgClass} border-t ${colors.borderClass} rounded-t-3xl p-6 pb-8 shadow-2xl max-h-[85%]`}
				>
					<View className="w-12 h-1.5 bg-zinc-500/30 rounded-full self-center mb-5" />
					<View className="flex-row items-center justify-between mb-4 border-b pb-3 border-zinc-700/30">
						<View className="flex-row items-center gap-2.5 flex-1 pr-3">
							<View className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 items-center justify-center">
								<Info size={18} color={isDark ? "#22d3ee" : "#0891b2"} />
							</View>
							<Text className={`${colors.textClass} font-black text-lg flex-1`}>
								{title}
							</Text>
						</View>
						<Pressable
							onPress={onClose}
							className={`w-8 h-8 rounded-full ${colors.cardClass} border ${colors.borderClass} items-center justify-center active:opacity-70`}
						>
							<X size={16} color={colors.iconColor} />
						</Pressable>
					</View>

					<ScrollView
						showsVerticalScrollIndicator={false}
						className="max-h-80 mb-5"
					>
						<Text className={`${colors.subTextClass} text-sm leading-relaxed`}>
							{content}
						</Text>
					</ScrollView>

					<Pressable
						onPress={onClose}
						className={`w-full py-3.5 rounded-2xl ${colors.primaryBtnClass} items-center justify-center active:opacity-80 shadow-lg`}
					>
						<Text
							className={`${colors.primaryBtnTextClass} font-black text-xs uppercase tracking-wider`}
						>
							Mengerti & Tutup
						</Text>
					</Pressable>
				</View>
			</View>
		</Modal>
	);
};
