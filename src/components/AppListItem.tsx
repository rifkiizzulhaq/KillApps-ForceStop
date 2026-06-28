import type React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useAppStore } from "../stores/useAppStore";
import type { AppInfo } from "../types/app";

interface Props {
	app: AppInfo;
}

export const AppListItem: React.FC<Props> = ({ app }) => {
	const toggleSelectApp = useAppStore((state) => state.toggleSelectApp);

	return (
		<Pressable
			onPress={() => toggleSelectApp(app.packageName)}
			accessibilityRole="checkbox"
			accessibilityState={{ checked: app.isSelected }}
			className="flex-row items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl mb-2 active:bg-slate-800"
		>
			<View className="flex-row items-center flex-1 pr-3">
				{app.icon ? (
					<Image
						source={{ uri: app.icon }}
						className="w-11 h-11 rounded-xl mr-3 bg-slate-800/80"
					/>
				) : (
					<View className="w-11 h-11 rounded-xl mr-3 bg-slate-800 items-center justify-center">
						<Text className="text-white font-bold text-base">
							{app.appName.charAt(0).toUpperCase()}
						</Text>
					</View>
				)}

				<View className="flex-1">
					<View className="flex-row items-center gap-2">
						<Text
							numberOfLines={1}
							className="text-white font-bold text-base flex-1"
						>
							{app.appName}
						</Text>
						{app.isSystemApp && (
							<View className="bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded">
								<Text className="text-[10px] font-bold text-amber-400">
									SYS
								</Text>
							</View>
						)}
						{app.isGcm && (
							<View className="bg-sky-500/20 border border-sky-500/30 px-2 py-0.5 rounded">
								<Text className="text-[10px] font-bold text-sky-400">GCM</Text>
							</View>
						)}
					</View>
					<Text numberOfLines={1} className="text-slate-400 text-xs mt-1">
						{app.packageName}
					</Text>
				</View>
			</View>

			<View
				className={`w-6 h-6 rounded-md border items-center justify-center ml-2 ${
					app.isSelected
						? "bg-rose-600 border-rose-500"
						: "border-slate-600 bg-slate-950"
				}`}
			>
				{app.isSelected && (
					<Text className="text-white font-black text-xs">✓</Text>
				)}
			</View>
		</Pressable>
	);
};
