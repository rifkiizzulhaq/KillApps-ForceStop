import type React from "react";
import { useAppStore } from "../../stores/useAppStore";
import { SelectionModal } from "./SelectionModal";

interface Props {
	visible: boolean;
	onClose: () => void;
}

export const AutoKillModal: React.FC<Props> = ({ visible, onClose }) => {
	const settings = useAppStore((state) => state.settings);
	const updateSetting = useAppStore((state) => state.updateSetting);

	return (
		<SelectionModal
			visible={visible}
			title="Auto-Kill Scheduler"
			subtitle="Pilih interval waktu pembersihan latar belakang otomatis:"
			options={[
				{
					id: "0",
					label: "Nonaktif (Matikan)",
					badgeType: "default",
					description: "Tidak melakukan pembersihan berkala.",
				},
				{
					id: "1",
					label: "Setiap 1 Jam",
					badgeType: "cyan",
					description:
						"Membersihkan latar belakang secara otomatis setiap 1 jam sekali.",
				},
				{
					id: "2",
					label: "Setiap 2 Jam",
					badgeType: "cyan",
					description:
						"Membersihkan latar belakang secara otomatis setiap 2 jam sekali.",
				},
				{
					id: "4",
					label: "Setiap 4 Jam",
					badgeType: "emerald",
					description:
						"Membersihkan latar belakang secara otomatis setiap 4 jam sekali (Sangat Disarankan).",
				},
				{
					id: "8",
					label: "Setiap 8 Jam",
					badgeType: "cyan",
					description:
						"Membersihkan latar belakang secara otomatis setiap 8 jam sekali.",
				},
			]}
			selectedId={String(settings?.autoKillScheduler || 0)}
			onSelect={(id) => updateSetting("autoKillScheduler", Number(id))}
			onClose={onClose}
		/>
	);
};
