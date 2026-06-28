import { useColorScheme as useRNColorScheme } from "react-native";
import { useAppStore } from "../stores/useAppStore";

export type ThemeMode = "system" | "light" | "dark";

export const useTheme = () => {
	const themeMode =
		useAppStore((state) => state.settings?.themeMode) ?? "system";
	const systemScheme = useRNColorScheme();

	const isDark =
		themeMode === "system" ? systemScheme !== "light" : themeMode === "dark";

	return {
		themeMode,
		isDark,
		colors: {
			bgClass: isDark ? "bg-black" : "bg-white",
			modalBgClass: isDark ? "bg-zinc-950" : "bg-white",
			cardClass: isDark ? "bg-zinc-900" : "bg-zinc-100",
			cardBorderClass: isDark ? "border-zinc-800" : "border-zinc-200",
			inputBgClass: isDark ? "bg-zinc-900" : "bg-zinc-100",
			textClass: isDark ? "text-white" : "text-black",
			subTextClass: isDark ? "text-zinc-400" : "text-zinc-600",
			captionClass: isDark ? "text-zinc-500" : "text-zinc-400",
			primaryBtnClass: isDark ? "bg-white" : "bg-black",
			primaryBtnTextClass: isDark ? "text-black" : "text-white",
			secondaryBtnClass: isDark ? "bg-zinc-800" : "bg-zinc-200",
			secondaryBtnTextClass: isDark ? "text-white" : "text-black",
			iconColor: isDark ? "#ffffff" : "#000000",
			subIconColor: isDark ? "#a1a1aa" : "#52525b",
			statusBarStyle: (isDark ? "light-content" : "dark-content") as
				| "light-content"
				| "dark-content",
			statusBarBg: isDark ? "#000000" : "#ffffff",
			dividerClass: isDark ? "divide-zinc-800" : "divide-zinc-200",
			borderClass: isDark ? "border-zinc-800" : "border-zinc-200",
		},
	};
};
