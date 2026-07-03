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
							"Pahami perbedaan mode kerja KillApps:\n\n• Mode Shizuku:\nMenggunakan jalur resmi Android (ADB) untuk mematikan aplikasi di latar belakang secara kilat tanpa perlu merusak sistem atau menghilangkan garansi ponsel.\n\n• Mode Root Akses:\nDiperuntukkan khusus bagi ponsel yang sudah dimodifikasi (Rooted). Mengeksekusi perintah langsung ke jantung sistem Android dengan hak akses tertinggi (Superuser).",
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
							"Bebas mendengarkan musik dan navigasi tanpa takut terputus!\n\n• Smart KillApps:\nMenganalisis apakah aplikasi sedang melakukan tugas penting (panggilan aktif, sinkronisasi file, input keyboard) sebelum dimatikan.\n\n• Finer Detection (Media Playback):\nSecara otomatis mengenali dan mengecualikan pemutar musik aktif (Spotify, YouTube Music, dll) serta navigasi Maps agar tidak terhenti secara tiba-tiba.",
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
							"3. Hibernasi & Don't Remove Notification",
							"Pilih tingkat pembekuan aplikasi yang Anda inginkan:\n\n• Hibernasi Dangkal (Shallow):\nMembekukan sementara aktivitas aplikasi latar belakang. Baterai awet, namun aplikasi tetap bisa dibuka kembali dalam sekejap.\n\n• Hibernasi Mendalam (Force Stop):\nMenutup paksa seluruh sistem aplikasi dari memori. Aplikasi tidak akan berjalan lagi sampai Anda membukanya kembali secara manual.\n\n• Don't Remove Notification:\nMenjaga notifikasi penting tetap tampil di panel notifikasi atas meskipun aplikasi tersebut telah dibekukan.",
						)
					}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Hibernasi & Don&apos;t Remove Notification
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Perbedaan kedalaman pembersihan serta perlindungan notifikasi.
						</Text>
					</View>
					<BookOpen size={18} color={colors.subIconColor} />
				</Pressable>

				<Pressable
					onPress={() =>
						showGuide(
							"4. Otomatisasi & Ignore Background Free",
							"Biarkan ponsel membersihkan dirinya secara otomatis:\n\n• Otomatis KillApps:\nSecara berkala atau sesaat setelah layar ponsel padam, sistem akan membersihkan aplikasi latar belakang.\n\n• Abaikan Optimasi Baterai:\nWajib diaktifkan agar Android tidak mematikan service background KillApps saat ponsel tertidur.\n\n• Ignore Background Free:\nMencegah pemrosesan berulang terhadap aplikasi yang memang sudah terhenti/bebas dari aktivitas background. Menghemat baterai dan mempercepat durasi pembersihan.",
						)
					}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Otomatisasi &amp; Ignore Background Free
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Panduan pembersihan otomatis dan optimalisasi daya pemrosesan.
						</Text>
					</View>
					<Info size={18} color={colors.subIconColor} />
				</Pressable>

				<Pressable
					onPress={() =>
						showGuide(
							"5. Fitur Ekstrem (Geek & Pro)",
							"Fitur tingkat lanjut untuk kontrol daya dan memori tingkat lanjut:\n\n• Aggressive Doze Mode:\nMemaksa ponsel langsung masuk mode hemat baterai mendalam (deep doze) sesaat setelah layar mati.\n\n• GCM Push Wake-up Bypass:\nMencegah aplikasi e-commerce/sosmed terbangun akibat sinyal push promo dari server Google Cloud.\n\n• Wake-up Tracking & Cut-off:\nMelacak dan mematikan izin WAKE_LOCK agar aplikasi tidak bisa diam-diam memicu CPU berjalan di latar belakang.\n\n• PhantomSlayer (Android 12+):\nMelacak dan membatasi 'proses hantu' tersembunyi yang berjalan di luar pengawasan standar Android.\n\n• Deep Trim Memory:\nMembersihkan sisa cache RAM secara agresif hingga akar sistem.",
						)
					}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Fitur Ekstrem (Geek &amp; Pro)
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Penjelasan Aggressive Doze, GCM Bypass, Wake-up, PhantomSlayer,
							&amp; RAM Trim.
						</Text>
					</View>
					<Zap size={18} color={colors.subIconColor} />
				</Pressable>

				<Pressable
					onPress={() =>
						showGuide(
							"6. KillApps Pro Suite (Eksklusif)",
							"Fitur premium untuk optimasi maksimal dan otomatisasi cerdas:\n\n• Deep Freeze Vault (Karantina):\nMembekukan aplikasi sepenuhnya hingga seolah 'dihapus' sementara dari ponsel. Aplikasi tidak berjalan atau memakan RAM sama sekali sampai Anda membukanya kembali dari Vault.\n\n• Live Impact & Forensik:\nDasbor analitik untuk melihat penghematan RAM nyata dan melacak daftar aplikasi paling bandel yang paling sering mencoba aktif sendiri.\n\n• Bedtime Zero-Drain Shield:\nOtomatis mematikan aplikasi hanya selama jam tidur Anda agar daya baterai tidak berkurang sama sekali semalaman.\n\n• Emergency Smart Triggers:\nPembersihan latar belakang otomatis jika baterai kritis (< 20%) atau suhu HP melampaui batas panas (> 40°C).\n\n• RAM Crunch Auto-Slayer:\nOtomatis membunuh aplikasi latar belakang ketika kapasitas RAM tersisa anjlok di bawah 15% agar sistem tetap responsif.\n\n• Auto-Kill Scheduler:\nPenjadwalan otomatis berkala untuk membersihkan HP setiap 1, 2, 4, atau 8 jam sekali.",
						)
					}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							KillApps Pro Suite (Eksklusif)
						</Text>
						<Text className={`${colors.subTextClass} text-[11px] mt-0.5`}>
							Panduan Karantina Vault, Dasbor Forensik, Trigger Darurat, &amp;
							Scheduler.
						</Text>
					</View>
					<Sparkles size={18} color={colors.subIconColor} />
				</Pressable>

				<Pressable
					onPress={() =>
						showGuide(
							"Panduan Memilih Aplikasi & Apa itu GCM?",
							"Tips memilih aplikasi untuk dimasukkan ke daftar utama KillApps:\n\n• Sangat Disarankan:\nAplikasi media sosial (TikTok, IG, FB), game, e-commerce (Shopee, Tokopedia), dan browser yang sering berjalan di latar belakang serta boros baterai/RAM.\n\n• Jangan Dimasukkan:\nAplikasi perpesanan utama (WhatsApp, Telegram) jika Anda tidak ingin terlambat menerima pesan atau telepon darurat, serta pemutar musik & alarm.\n\n• Apa itu GCM (Google Cloud Messaging)?\nGCM adalah layanan pengirim pesan/notifikasi latar belakang dari Google. Aplikasi e-commerce sering memakai GCM untuk diam-diam menghidupkan diri di latar belakang saat mengirim promo. Dengan memilih aplikasi masuk ke KillApps dan mengaktifkan GCM Bypass, kebangkitan diam-diam tersebut akan diblokir.\n\nCatatan Penting: Jika Don't Remove Notification dan Wake-up Tracking aktif bersamaan, push notif GCM tetap diizinkan masuk, tetapi seluruh aktivitas background lainnya tetap diblokir demi privasi dan performa.",
						)
					}
					className="p-3.5 flex-row items-center justify-between active:opacity-70 rounded-xl"
				>
					<View className="flex-1 pr-3">
						<Text className={`${colors.textClass} font-bold text-sm`}>
							Cara Memilih Aplikasi &amp; Apa itu GCM?
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
