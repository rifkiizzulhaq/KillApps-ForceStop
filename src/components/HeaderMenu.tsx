import type React from "react";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

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

	return (
		<View>
			<Pressable
				onPress={() => setVisible(true)}
				className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-800"
			>
				<Text className="text-white font-bold text-xl">⋮</Text>
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
					<View className="bg-slate-900 border border-slate-800 rounded-2xl w-56 overflow-hidden shadow-2xl">
						{options.map((opt, idx) => (
							<Pressable
								key={opt.label}
								onPress={() => {
									setVisible(false);
									opt.onPress();
								}}
								className={`p-4 flex-row items-center justify-between active:bg-slate-800 ${
									idx < options.length - 1 ? "border-b border-slate-800/60" : ""
								}`}
							>
								<Text
									className={`font-semibold text-sm ${
										opt.active ? "text-emerald-400" : "text-slate-200"
									}`}
								>
									{opt.label}
								</Text>
								{opt.active && (
									<Text className="text-emerald-400 font-bold">✓</Text>
								)}
							</Pressable>
						))}
					</View>
				</Pressable>
			</Modal>
		</View>
	);
};
