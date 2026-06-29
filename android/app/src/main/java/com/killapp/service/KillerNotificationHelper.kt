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

    private val activeNotifIds = mutableSetOf<Int>()
    private var lastActiveTargetsString: String = ""
    private var isBgServiceNotifShown = false

    fun cancelAllNotifications() {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        for (id in activeNotifIds) {
            nm.cancel(id)
        }
        activeNotifIds.clear()
        nm.cancel(999)
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
            if (!quickActionNotifEnabled) {
                isBgServiceNotifShown = false
                for (id in activeNotifIds) {
                    notificationManager.cancel(id)
                }
                activeNotifIds.clear()
                notificationManager.cancel(999)
                notificationManager.cancel(888)
                return
            }
            val channelId = "killapp_quick_action"
            val bgChannelId = "killapp_bg_service"
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    channelId,
                    "Notifikasi KillApps",
                    NotificationManager.IMPORTANCE_LOW
                )
                channel.description = "Pintasan cepat KillApps"
                notificationManager.createNotificationChannel(channel)

                val bgChannel = NotificationChannel(
                    bgChannelId,
                    "Layanan Latar Belakang",
                    NotificationManager.IMPORTANCE_MIN
                )
                bgChannel.description = "Notifikasi layanan pemantau KillApps"
                notificationManager.createNotificationChannel(bgChannel)
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
            val shouldUpdateBg = force || currentTargetsString != lastActiveTargetsString || !isBgServiceNotifShown

            if (shouldUpdateBg) {
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
                notificationManager.notify(888, bgBuilder.build())
                isBgServiceNotifShown = true
            }

            if (!force && currentTargetsString == lastActiveTargetsString && isBgServiceNotifShown) {
                return
            }
            lastActiveTargetsString = currentTargetsString

            if (activeTargets.isEmpty()) {
                notificationManager.cancel(999)
                for (oldId in activeNotifIds) {
                    notificationManager.cancel(oldId)
                }
                activeNotifIds.clear()
                return
            }

            val newNotifIds = mutableSetOf<Int>()
            for (pkg in activeTargets) {
                newNotifIds.add(Math.abs(pkg.hashCode()) + 1000)
            }
            if (activeTargets.size > 1) {
                newNotifIds.add(999)
            }

            for (oldId in activeNotifIds) {
                if (!newNotifIds.contains(oldId)) {
                    notificationManager.cancel(oldId)
                }
            }
            activeNotifIds.clear()
            activeNotifIds.addAll(newNotifIds)

            if (activeTargets.size == 1) {
                notificationManager.cancel(999)
                val pkg = activeTargets.first()
                notifyChildApp(pkg, notificationManager, pm, channelId, null)
            } else {
                val groupKey = "com.killapp.ACTION_GROUP"
                for (pkg in activeTargets) {
                    notifyChildApp(pkg, notificationManager, pm, channelId, groupKey)
                }

                val appNames = activeTargets.map { pkg ->
                    try { pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString() } catch (e: Exception) { pkg }
                }

                val inboxStyle = Notification.InboxStyle()
                for (name in appNames) {
                    inboxStyle.addLine("$name siap di-kill")
                }

                val summaryBuilder = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    Notification.Builder(context, channelId)
                } else {
                    Notification.Builder(context)
                }

                val freezeAllIntent = Intent("com.killapp.ACTION_FREEZE_ALL").setPackage(context.packageName)
                val piAll = PendingIntent.getBroadcast(
                    context, 100, freezeAllIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or (if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
                )

                summaryBuilder.setContentTitle("${activeTargets.size} aplikasi siap di-kill")
                    .setContentText("Ketuk di bawah untuk kill semua")
                    .setSubText("Ketuk untuk kill semua")
                    .setStyle(inboxStyle)
                    .setSmallIcon(android.R.drawable.ic_lock_power_off)
                    .setContentIntent(piAll)
                    .setGroup(groupKey)
                    .setGroupSummary(true)
                    .setAutoCancel(true)
                    .setOngoing(false)

                notificationManager.notify(999, summaryBuilder.build())
            }
        } catch (e: Exception) {}
    }

    private fun notifyChildApp(pkg: String, notificationManager: NotificationManager, pm: PackageManager, channelId: String, groupKey: String?) {
        val notifId = Math.abs(pkg.hashCode()) + 1000
        val appName = try { pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString() } catch (e: Exception) { pkg }

        val freezeIntent = Intent("com.killapp.ACTION_FREEZE_PKG")
            .setPackage(context.packageName)
            .putExtra("pkg", pkg)
            .putExtra("name", appName)
        val piFreeze = PendingIntent.getBroadcast(
            context, notifId * 10 + 1, freezeIntent,
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
            context, notifId * 10 + 2, postponeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )
        val actionPostpone = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            Notification.Action.Builder(android.graphics.drawable.Icon.createWithResource(context, android.R.drawable.ic_lock_power_off), "Tunda", piPostpone).build()
        } else {
            Notification.Action(android.R.drawable.ic_lock_power_off, "Tunda", piPostpone)
        }

        val childBuilder = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            Notification.Builder(context, channelId)
        } else {
            Notification.Builder(context)
        }

        childBuilder.setContentTitle(appName)
            .setContentText("siap di-kill")
            .setSmallIcon(android.R.drawable.ic_lock_power_off)
            .setContentIntent(piFreeze)
            .addAction(actionPostpone)
            .addAction(actionFreeze)
            .setAutoCancel(true)
            .setOngoing(false)

        if (groupKey != null) {
            childBuilder.setGroup(groupKey)
        }

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
            childBuilder.setLargeIcon(bitmap)
        } catch (e: Exception) {}

        notificationManager.notify(notifId, childBuilder.build())
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
