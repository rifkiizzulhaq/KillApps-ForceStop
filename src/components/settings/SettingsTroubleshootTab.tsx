import {
	BookOpen,
	HelpCircle,
	Info,
	ShieldCheck,
	Sparkles,
	Zap,
} from "lucide-react-native";
import type React from "react";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { InfoModal } from "../modals/InfoModal";

export const SettingsTroubleshootTab: React.FC = () => {
	const { colors } = useTheme();
	const [infoModal, setInfoModal] = useState<{
		visible: boolean;
		title: string;
		content: string;
	}>({
		visible: false,
		title: "",
		content: "",
	});

	const showGuide = (title: string, content: string) => {
		setInfoModal({ visible: true, title, content });
	};

	return (
		<View className="pb-12">
			<Text
				className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-4`}
			>
				Panduan & Penjelasan Fitur Utama
			</Text>
			<View
				className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-6 p-2 divide-y ${colors.dividerClass}`}
			>
				<Pressable
					onPress={() =>
						showGuide(
							"1. Mode Shizuku vs Root Akses",
							"Pahami perbedaan mode kerja KillApps:\n\n• Mode Shizuku \nMenggunakan jalur resmi Android (ADB) untuk mematikan aplikasi di latar belakang secara kilat tanpa perlu merusak sistem atau menghilangkan garansi ponsel.\n\n• Mode Root Akses:\nDiperuntukkan khusus bagi ponsel yang sudah dimodifikasi (Rooted). Mengeksekusi perintah langsung ke jantung sistem Android (Superuser).",
						)
					}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Mode Shizuku vs Root Akses
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Penjelasan cara kerja eksekusi pembersihan latar belakang.
						</Text>
					</View>
					<ShieldCheck size={18} color={colors.subIconColor} />
				</Pressable>

				<Pressable
					onPress={() =>
						showGuide(
							"2. Smart KillApps & Finer Detection",
							"Jangan khawatir musik mati tiba-tiba!\n\n• Smart KillApps:\nMenganalisis apakah aplikasi sedang melakukan tugas penting sebelum dimatikan.\n\n• Finer Detection (Media Playback):\nSecara otomatis mengenali dan melewati pemutar musik (seperti Spotify, YouTube Music) atau navigasi Maps yang sedang berjalan agar suara tidak terpotong.",
						)
					}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Smart KillApps & Finer Detection
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Perlindungan pemutar musik & aplikasi yang sedang bertugas.
						</Text>
					</View>
					<Sparkles size={18} color={colors.subIconColor} />
				</Pressable>

				<Pressable
					onPress={() =>
						showGuide(
							"3. KillApps Dangkal vs Mendalam",
							"Dua tingkat penghentian aplikasi:\n\n• KillApps Dangkal (Shallow):\nMembekukan sementara aktivitas aplikasi (seperti menaruhnya di kulkas). Aplikasi tidak memakan baterai, namun bisa dibuka kembali dengan sekejap.\n\n• KillApps Mendalam (Force Stop):\nMenutup paksa total seluruh sistem aplikasi dari memori sampai Anda membukanya kembali secara manual.",
						)
					}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							KillApps Dangkal vs Mendalam
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Perbedaan membekukan sementara vs menutup paksa total.
						</Text>
					</View>
					<BookOpen size={18} color={colors.subIconColor} />
				</Pressable>

				<Pressable
					onPress={() =>
						showGuide(
							"4. Otomatisasi & Pengecualian Baterai",
							"Biar HP membersihkan dirinya sendiri saat tidur!\n\n• Otomatis KillApps:\nSistem otomatis menyapu bersih aplikasi di latar belakang sesaat setelah Anda mematikan layar dan mengunci ponsel.\n\n• Abaikan Optimasi Baterai:\nWajib diaktifkan agar sistem Android tidak menahan atau mematikan timer otomatis KillApps saat layar ponsel padam.",
						)
					}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Otomatisasi & Pengecualian
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Panduan penghentian otomatis saat layar ponsel dimatikan.
						</Text>
					</View>
					<Info size={18} color={colors.subIconColor} />
				</Pressable>

				<Pressable
					onPress={() =>
						showGuide(
							"5. Fitur Ekstrem",
							"Fitur intervensi sistem tingkat lanjut untuk penghematan daya & RAM agresif:\n\n1. Aggressive Doze Mode:\nMemaksa HP langsung masuk mode tidur hemat daya mendalam detik itu juga saat layar mati.\n\n2. GCM Push Wake-up Bypass:\nMencegah notifikasi promo e-commerce (Shopee/Tokopedia/IG) membangunkan kembali aplikasi yang sudah dibunuh.\n\n3. Deep Trim Memory:\nMenyapu bersih sisa sampah cache di RAM hingga akar, membuat RAM melonjak lega dan anti-lemot.",
						)
					}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Fitur Ekstrem
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Penjelasan Aggressive Doze, GCM Bypass, & Deep Trim RAM.
						</Text>
					</View>
					<Zap size={18} color={colors.subIconColor} />
				</Pressable>

				<Pressable
					onPress={() =>
						showGuide(
							"Panduan Memilih Aplikasi & Apa itu GCM?",
							"Tips memilih aplikasi untuk dimasukkan ke daftar utama KillApps:\n\n• Sangat Disarankan:\nAplikasi media sosial (TikTok, IG, FB), game, e-commerce (Shopee, Tokopedia), dan browser yang sering berjalan di latar belakang serta boros baterai/RAM.\n\n• Jangan Dimasukkan:\nAplikasi perpesanan utama (WhatsApp, Telegram) jika Anda tidak ingin terlambat menerima pesan atau telepon darurat, serta pemutar musik & alarm.\n\n• Apa itu GCM (Google Cloud Messaging)?\nGCM adalah layanan pengirim pesan/notifikasi latar belakang dari Google. Aplikasi e-commerce sering memakai GCM untuk diam-diam menghidupkan diri di latar belakang saat mengirim promo. Dengan memilih aplikasi masuk ke KillApps dan mengaktifkan GCM Bypass, kebangkitan diam-diam tersebut akan diblokir.",
						)
					}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Cara Memilih Aplikasi & Apa itu GCM?
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Panduan memilih aplikasi dan fungsi penangkal GCM.
						</Text>
					</View>
					<Info size={18} color={colors.subIconColor} />
				</Pressable>
			</View>

			<Text
				className={`${colors.captionClass} font-black text-[11px] tracking-wider uppercase mb-2 mt-2`}
			>
				Solusi Kendala & Troubleshooting
			</Text>
			<View
				className={`${colors.cardClass} border ${colors.cardBorderClass} rounded-2xl mb-6 p-2 divide-y ${colors.dividerClass}`}
			>
				<Pressable
					onPress={() =>
						showGuide(
							"Solusi: Aplikasi Tetap Hidup Kembali",
							"Jika aplikasi tertentu sering hidup kembali setelah di-Kill:\n\n1. Aktifkan fitur 'GCM Push Wake-up Bypass' di Fitur Utama (Seksi 7).\n2. Aktifkan 'Wake-up Tracking and Cut-off' di Seksi 4.\n3. Periksa pengaturan auto-start bawaan ponsel (seperti Security/Phone Manager di MIUI/ColorOS) dan matikan izin autostart aplikasi tersebut.",
						)
					}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Mengapa Aplikasi Hidup Sendiri?
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Solusi menangkal aplikasi bandel yang suka terbangun lagi.
						</Text>
					</View>
					<HelpCircle size={18} color={colors.subIconColor} />
				</Pressable>
			</View>

			<InfoModal
				visible={infoModal.visible}
				title={infoModal.title}
				content={infoModal.content}
				onClose={() => setInfoModal((prev) => ({ ...prev, visible: false }))}
			/>
		</View>
	);
};
