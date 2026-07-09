import { Brain, Snowflake, X } from "lucide-react-native";
import type React from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

interface Props {
	killMessage: string;
	clearKillMessage: () => void;
	isSmartHibernation: boolean;
	isShallowHibernation: boolean;
}

export const KillMessageCard: React.FC<Props> = ({
	killMessage,
	clearKillMessage,
	isSmartHibernation,
	isShallowHibernation,
}) => {
	const { colors } = useTheme();

	return (
		<Pressable
			testID="kill-message-pressable"
			onPress={clearKillMessage}
			className={`mx-4 mt-3 ${colors.cardClass} border ${colors.cardBorderClass} p-4 rounded-2xl flex-row justify-between items-center`}
		>
			<View className="flex-1 mr-2">
				<Text
					testID="kill-message-text"
					className={`${colors.textClass} text-xs font-semibold leading-5`}
				>
					{killMessage}
				</Text>
				{(isSmartHibernation || isShallowHibernation) && (
					<View className="flex-row flex-wrap items-center gap-2 mt-2">
						{isSmartHibernation && (
							<View className="flex-row items-center bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
								<Brain size={13} color="#3b82f6" />
								<Text className="text-[11px] text-blue-500 font-bold ml-1.5">
									Smart KillApps aktif
								</Text>
							</View>
						)}
						{isShallowHibernation && (
							<View className="flex-row items-center bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
								<Snowflake size={13} color="#06b6d4" />
								<Text className="text-[11px] text-cyan-500 font-bold ml-1.5">
									KillApps dangkal diterapkan
								</Text>
							</View>
						)}
					</View>
				)}
			</View>
			<View className="ml-2">
				<X size={16} color={colors.iconColor} />
			</View>
		</Pressable>
	);
};
