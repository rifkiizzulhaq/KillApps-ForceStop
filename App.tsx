import type React from "react";
import { StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "./src/hooks/useTheme";
import { AddAppsScreen } from "./src/screens/AddAppsScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { useAppStore } from "./src/stores/useAppStore";

function App(): React.JSX.Element | null {
	const currentScreen = useAppStore((state) => state.currentScreen);
	const isHydrated = useAppStore((state) => state.isHydrated);
	const { colors } = useTheme();

	if (!isHydrated) {
		return null;
	}

	return (
		<SafeAreaView className={`flex-1 ${colors.bgClass}`}>
			<StatusBar
				barStyle={colors.statusBarStyle}
				backgroundColor={colors.statusBarBg}
			/>
			{currentScreen === "add_apps" ? <AddAppsScreen /> : <HomeScreen />}
		</SafeAreaView>
	);
}

export default App;
