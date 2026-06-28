import { Check } from "lucide-react-native";
import type React from "react";
import { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";
import { useTheme } from "../hooks/useTheme";

interface ModernToggleProps {
	value: boolean;
	onValueChange: (value: boolean) => void;
	disabled?: boolean;
}

export const ModernToggle: React.FC<ModernToggleProps> = ({
	value,
	onValueChange,
	disabled = false,
}) => {
	const translateX = useRef(new Animated.Value(value ? 22 : 0)).current;
	const { isDark } = useTheme();

	useEffect(() => {
		Animated.spring(translateX, {
			toValue: value ? 22 : 0,
			useNativeDriver: true,
			bounciness: 4,
		}).start();
	}, [value, translateX]);

	return (
		<Pressable
			onPress={() => !disabled && onValueChange(!value)}
			hitSlop={8}
			className={`w-14 h-8 rounded-full p-1 justify-center border ${
				value
					? isDark
						? "bg-white border-white"
						: "bg-black border-black"
					: isDark
						? "bg-zinc-800 border-zinc-700"
						: "bg-zinc-200 border-zinc-300"
			}`}
		>
			<Animated.View
				style={{ transform: [{ translateX }] }}
				className={`w-6 h-6 rounded-full items-center justify-center ${
					value
						? isDark
							? "bg-black"
							: "bg-white"
						: isDark
							? "bg-zinc-400"
							: "bg-zinc-500"
				}`}
			>
				{value && (
					<Check
						size={14}
						color={isDark ? "#ffffff" : "#000000"}
						strokeWidth={3}
					/>
				)}
			</Animated.View>
		</Pressable>
	);
};
