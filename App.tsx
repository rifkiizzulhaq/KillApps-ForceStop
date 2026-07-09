import type React from "react";
import { useEffect } from "react";
import { StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "./src/hooks/useTheme";
import { AddAppsScreen } from "./src/screens/AddAppsScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ProAnalyticsScreen } from "./src/screens/ProAnalyticsScreen";
import { QuarantineScreen } from "./src/screens/QuarantineScreen";
import { useAppStore } from "./src/stores/useAppStore";

function App(): React.JSX.Element | null {
	const currentScreen = useAppStore((state) => state.currentScreen);
	const isHydrated = useAppStore((state) => state.isHydrated);
	const hasCompletedOnboarding = useAppStore(
		(state) => state.hasCompletedOnboarding,
	);
	const { colors } = useTheme();

	useEffect(() => {
		if (!hasCompletedOnboarding) return;

		const checkMode = async () => {
			await useAppStore.getState().checkWorkingModeStatus();
		};

		checkMode();
	}, [hasCompletedOnboarding]);

	if (!isHydrated) {
		return null;
	}

	return (
		<SafeAreaView className={`flex-1 ${colors.bgClass}`}>
			<StatusBar
				barStyle={colors.statusBarStyle}
				backgroundColor={colors.statusBarBg}
			/>
			{!hasCompletedOnboarding ? (
				<OnboardingScreen />
			) : currentScreen === "add_apps" ? (
				<AddAppsScreen />
			) : currentScreen === "quarantine" ? (
				<QuarantineScreen />
			) : currentScreen === "pro_analytics" ? (
				<ProAnalyticsScreen />
			) : (
				<HomeScreen />
			)}
		</SafeAreaView>
	);
}

export default App;
