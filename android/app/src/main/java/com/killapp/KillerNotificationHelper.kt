package com.killapp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo

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
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    channelId,
                    "Quick Action Notification",
                    NotificationManager.IMPORTANCE_LOW
                )
                channel.description = "Pintasan cepat hibernasi KillApp"
                notificationManager.createNotificationChannel(channel)
            }

            val pm = context.packageManager
            if (!isBgServiceNotifShown || force) {
                val launchIntent = pm.getLaunchIntentForPackage(context.packageName)
                val piLaunch = PendingIntent.getActivity(
                    context, 888, launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or (if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
                )
                val bgBuilder = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    Notification.Builder(context, channelId)
                } else {
                    Notification.Builder(context)
                }
                bgBuilder.setContentTitle("Background Service")
                    .setContentText("Click to set visibility for this notification")
                    .setSmallIcon(android.R.drawable.ic_lock_power_off)
                    .setContentIntent(piLaunch)
                    .setOngoing(true)
                notificationManager.notify(888, bgBuilder.build())
                isBgServiceNotifShown = true
            }

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

            val newNotifIds = mutableSetOf<Int>()
            for (pkg in activeTargets) {
                newNotifIds.add(Math.abs(pkg.hashCode()) + 1000)
            }
            for (oldId in activeNotifIds) {
                if (!newNotifIds.contains(oldId)) {
                    notificationManager.cancel(oldId)
                }
            }
            activeNotifIds.clear()
            activeNotifIds.addAll(newNotifIds)

            if (activeTargets.isEmpty()) {
                notificationManager.cancel(999)
                return
            }

            val groupKey = "com.killapp.HIBERNATION_GROUP"

            for (pkg in activeTargets) {
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
                    Notification.Action.Builder(android.graphics.drawable.Icon.createWithResource(context, android.R.drawable.ic_media_pause), "Hibernate", piFreeze).build()
                } else {
                    Notification.Action(android.R.drawable.ic_media_pause, "Hibernate", piFreeze)
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

                val launchIntent = pm.getLaunchIntentForPackage(context.packageName)
                val pendingIntent = PendingIntent.getActivity(
                    context, notifId, launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or (if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
                )

                val childBuilder = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    Notification.Builder(context, channelId)
                } else {
                    Notification.Builder(context)
                }

                childBuilder.setContentTitle(appName)
                    .setContentText("pending hibernation")
                    .setSmallIcon(android.R.drawable.ic_lock_power_off)
                    .setContentIntent(pendingIntent)
                    .setGroup(groupKey)
                    .addAction(actionPostpone)
                    .addAction(actionFreeze)
                    .setAutoCancel(true)
                    .setOngoing(false)

                notificationManager.notify(notifId, childBuilder.build())
            }

            val appNames = activeTargets.map { pkg ->
                try { pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString() } catch (e: Exception) { pkg }
            }

            val summaryStyle = Notification.InboxStyle()
                .setSummaryText("${activeTargets.size} pending")
            for (name in appNames) {
                summaryStyle.addLine("$name pending hibernation")
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

            summaryBuilder.setContentTitle("KillApp • Tekan untuk hibernasi semua")
                .setContentText("${activeTargets.size} pending hibernation")
                .setSmallIcon(android.R.drawable.ic_lock_power_off)
                .setContentIntent(piAll)
                .setStyle(summaryStyle)
                .setGroup(groupKey)
                .setGroupSummary(true)
                .setOngoing(true)

            notificationManager.notify(999, summaryBuilder.build())
        } catch (e: Exception) {}
    }
}
