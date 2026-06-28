import { Check } from "lucide-react-native";
import type React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { useAppStore } from "../stores/useAppStore";
import type { AppInfo } from "../types/app";

interface Props {
	app: AppInfo;
}

export const AppListItem: React.FC<Props> = ({ app }) => {
	const toggleSelectApp = useAppStore((state) => state.toggleSelectApp);
	const { colors, isDark } = useTheme();

	return (
		<Pressable
			onPress={() => toggleSelectApp(app.packageName)}
			accessibilityRole="checkbox"
			accessibilityState={{ checked: app.isSelected }}
			className={`flex-row items-center justify-between p-4 ${colors.cardClass} border ${colors.cardBorderClass} rounded-xl mb-2 active:opacity-70`}
		>
			<View className="flex-row items-center flex-1 pr-3">
				{app.icon ? (
					<Image
						source={{ uri: app.icon }}
						className={`w-11 h-11 rounded-xl mr-3 ${colors.secondaryBtnClass}`}
					/>
				) : (
					<View
						className={`w-11 h-11 rounded-xl mr-3 ${colors.secondaryBtnClass} items-center justify-center`}
					>
						<Text className={`${colors.textClass} font-bold text-base`}>
							{app.appName.charAt(0).toUpperCase()}
						</Text>
					</View>
				)}

				<View className="flex-1">
					<View className="flex-row items-center gap-2">
						<Text
							numberOfLines={1}
							className={`${colors.textClass} font-bold text-base flex-1`}
						>
							{app.appName}
						</Text>
						{app.isSystemApp && (
							<View
								className={`${colors.secondaryBtnClass} border ${colors.borderClass} px-2 py-0.5 rounded`}
							>
								<Text
									className={`text-[10px] font-bold ${colors.subTextClass}`}
								>
									SYS
								</Text>
							</View>
						)}
						{app.isGcm && (
							<View
								className={`${colors.secondaryBtnClass} border ${colors.borderClass} px-2 py-0.5 rounded`}
							>
								<Text
									className={`text-[10px] font-bold ${colors.subTextClass}`}
								>
									GCM
								</Text>
							</View>
						)}
					</View>
					<Text
						numberOfLines={1}
						className={`${colors.subTextClass} text-xs mt-1`}
					>
						{app.packageName}
					</Text>
				</View>
			</View>

			<View
				className={`w-6 h-6 rounded-md border items-center justify-center ml-2 ${
					app.isSelected
						? `${colors.primaryBtnClass} ${isDark ? "border-white" : "border-black"}`
						: `${colors.borderClass} ${colors.inputBgClass}`
				}`}
			>
				{app.isSelected && (
					<Check
						size={16}
						color={
							colors.primaryBtnTextClass === "text-black"
								? "#000000"
								: "#ffffff"
						}
						strokeWidth={3}
					/>
				)}
			</View>
		</Pressable>
	);
};
