package com.killapp.core.ui

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray

class ServiceStateManager(private val context: ReactApplicationContext) {

    companion object {
        var autoHibernationEnabled = false
        val autoHibernationTargets = mutableSetOf<String>()
        var quickActionNotifEnabled = false
        val postponedPackages = mutableSetOf<String>()
    }

    private var quickActionReceiver: BroadcastReceiver? = null
    private var pollingHandler: Handler? = null
    val notificationManager by lazy { NotificationManager(context) }

    fun invalidate() {
        quickActionReceiver?.let {
            try { context.unregisterReceiver(it) } catch (e: Exception) {}
        }
        pollingHandler?.removeCallbacksAndMessages(null)
    }

    fun setAutoHibernationConfig(enabled: Boolean, packages: ReadableArray) {
        autoHibernationEnabled = enabled
        autoHibernationTargets.clear()
        postponedPackages.clear()
        for (i in 0 until packages.size()) {
            packages.getString(i)?.let { autoHibernationTargets.add(it) }
        }
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putBoolean("autoHibernationEnabled", autoHibernationEnabled)
            .putStringSet("autoHibernationTargets", java.util.HashSet(autoHibernationTargets))
            .putStringSet("postponedPackages", java.util.HashSet(postponedPackages))
            .apply()

        if (enabled) {
            val serviceIntent = Intent(context, BackgroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try { context.startForegroundService(serviceIntent) } catch (e: Exception) { context.startService(serviceIntent) }
            } else {
                context.startService(serviceIntent)
            }
            updateNotificationDisplay()
        } else {
            val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
            val isAnyActive = prefs.getBoolean("quickActionNotifEnabled", quickActionNotifEnabled) ||
                prefs.getBoolean("bedtimeShield", false) ||
                prefs.getBoolean("emergencyTrigger", false) ||
                prefs.getBoolean("ramCrunchSlayer", false) ||
                prefs.getInt("autoKillScheduler", 0) > 0
            val serviceIntent = Intent(context, BackgroundService::class.java)
            if (!isAnyActive) {
                context.stopService(serviceIntent)
                notificationManager.cancelAllNotifications()
            } else {
                updateNotificationDisplay(true)
            }
        }
    }

    fun setQuickActionNotification(enabled: Boolean) {
        quickActionNotifEnabled = enabled
        if (enabled && quickActionReceiver == null) {
            quickActionReceiver = QuickActionReceiver(
                context, notificationManager, autoHibernationTargets, postponedPackages
            ) { updateNotificationDisplay(true) }
            val filter = IntentFilter().apply {
                addAction("com.killapp.ACTION_FREEZE_ALL")
                addAction("com.killapp.ACTION_FREEZE_PKG")
                addAction("com.killapp.ACTION_POSTPONE_PKG")
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(quickActionReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                context.registerReceiver(quickActionReceiver, filter)
            }
        }
        if (pollingHandler == null) {
            pollingHandler = Handler(Looper.getMainLooper())
        }
        pollingHandler?.removeCallbacksAndMessages(null)
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("quickActionNotifEnabled", enabled).apply()
        
        val serviceIntent = Intent(context, BackgroundService::class.java)
        if (enabled) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try { context.startForegroundService(serviceIntent) } catch (e: Exception) { context.startService(serviceIntent) }
            } else {
                context.startService(serviceIntent)
            }
        } else {
            val isAnyActive = prefs.getBoolean("bedtimeShield", false) ||
                prefs.getBoolean("emergencyTrigger", false) ||
                prefs.getBoolean("ramCrunchSlayer", false) ||
                prefs.getInt("autoKillScheduler", 0) > 0 ||
                prefs.getBoolean("autoHibernationEnabled", autoHibernationEnabled)
            if (!isAnyActive) context.stopService(serviceIntent)
        }
        updateNotificationDisplay(true)
    }

    fun updateNotificationDisplay(force: Boolean = true) {
        notificationManager.updateDisplay(quickActionNotifEnabled, autoHibernationTargets, postponedPackages, force)
    }
}
