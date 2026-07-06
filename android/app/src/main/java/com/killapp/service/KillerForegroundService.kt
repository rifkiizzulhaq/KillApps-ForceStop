package com.killapp.service

import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import com.killapp.module.ShizukuKillerModule

class KillerForegroundService : Service() {
    private var handler: Handler? = null
    private lateinit var helper: KillerNotificationHelper
    private var screenReceiver: BroadcastReceiver? = null
    private var batteryReceiver: BroadcastReceiver? = null
    private val isKillingInProgress = java.util.concurrent.atomic.AtomicBoolean(false)
    private val isWatchlistChecking = java.util.concurrent.atomic.AtomicBoolean(false)

    override fun onCreate() {
        super.onCreate()
        helper = KillerNotificationHelper(this)
        handler = Handler(Looper.getMainLooper())

        screenReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.action == Intent.ACTION_SCREEN_OFF) {
                    val prefs = getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                    val bedtime = prefs.getBoolean("bedtimeShield", false)
                    var shouldTrigger = false
                    
                    if (bedtime) {
                        val cal = java.util.Calendar.getInstance()
                        val hour = cal.get(java.util.Calendar.HOUR_OF_DAY)
                        val minute = cal.get(java.util.Calendar.MINUTE)
                        val currentMin = hour * 60 + minute
                        val startMin = prefs.getInt("bedtimeStart", 1380)
                        val endMin = prefs.getInt("bedtimeEnd", 300)
                        val isBedtime = if (startMin > endMin) currentMin >= startMin || currentMin <= endMin
                                        else currentMin in startMin..endMin
                        if (isBedtime) shouldTrigger = true
                    }
                    
                    if (!shouldTrigger && prefs.getBoolean("autoHibernationEnabled", false)) {
                        shouldTrigger = true
                    }
                    
                    if (shouldTrigger) {
                        val targets = prefs.getStringSet("autoHibernationTargets", ShizukuKillerModule.autoHibernationTargets) ?: setOf()
                        triggerAutoKill(targets)
                    }
                }
            }
        }
        registerReceiver(screenReceiver, IntentFilter(Intent.ACTION_SCREEN_OFF))

        batteryReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.action == Intent.ACTION_BATTERY_CHANGED) {
                    val prefs = getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                    if (prefs.getBoolean("emergencyTrigger", false)) {
                        val level = intent.getIntExtra(android.os.BatteryManager.EXTRA_LEVEL, -1)
                        val scale = intent.getIntExtra(android.os.BatteryManager.EXTRA_SCALE, -1)
                        val temp = intent.getIntExtra(android.os.BatteryManager.EXTRA_TEMPERATURE, -1)
                        
                        var shouldKill = false
                        if (level != -1 && scale != -1) {
                            val batteryPct = level * 100 / scale.toFloat()
                            if (batteryPct <= 20f) shouldKill = true
                        }
                        if (temp != -1) {
                            if (temp / 10f >= 40f) shouldKill = true
                        }
                        
                        if (shouldKill) {
                            val lastEmergency = prefs.getLong("lastEmergencyKillTime", 0L)
                            val now = System.currentTimeMillis()
                            if (now - lastEmergency > 3600 * 1000L && !isKillingInProgress.get()) {
                                prefs.edit().putLong("lastEmergencyKillTime", now).apply()
                                val targets = prefs.getStringSet("autoHibernationTargets", ShizukuKillerModule.autoHibernationTargets) ?: setOf()
                                triggerAutoKill(targets)
                            }
                        }
                    }
                }
            }
        }
        registerReceiver(batteryReceiver, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notif = helper.buildServiceNotification()
        startForeground(888, notif)

        startMonitoring()
        return START_STICKY
    }

    private fun triggerAutoKill(targets: Set<String>) {
        if (targets.isEmpty() || !isKillingInProgress.compareAndSet(false, true)) return
        Thread {
            try {
                val prefs = getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                val ignoreBackgroundFree = prefs.getBoolean("ignoreBackgroundFree", false)
                val array = com.facebook.react.bridge.Arguments.createArray()
                for (pkg in targets) {
                    if (ignoreBackgroundFree) {
                        val alreadyStopped = try {
                            val info = packageManager.getApplicationInfo(pkg, 0)
                            (info.flags and android.content.pm.ApplicationInfo.FLAG_STOPPED) != 0
                        } catch (e: Exception) { false }
                        if (!alreadyStopped && !KillerAppListHelper.isAppInactiveOrShallow(this, pkg)) {
                            array.pushString(pkg)
                        }
                    } else {
                        array.pushString(pkg)
                    }
                }
                if (array.size() == 0) return@Thread
                val mode = prefs.getString("workingMode", "shizuku") ?: "shizuku"
                if (mode == "root") {
                    KillerExecutionHelper.killAppsViaRoot(this, array)
                } else {
                    KillerExecutionHelper.killAppsShizuku(this, array)
                }
            } catch (e: Exception) {}
            finally {
                isKillingInProgress.set(false)
            }
        }.start()
    }

    private fun reKillFromWatchlist(pkg: String, mode: String) {
        try {
            if (mode == "root") {
                Runtime.getRuntime().exec(arrayOf("su", "-c", "am force-stop $pkg")).waitFor()
            } else {
                ShizukuCommandHelper.forceStopPackage(pkg)
            }
            val prefs = getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
            if (prefs.getBoolean("gcmWakeupBypass", true)) {
                val cmd = "cmd appops set $pkg RUN_IN_BACKGROUND ignore"
                if (mode == "root") Runtime.getRuntime().exec(arrayOf("su", "-c", cmd)).waitFor()
                else ShizukuCommandHelper.executeCommand(cmd)
            }
            if (prefs.getBoolean("wakeUpTracking", true)) {
                if (mode == "root") {
                    Runtime.getRuntime().exec(arrayOf("su", "-c",
                        "cmd appops set $pkg WAKE_LOCK ignore && cmd appops set $pkg RUN_ANY_IN_BACKGROUND ignore"
                    )).waitFor()
                } else {
                    ShizukuCommandHelper.executeCommand("cmd appops set $pkg WAKE_LOCK ignore")
                    ShizukuCommandHelper.executeCommand("cmd appops set $pkg RUN_ANY_IN_BACKGROUND ignore")
                }
            }
        } catch (e: Exception) {}
    }

    private fun checkReKillWatchlist() {
        if (!KillerExecutionHelper.isReKillWatchlistEnabled(this)) return
        if (!isWatchlistChecking.compareAndSet(false, true)) return
        Thread {
            try {
                val prefs = getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                val watchlist = (prefs.getStringSet("reKillWatchlist", setOf()) ?: setOf()).toMutableSet()
                if (watchlist.isEmpty()) {
                    prefs.edit().putBoolean("reKillWatchlistActive", false).apply()
                    return@Thread
                }

                val now = System.currentTimeMillis()
                val expireMs = 60 * 60 * 1000L 
                val toRemove = mutableSetOf<String>()
                val toReKill = mutableListOf<String>()

                val focusOutput = try { ShizukuCommandHelper.executeCommandWithOutput("dumpsys window focus") } catch (e: Exception) { "" }
                val windowsOutput = try { ShizukuCommandHelper.executeCommandWithOutput("dumpsys window windows") } catch (e: Exception) { "" }

                for (entry in watchlist) {
                    val colonIdx = entry.lastIndexOf(':')
                    if (colonIdx < 0) { toRemove.add(entry); continue }
                    val pkg = entry.substring(0, colonIdx)
                    val killTime = entry.substring(colonIdx + 1).toLongOrNull() ?: 0L

                    if (now - killTime > expireMs) { toRemove.add(entry); continue }

                    val isStoppedFlag = try {
                        val info = packageManager.getApplicationInfo(pkg, 0)
                        (info.flags and android.content.pm.ApplicationInfo.FLAG_STOPPED) != 0
                    } catch (e: Exception) { true }
                    val isStopped = isStoppedFlag || KillerAppListHelper.isAppInactiveOrShallow(this, pkg)

                    if (isStopped) continue

                    val isForeground = focusOutput.contains(pkg) || windowsOutput.contains(pkg)
                    if (isForeground) {
                        toRemove.add(entry)
                        val mode = prefs.getString("workingMode", "shizuku") ?: "shizuku"
                        Thread { KillerExecutionHelper.resetAppOps(this, pkg, mode) }.start()
                    } else {
                        toReKill.add(pkg)
                    }
                }

                if (toRemove.isNotEmpty()) {
                    watchlist.removeAll(toRemove)
                    val editor = prefs.edit().putStringSet("reKillWatchlist", watchlist)
                    if (watchlist.isEmpty()) editor.putBoolean("reKillWatchlistActive", false)
                    editor.apply()
                }

                if (toReKill.isNotEmpty()) {
                    val mode = prefs.getString("workingMode", "shizuku") ?: "shizuku"
                    toReKill.forEach { reKillFromWatchlist(it, mode) }
                }
            } catch (e: Exception) {}
            finally {
                isWatchlistChecking.set(false)
            }
        }.start()
    }

    private fun startMonitoring() {
        handler?.removeCallbacksAndMessages(null)
        handler?.post(object : Runnable {
            override fun run() {
                val prefs = getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                val enabled = prefs.getBoolean("quickActionNotifEnabled", ShizukuKillerModule.quickActionNotifEnabled)
                val mode = prefs.getString("workingMode", "shizuku") ?: "shizuku"
                val isModeAlive = if (mode == "root") {
                    prefs.getBoolean("isRootActive", false)
                } else {
                    try {
                        rikka.shizuku.Shizuku.pingBinder() && rikka.shizuku.Shizuku.checkSelfPermission() == android.content.pm.PackageManager.PERMISSION_GRANTED
                    } catch (e: Exception) { false }
                }

                val isWatchlistActive = KillerExecutionHelper.isReKillWatchlistEnabled(this@KillerForegroundService) && prefs.getBoolean("reKillWatchlistActive", false)
                val isAnyActive = enabled ||
                        prefs.getBoolean("autoHibernationEnabled", ShizukuKillerModule.autoHibernationEnabled) ||
                        prefs.getBoolean("bedtimeShield", false) ||
                        prefs.getBoolean("emergencyTrigger", false) ||
                        prefs.getBoolean("ramCrunchSlayer", false) ||
                        prefs.getInt("autoKillScheduler", 0) > 0 ||
                        isWatchlistActive

                if (isAnyActive && isModeAlive) {
                    val targets = prefs.getStringSet("autoHibernationTargets", ShizukuKillerModule.autoHibernationTargets) ?: setOf()
                    val postponed = prefs.getStringSet("postponedPackages", ShizukuKillerModule.postponedPackages) ?: setOf()
                    helper.updateDisplay(
                        enabled,
                        targets,
                        postponed,
                        false
                    )

                    checkReKillWatchlist()

                    val ramCrunch = prefs.getBoolean("ramCrunchSlayer", false)
                    if (ramCrunch) {
                        try {
                            val am = getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
                            val memInfo = android.app.ActivityManager.MemoryInfo()
                            am.getMemoryInfo(memInfo)
                            val ratio = memInfo.availMem.toDouble() / memInfo.totalMem.toDouble()
                            val lastCrunch = prefs.getLong("lastRamCrunchTime", 0L)
                            val now = System.currentTimeMillis()
                            if (ratio < 0.15 && now - lastCrunch > 15 * 60 * 1000L && !isKillingInProgress.get()) {
                                prefs.edit().putLong("lastRamCrunchTime", now).apply()
                                triggerAutoKill(targets)
                            }
                        } catch (e: Exception) {}
                    }

                    val intervalHours = prefs.getInt("autoKillScheduler", 0)
                    if (intervalHours > 0) {
                        val lastScheduled = prefs.getLong("lastScheduledKillTime", 0L)
                        val now = System.currentTimeMillis()
                        if (lastScheduled == 0L) {
                            prefs.edit().putLong("lastScheduledKillTime", now).apply()
                        } else if (now - lastScheduled > intervalHours * 3600 * 1000L && !isKillingInProgress.get()) {
                            prefs.edit().putLong("lastScheduledKillTime", now).apply()
                            triggerAutoKill(targets)
                        }
                    }

                    handler?.postDelayed(this, 2000)
                } else {
                    helper.updateDisplay(false, setOf(), setOf(), true)
                    stopSelf()
                }
            }
        })
    }

    override fun onDestroy() {
        super.onDestroy()
        handler?.removeCallbacksAndMessages(null)
        helper.cancelAllNotifications()
        
        screenReceiver?.let { try { unregisterReceiver(it) } catch (e: Exception) {} }
        batteryReceiver?.let { try { unregisterReceiver(it) } catch (e: Exception) {} }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
