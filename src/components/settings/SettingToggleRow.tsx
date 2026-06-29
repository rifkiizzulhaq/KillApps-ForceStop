import type React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { ModernToggle } from "../common/ModernToggle";

interface Props {
	title: string;
	subtitle: string;
	value: boolean;
	onValueChange: (value: boolean) => void;
}

export const SettingToggleRow: React.FC<Props> = ({
	title,
	subtitle,
	value,
	onValueChange,
}) => {
	const { colors } = useTheme();

	return (
		<View className="py-3 flex-row items-center justify-between">
			<View className="flex-1 pr-4">
				<Text className={`${colors.textClass} font-bold text-sm`}>{title}</Text>
				<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
					{subtitle}
				</Text>
			</View>
			<ModernToggle value={value} onValueChange={onValueChange} />
		</View>
	);
};
