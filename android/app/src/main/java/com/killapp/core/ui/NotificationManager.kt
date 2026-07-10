package com.killapp.core.ui

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import com.killapp.utils.AppIconLoader
import com.killapp.utils.AppListFetcher
import com.killapp.core.execution.ProcessKiller
import com.killapp.core.execution.ProtectionFilter
import com.killapp.core.command.CommandExecutor

class NotificationManager(private val context: Context) {

    companion object {
        private val activeNotifIds = mutableSetOf<Int>()
        private var lastActiveTargetsString: String = "-1"
        private var lastEnabledState: Boolean? = null
    }

    fun cancelAllNotifications() {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        for (id in activeNotifIds) {
            nm.cancel(id)
        }
        activeNotifIds.clear()
        nm.cancel(888)
        nm.cancel(999)
        lastActiveTargetsString = "-1"
        lastEnabledState = false
    }

    fun cancelPackageNotification(pkg: String) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        try {
            nm.cancel(Math.abs(pkg.hashCode()) + 1000)
        } catch (e: Exception) {}
    }

    fun updateDisplay(
        quickActionNotifEnabled: Boolean,
        autoHibernationTargets: Set<String>,
        postponedPackages: Set<String>,
        force: Boolean = true
    ) {
        try {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
            val mode = prefs.getString("workingMode", "shizuku") ?: "shizuku"
            val isModeAlive = if (mode == "root") {
                prefs.getBoolean("isRootActive", false)
            } else {
                CommandExecutor.isShizukuReady()
            }

            if (!quickActionNotifEnabled || !isModeAlive) {
                if (lastEnabledState != false || force) {
                    for (id in activeNotifIds) {
                        notificationManager.cancel(id)
                    }
                    activeNotifIds.clear()
                    notificationManager.cancel(888)
                    notificationManager.cancel(999)
                    lastActiveTargetsString = "-1"
                    lastEnabledState = false
                }
                return
            }
            lastEnabledState = true

            val bgChannelId = "killapp_bg_service"
            val actionChannelId = "killapp_quick_action"

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                val bgChannel = NotificationChannel(
                    bgChannelId,
                    "Status Layanan Latar Belakang",
                    NotificationManager.IMPORTANCE_MIN
                )
                bgChannel.description = "Menampilkan status layanan latar belakang KillApps"
                bgChannel.setShowBadge(false)
                notificationManager.createNotificationChannel(bgChannel)

                val actionChannel = NotificationChannel(
                    actionChannelId,
                    "Pintasan Cepat Pembunuhan Aplikasi",
                    NotificationManager.IMPORTANCE_LOW
                )
                actionChannel.description = "Pintasan cepat untuk mematikan aplikasi"
                actionChannel.setShowBadge(false)
                notificationManager.createNotificationChannel(actionChannel)
            }

            val pm = context.packageManager
            val finerMedia = prefs.getBoolean("finerMediaDetection", false)
            val smart = prefs.getBoolean("smartHibernation", true)
            val activeMediaPkgs = ProtectionFilter.getActiveMediaPackages(context)

            val activeTargets = autoHibernationTargets.filter { pkg ->
                if (postponedPackages.contains(pkg)) return@filter false
                val isMediaApp = ProtectionFilter.isMediaOrAudioApp(context, pkg)
                if (ProtectionFilter.isMediaActiveProtected(context, pkg, finerMedia, activeMediaPkgs)) return@filter false
                if (ProtectionFilter.isSmartProtected(context, pkg, smart)) return@filter false
                try {
                    val info = pm.getApplicationInfo(pkg, 0)
                    (info.flags and ApplicationInfo.FLAG_STOPPED) == 0
                } catch (e: Exception) {
                    false
                }
            }

            val postponedRunning = autoHibernationTargets.filter { pkg ->
                if (!postponedPackages.contains(pkg)) return@filter false
                try {
                    val info = pm.getApplicationInfo(pkg, 0)
                    (info.flags and ApplicationInfo.FLAG_STOPPED) == 0
                } catch (e: Exception) {
                    false
                }
            }

            val currentTargetsString = activeTargets.sorted().joinToString(",") + "|" + postponedRunning.sorted().joinToString(",")
            if (!force && currentTargetsString == lastActiveTargetsString) {
                return
            }
            lastActiveTargetsString = currentTargetsString

            notificationManager.cancel(999)
            for (oldId in activeNotifIds) {
                notificationManager.cancel(oldId)
            }
            activeNotifIds.clear()

            val launchIntent = pm.getLaunchIntentForPackage(context.packageName)
            val piLaunch = PendingIntent.getActivity(
                context, 888, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or (if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            )

            val bgBuilder = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                Notification.Builder(context, bgChannelId)
            } else {
                Notification.Builder(context)
            }
            val postponedNames = postponedRunning.map { pkg ->
                try { pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString() } catch (e: Exception) { pkg }
            }
            val title = if (postponedNames.isNotEmpty()) "${postponedNames.size} aplikasi ditunda Kill Appsnya" else "KillApps Service"
            val text = if (postponedNames.isNotEmpty()) "${postponedNames.joinToString(", ")} (dilewati saat layar padam)" else if (activeTargets.isEmpty()) "Semua aplikasi dalam kondisi bersih" else "Layanan pemantauan latar belakang aktif"
            bgBuilder.setContentTitle(title)
                .setContentText(text)
                .setSmallIcon(android.R.drawable.ic_lock_power_off)
                .setContentIntent(piLaunch)
                .setOngoing(true)
            notificationManager.notify(888, bgBuilder.build())
            if (activeTargets.isEmpty()) {
                return
            }

            val channelToUse = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) actionChannelId else null
            val groupKey = "killapp_quick_group"

            for (pkg in activeTargets) {
                val appName = try { pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString() } catch (e: Exception) { pkg }
                val childId = (pkg.hashCode() and 0x7FFFFFFF) + 1000
                activeNotifIds.add(childId)

                val freezeIntent = Intent("com.killapp.ACTION_FREEZE_PKG")
                    .setPackage(context.packageName)
                    .putExtra("pkg", pkg)
                    .putExtra("name", appName)
                val piFreeze = PendingIntent.getBroadcast(
                    context, childId, freezeIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or (if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
                )
                val actionFreeze = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    Notification.Action.Builder(android.graphics.drawable.Icon.createWithResource(context, android.R.drawable.ic_media_pause), "Kill", piFreeze).build()
                } else {
                    Notification.Action(android.R.drawable.ic_media_pause, "Kill", piFreeze)
                }

                val postponeIntent = Intent("com.killapp.ACTION_POSTPONE_PKG")
                    .setPackage(context.packageName)
                    .putExtra("pkg", pkg)
                    .putExtra("name", appName)
                val piPostpone = PendingIntent.getBroadcast(
                    context, childId + 1, postponeIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or (if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
                )
                val actionPostpone = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    Notification.Action.Builder(android.graphics.drawable.Icon.createWithResource(context, android.R.drawable.ic_lock_power_off), "Tunda", piPostpone).build()
                } else {
                    Notification.Action(android.R.drawable.ic_lock_power_off, "Tunda", piPostpone)
                }

                val childBuilder = if (channelToUse != null) Notification.Builder(context, channelToUse) else Notification.Builder(context)
                childBuilder.setContentTitle(appName)
                    .setContentText("Menunggu untuk di-kill")
                    .setSubText("lebih banyak aksi")
                    .setSmallIcon(android.R.drawable.ic_lock_power_off)
                    .setContentIntent(piFreeze)
                    .addAction(actionPostpone)
                    .addAction(actionFreeze)
                    .setOngoing(true)
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N && activeTargets.size >= 2) {
                    childBuilder.setGroup(groupKey)
                }
                try {
                    val drawable = pm.getApplicationIcon(pkg)
                    val bitmap = AppIconLoader.drawableToBitmap(drawable, 96, 96)
                    childBuilder.setLargeIcon(bitmap)
                } catch (e: Exception) {}

                notificationManager.notify(childId, childBuilder.build())
            }

            if (activeTargets.size >= 2) {
                val freezeAllIntent = Intent("com.killapp.ACTION_FREEZE_ALL").setPackage(context.packageName)
                val piAll = PendingIntent.getBroadcast(
                    context, 8883, freezeAllIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or (if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
                )
                val actionKillAll = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    Notification.Action.Builder(android.graphics.drawable.Icon.createWithResource(context, android.R.drawable.ic_media_pause), "Kill Semua", piAll).build()
                } else {
                    Notification.Action(android.R.drawable.ic_media_pause, "Kill Semua", piAll)
                }

                val appNames = activeTargets.map { pkg ->
                    try { pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString() } catch (e: Exception) { pkg }
                }
                val inboxStyle = Notification.InboxStyle()
                for (name in appNames.take(6)) {
                    inboxStyle.addLine("• $name")
                }
                if (appNames.size > 6) {
                    inboxStyle.setSummaryText("+${appNames.size - 6} aplikasi lainnya")
                }

                val summaryBuilder = if (channelToUse != null) Notification.Builder(context, channelToUse) else Notification.Builder(context)
                summaryBuilder.setContentTitle("${activeTargets.size} aplikasi berjalan di latar")
                    .setContentText("Ketuk untuk mematikan semua")
                    .setSubText("klik di bawah untuk di kill")
                    .setStyle(inboxStyle)
                    .setSmallIcon(android.R.drawable.ic_lock_power_off)
                    .setContentIntent(piAll)
                    .addAction(actionKillAll)
                    .setOngoing(true)
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                    summaryBuilder.setGroup(groupKey).setGroupSummary(true)
                }
                notificationManager.notify(999, summaryBuilder.build())
            }
        } catch (e: Exception) {}
    }

    fun buildServiceNotification(): Notification {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val bgChannelId = "killapp_bg_service"
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val bgChannel = NotificationChannel(
                bgChannelId,
                "Layanan Latar Belakang",
                NotificationManager.IMPORTANCE_MIN
            )
            bgChannel.description = "Notifikasi layanan pemantau KillApps"
            bgChannel.setShowBadge(false)
            notificationManager.createNotificationChannel(bgChannel)
        }
        val pm = context.packageManager
        val launchIntent = pm.getLaunchIntentForPackage(context.packageName)
        val piLaunch = PendingIntent.getActivity(
            context, 888, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )
        val bgBuilder = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            Notification.Builder(context, bgChannelId)
        } else {
            Notification.Builder(context)
        }
        bgBuilder.setContentTitle("KillApps Service")
            .setContentText("Layanan pemantauan latar belakang aktif")
            .setSmallIcon(android.R.drawable.ic_lock_power_off)
            .setContentIntent(piLaunch)
            .setOngoing(true)
        return bgBuilder.build()
    }
}

