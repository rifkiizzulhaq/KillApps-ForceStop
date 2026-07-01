import { X, Zap } from "lucide-react-native";
import type React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import type { AppInfo } from "../../types/app";

interface Props {
	app: AppInfo;
	onRemove: (packageName: string) => void;
	onKill?: (packageName: string) => void;
	disabled?: boolean;
}

export const HibernationListItem: React.FC<Props> = ({
	app,
	onRemove,
	onKill,
	disabled,
}) => {
	const { colors, isDark } = useTheme();

	return (
		<View
			className={`flex-row items-center justify-between p-3.5 ${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-2.5`}
		>
			<Pressable
				onPress={() => !disabled && !app.isStopped && onKill?.(app.packageName)}
				disabled={disabled || app.isStopped}
				className="flex-row items-center flex-1 pr-2 active:opacity-75"
			>
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
						<View
							className={`px-2 py-0.5 rounded border ${
								app.isStopped
									? `${colors.secondaryBtnClass} ${colors.borderClass}`
									: `${colors.primaryBtnClass} ${isDark ? "border-white" : "border-black"}`
							}`}
						>
							<Text
								className={`text-[10px] font-black ${
									app.isStopped
										? colors.subTextClass
										: colors.primaryBtnTextClass
								}`}
							>
								{app.isStopped ? "Zzz" : "Aktif"}
							</Text>
						</View>
					</View>
					<Text
						numberOfLines={1}
						className={`${colors.subTextClass} text-xs mt-1`}
					>
						{app.packageName}
					</Text>
				</View>
			</Pressable>

			<View className="flex-row items-center gap-1.5">
				{!app.isStopped && onKill && (
					<Pressable
						onPress={() => !disabled && onKill(app.packageName)}
						disabled={disabled}
						className={`flex-row items-center gap-1 px-3 py-1.5 rounded-xl ${colors.primaryBtnClass} active:opacity-80`}
					>
						<Zap size={13} color={colors.primaryBtnTextClass.includes("white") ? "#fff" : isDark ? "#000" : "#fff"} />
						<Text
							className={`font-black text-[10px] tracking-wider uppercase ${colors.primaryBtnTextClass}`}
						>
							Kill
						</Text>
					</Pressable>
				)}

				<Pressable
					onPress={() => !disabled && onRemove(app.packageName)}
					disabled={disabled}
					className={`w-8 h-8 rounded-full ${colors.secondaryBtnClass} items-center justify-center transition-all ${disabled ? "opacity-30" : "active:opacity-70"}`}
				>
					<X size={16} color={colors.iconColor} />
				</Pressable>
			</View>
		</View>
	);
};
