import type React from "react";
import { useEffect } from "react";
import { AppState, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "./src/hooks/useTheme";
import { AddAppsScreen } from "./src/screens/AddAppsScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
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

		const checkMode = () => {
			const mode = useAppStore.getState().settings.workingMode;
			if (mode === "root") {
				useAppStore.getState().checkRootStatus();
			} else {
				useAppStore.getState().checkShizukuStatus();
			}
		};

		checkMode();
		const interval = setInterval(() => {
			if (useAppStore.getState().currentScreen !== "add_apps") {
				checkMode();
			}
		}, 3000);

		const sub = AppState.addEventListener("change", (nextState) => {
			if (nextState === "active") {
				checkMode();
			}
		});

		return () => {
			clearInterval(interval);
			sub.remove();
		};
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
			) : (
				<HomeScreen />
			)}
		</SafeAreaView>
	);
}

export default App;
