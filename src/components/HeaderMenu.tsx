import { Check, MoreVertical } from "lucide-react-native";
import type React from "react";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useTheme } from "../hooks/useTheme";

export interface MenuOption {
	label: string;
	onPress: () => void;
	active?: boolean;
}

interface Props {
	options: MenuOption[];
}

export const HeaderMenu: React.FC<Props> = ({ options }) => {
	const [visible, setVisible] = useState(false);
	const { colors, isDark } = useTheme();

	return (
		<View>
			<Pressable
				onPress={() => setVisible(true)}
				className={`w-10 h-10 items-center justify-center rounded-full ${colors.secondaryBtnClass}`}
			>
				<MoreVertical size={22} color={colors.iconColor} />
			</Pressable>

			<Modal
				visible={visible}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setVisible(false)}
			>
				<Pressable
					onPress={() => setVisible(false)}
					className="flex-1 bg-black/40 justify-start items-end pt-14 pr-4"
				>
					<View
						className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl w-64 overflow-hidden`}
					>
						{options.map((opt, idx) => (
							<Pressable
								key={opt.label}
								onPress={() => {
									setVisible(false);
									opt.onPress();
								}}
								className={`p-4 flex-row items-center justify-between active:opacity-70 ${
									idx < options.length - 1
										? `border-b ${colors.borderClass}`
										: ""
								}`}
							>
								<Text
									className={`font-semibold text-sm flex-1 mr-3 ${
										opt.active
											? `${colors.textClass} font-black`
											: colors.subTextClass
									}`}
								>
									{opt.label}
								</Text>
								{opt.active !== undefined && (
									<View
										className={`w-5 h-5 rounded border items-center justify-center ${
											opt.active
												? `${colors.primaryBtnClass} ${isDark ? "border-white" : "border-black"}`
												: `${colors.borderClass} ${colors.inputBgClass}`
										}`}
									>
										{opt.active && (
											<Check
												size={14}
												color={
													colors.primaryBtnTextClass === "text-black"
														? "#000000"
														: "#ffffff"
												}
												strokeWidth={3}
											/>
										)}
									</View>
								)}
							</Pressable>
						))}
					</View>
				</Pressable>
			</Modal>
		</View>
	);
};
