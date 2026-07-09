import { Layers } from "lucide-react-native";
import type React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export const HomeEmptyState: React.FC = () => {
	const { colors } = useTheme();

	return (
		<View className="flex-1 items-center justify-center px-8">
			<View
				className={`w-24 h-24 rounded-full ${colors.cardClass} border ${colors.cardBorderClass} items-center justify-center mb-6`}
			>
				<Layers size={40} color={colors.iconColor} />
			</View>
			<Text
				testID="empty-state-text"
				className={`${colors.textClass} font-bold text-xl mb-2 text-center`}
			>
				Selamat Datang di KillApps
			</Text>
			<Text
				className={`${colors.subTextClass} text-center text-sm leading-6 mb-8`}
			>
				Belum ada aplikasi yang ditambahkan ke daftar KillApps. Tekan tombol +
				di bawah untuk memilih aplikasi latar belakang yang ingin dimatikan
				otomatis.
			</Text>
		</View>
	);
};
