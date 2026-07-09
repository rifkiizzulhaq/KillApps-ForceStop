import type React from "react";
import { InfoModal } from "./InfoModal";

interface Props {
	visible: boolean;
	onClose: () => void;
}

export const BatteryOptimizationModal: React.FC<Props> = ({
	visible,
	onClose,
}) => {
	return (
		<InfoModal
			visible={visible}
			title="Sudah Diizinkan"
			content="Aplikasi KillApps saat ini sudah diizinkan oleh sistem Android berjalan tanpa batasan baterai."
			onClose={onClose}
		/>
	);
};
