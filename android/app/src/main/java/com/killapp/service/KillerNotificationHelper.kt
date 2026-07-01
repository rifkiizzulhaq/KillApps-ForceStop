package com.killapp.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable

class KillerNotificationHelper(private val context: Context) {

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
                try {
                    rikka.shizuku.Shizuku.pingBinder() && rikka.shizuku.Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED
                } catch (e: Exception) { false }
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
                    "Layanan Latar Belakang",
                    NotificationManager.IMPORTANCE_MIN
                )
                bgChannel.description = "Notifikasi layanan pemantau KillApps"
                notificationManager.createNotificationChannel(bgChannel)

                val actionChannel = NotificationChannel(
                    actionChannelId,
                    "Pintasan Cepat KillApps",
                    NotificationManager.IMPORTANCE_LOW
                )
                actionChannel.description = "Pintasan cepat untuk mematikan aplikasi"
                notificationManager.createNotificationChannel(actionChannel)
            }

            val pm = context.packageManager
            val activeTargets = autoHibernationTargets.filter { pkg ->
                if (postponedPackages.contains(pkg)) return@filter false
                try {
                    val info = pm.getApplicationInfo(pkg, 0)
                    (info.flags and ApplicationInfo.FLAG_STOPPED) == 0
                } catch (e: Exception) {
                    false
                }
            }

            val currentTargetsString = activeTargets.sorted().joinToString(",")
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

            if (activeTargets.isEmpty()) {
                val bgBuilder = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    Notification.Builder(context, bgChannelId)
                } else {
                    Notification.Builder(context)
                }
                bgBuilder.setContentTitle("KillApps Service")
                    .setContentText("Semua aplikasi dalam kondisi bersih & hibernasi")
                    .setSmallIcon(android.R.drawable.ic_lock_power_off)
                    .setContentIntent(piLaunch)
                    .setOngoing(true)
                notificationManager.notify(888, bgBuilder.build())
                return
            }

            val channelToUse = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) actionChannelId else null

            if (activeTargets.size == 1) {
                val pkg = activeTargets.first()
                val appName = try { pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString() } catch (e: Exception) { pkg }
                val builder = if (channelToUse != null) Notification.Builder(context, channelToUse) else Notification.Builder(context)

                val freezeIntent = Intent("com.killapp.ACTION_FREEZE_PKG")
                    .setPackage(context.packageName)
                    .putExtra("pkg", pkg)
                    .putExtra("name", appName)
                val piFreeze = PendingIntent.getBroadcast(
                    context, 8881, freezeIntent,
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
                val piPostpone = PendingIntent.getBroadcast(
                    context, 8882, postponeIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or (if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
                )
                val actionPostpone = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    Notification.Action.Builder(android.graphics.drawable.Icon.createWithResource(context, android.R.drawable.ic_lock_power_off), "Tunda", piPostpone).build()
                } else {
                    Notification.Action(android.R.drawable.ic_lock_power_off, "Tunda", piPostpone)
                }

                builder.setContentTitle("$appName siap di-kill")
                    .setContentText("Ketuk tombol Kill untuk mematikan")
                    .setSmallIcon(android.R.drawable.ic_lock_power_off)
                    .setContentIntent(piLaunch)
                    .addAction(actionPostpone)
                    .addAction(actionFreeze)
                    .setOngoing(true)

                try {
                    val drawable = pm.getApplicationIcon(pkg)
                    val bitmap = if (drawable is BitmapDrawable && drawable.bitmap != null) {
                        drawable.bitmap
                    } else {
                        val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 96
                        val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 96
                        val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                        val canvas = Canvas(bmp)
                        drawable.setBounds(0, 0, canvas.width, canvas.height)
                        drawable.draw(canvas)
                        bmp
                    }
                    builder.setLargeIcon(bitmap)
                } catch (e: Exception) {}

                notificationManager.notify(888, builder.build())
            } else {
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

                val builder = if (channelToUse != null) Notification.Builder(context, channelToUse) else Notification.Builder(context)
                builder.setContentTitle("${activeTargets.size} aplikasi berjalan di latar")
                    .setContentText("Ketuk tombol Kill Semua untuk menghentikan")
                    .setStyle(inboxStyle)
                    .setSmallIcon(android.R.drawable.ic_lock_power_off)
                    .setContentIntent(piLaunch)
                    .addAction(actionKillAll)
                    .setOngoing(true)

                notificationManager.notify(888, builder.build())
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
