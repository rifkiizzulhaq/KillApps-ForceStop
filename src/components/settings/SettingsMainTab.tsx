import type React from "react";
import { View } from "react-native";
import { SettingsBasicTab } from "./SettingsBasicTab";
import { SettingsProSuiteTab } from "./SettingsProSuiteTab";

export const SettingsMainTab: React.FC = () => {
	return (
		<View className="pb-12">
			<SettingsBasicTab />
			<SettingsProSuiteTab />
		</View>
	);
};
