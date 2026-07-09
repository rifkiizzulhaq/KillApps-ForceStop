import type React from "react";
import { useState } from "react";
import { useAppStore } from "../../stores/useAppStore";
import { InfoModal } from "./InfoModal";
import { SelectionModal } from "./SelectionModal";

interface Props {
	visible: boolean;
	onClose: () => void;
}

export const WorkingModeModal: React.FC<Props> = ({ visible, onClose }) => {
	const settings = useAppStore((state) => state.settings);
	const updateSetting = useAppStore((state) => state.updateSetting);

	const [rootInfoModal, setRootInfoModal] = useState(false);
	const [shizukuInfoModal, setShizukuInfoModal] = useState(false);

	return (
		<>
			<SelectionModal
				visible={visible}
				title="Pilih Mode Bekerja"
				subtitle="Tentukan metode eksekusi untuk mematikan aplikasi di latar belakang:"
				options={[
					{
						id: "shizuku",
						label: "Shizuku",
						badgeType: "emerald",
						description:
							"Akses nirkabel berkecepatan tinggi via ADB tanpa perlu root. Sangat stabil dan aman.",
					},
					{
						id: "root",
						label: "Root Akses",
						badgeType: "amber",
						description:
							"Eksekusi langsung ke kernel sistem daya tinggi. Membutuhkan perizinan Magisk atau KernelSU.",
					},
				]}
				selectedId={settings?.workingMode}
				onSelect={async (id) => {
					updateSetting("workingMode", id as "shizuku" | "root");
					if (id === "root") {
						const isRoot = await useAppStore
							.getState()
							.checkWorkingModeStatus();
						if (!isRoot) {
							setRootInfoModal(true);
						}
					} else {
						await useAppStore.getState().checkWorkingModeStatus();
						const state = useAppStore.getState();
						if (state.isShizukuActive && !state.isPermissionGranted) {
							setTimeout(async () => {
								await useAppStore.getState().requestShizukuPermission();
								const newState = useAppStore.getState();
								if (!newState.isPermissionGranted) {
									setShizukuInfoModal(true);
								}
							}, 400);
						}
					}
				}}
				onClose={onClose}
			/>

			<InfoModal
				visible={rootInfoModal}
				title="Informasi Mode Root"
				content="Pastikan perangkat Anda sudah di-root menggunakan Magisk atau KernelSU. Berikan izin Superuser (Grant) saat diminta oleh pop-up sistem agar fitur eksekusi cepat ini bekerja optimal tanpa hambatan."
				onClose={() => setRootInfoModal(false)}
			/>

			<InfoModal
				visible={shizukuInfoModal}
				title="Izin Shizuku Ditolak"
				content="Anda telah menolak atau belum memberikan izin akses Shizuku ke aplikasi ini. Eksekusi latar belakang tidak akan berjalan."
				onClose={() => setShizukuInfoModal(false)}
			/>
		</>
	);
};
