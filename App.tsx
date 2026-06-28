import type React from "react";
import { StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HomeScreen } from "./src/screens/HomeScreen";

function App(): React.JSX.Element {
	return (
		<SafeAreaView className="flex-1 bg-slate-950">
			<StatusBar barStyle="light-content" backgroundColor="#020617" />
			<HomeScreen />
		</SafeAreaView>
	);
}

export default App;
