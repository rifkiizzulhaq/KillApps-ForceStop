package com.killapp.core.ui

import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import com.killapp.core.command.CommandExecutor
import android.content.Intent
import android.content.IntentFilter
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import com.killapp.bridge.CoreKillerModule
import com.killapp.utils.AppListFetcher
import com.killapp.core.execution.ProcessKiller
import com.killapp.core.execution.ProtectionFilter

class BackgroundService : Service() {
    private var handler: Handler? = null
    private lateinit var helper: NotificationManager
    private var screenReceiver: BroadcastReceiver? = null
    private var batteryReceiver: BroadcastReceiver? = null
    private val isKillingInProgress = java.util.concurrent.atomic.AtomicBoolean(false)
    private val isWatchlistChecking = java.util.concurrent.atomic.AtomicBoolean(false)
    private val suspiciousPackages = mutableMapOf<String, Long>()

    override fun onCreate() {
        super.onCreate()
        helper = NotificationManager(this)
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
                        val targets = prefs.getStringSet("autoHibernationTargets", setOf()) ?: setOf()
                        triggerAutoKill(targets)
                    }
                }
            }
        }
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(screenReceiver, IntentFilter(Intent.ACTION_SCREEN_OFF), Context.RECEIVER_EXPORTED)
        } else {
            registerReceiver(screenReceiver, IntentFilter(Intent.ACTION_SCREEN_OFF))
        }

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
                                val targets = prefs.getStringSet("autoHibernationTargets", setOf()) ?: setOf()
                                triggerAutoKill(targets)
                            }
                        }
                    }
                }
            }
        }
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(batteryReceiver, IntentFilter(Intent.ACTION_BATTERY_CHANGED), Context.RECEIVER_EXPORTED)
        } else {
            registerReceiver(batteryReceiver, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        }
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
                val am = getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
                val runningProcesses = am.runningAppProcesses ?: emptyList()
                val array = com.facebook.react.bridge.Arguments.createArray()
                for (pkg in targets) {
                    if (ignoreBackgroundFree) {
                        val alreadyStopped = try {
                            val info = packageManager.getApplicationInfo(pkg, 0)
                            (info.flags and android.content.pm.ApplicationInfo.FLAG_STOPPED) != 0
                        } catch (e: Exception) { false }
                        if (!alreadyStopped && !AppListFetcher.isAppInactiveOrShallow(this, pkg, runningProcesses)) {
                            array.pushString(pkg)
                        }
                    } else {
                        array.pushString(pkg)
                    }
                }
                if (array.size() == 0) return@Thread
                ProcessKiller.killApps(this, array)
            } catch (e: Exception) {}
            finally {
                isKillingInProgress.set(false)
            }
        }.start()
    }

    private fun reKillFromWatchlist(pkg: String) {
        try {
            val prefs = getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
            val useShallow = prefs.getBoolean("shallowHibernation", false) || prefs.getBoolean("dontRemoveNotif", false)
            if (useShallow) {
                CommandExecutor.executeCommand(this, "am set-inactive $pkg true")
            } else {
                CommandExecutor.forceStopPackage(this, pkg)
            }
            val isExempt = ProtectionFilter.isAppOpsExempt(this, pkg) || ProtectionFilter.isMediaOrAudioApp(this, pkg)
            if (prefs.getBoolean("gcmWakeupBypass", true) && !isExempt && !useShallow) {
                CommandExecutor.executeCommand(this, "cmd appops set $pkg RUN_IN_BACKGROUND ignore")
            }
            if (prefs.getBoolean("wakeUpTracking", true) && !isExempt && !useShallow) {
                CommandExecutor.executeCommand(this, "cmd appops set $pkg WAKE_LOCK ignore")
            }
        } catch (e: Exception) {}
    }

    private fun checkReKillWatchlist() {
        if (!ProcessKiller.isReKillWatchlistEnabled(this)) return
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
                val actMgr = getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
                val runningProcesses = actMgr.runningAppProcesses ?: emptyList()

                for (entry in watchlist) {
                    val colonIdx = entry.lastIndexOf(':')
                    if (colonIdx < 0) { toRemove.add(entry); continue }
                    val pkg = entry.substring(0, colonIdx)

                    val killTime = entry.substring(colonIdx + 1).toLongOrNull() ?: 0L
                    if (now - killTime > expireMs) { toRemove.add(entry); continue }

                    val finerMedia = prefs.getBoolean("finerMediaDetection", false)

                    if (ProtectionFilter.isMediaActiveProtected(this, pkg, finerMedia)) {
                        suspiciousPackages.remove(pkg)
                        Thread { ProcessKiller.resetAppOps(this, pkg) }.start()
                        continue
                    }

                    val isStoppedFlag = try {
                        val info = packageManager.getApplicationInfo(pkg, 0)
                        (info.flags and android.content.pm.ApplicationInfo.FLAG_STOPPED) != 0
                    } catch (e: Exception) { true }
                    val isStopped = isStoppedFlag || AppListFetcher.isAppInactiveOrShallow(this, pkg, runningProcesses)

                    if (isStopped) {
                        suspiciousPackages.remove(pkg)
                        continue
                    }

                    val isForeground = try {
                        val isAmForeground = runningProcesses.any { it.pkgList.contains(pkg) && it.importance == android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND }
                        if (isAmForeground) {
                            true
                        } else {
                            val resumedOutput = CommandExecutor.executeCommandWithOutput(this, "dumpsys activity activities | grep -iE 'mResumedActivity|topResumedActivity|ResumedActivity|mLastPausedActivity'")
                            if (resumedOutput.contains(pkg)) {
                                true
                            } else {
                                val topOutput = CommandExecutor.executeCommandWithOutput(this, "dumpsys activity top | head -n 25")
                                topOutput.contains(pkg)
                            }
                        }
                    } catch (e: Exception) {
                        false
                    }
                    
                    if (isForeground) {
                        toRemove.add(entry)
                        suspiciousPackages.remove(pkg)
                        Thread { ProcessKiller.resetAppOps(this, pkg) }.start()
                    } else {
                        val firstDetected = suspiciousPackages[pkg]
                        if (firstDetected == null) {
                            suspiciousPackages[pkg] = now
                        } else if (now - firstDetected > 3000L) {
                            toReKill.add(pkg)
                            suspiciousPackages.remove(pkg)
                        }
                    }
                }

                if (toRemove.isNotEmpty()) {
                    watchlist.removeAll(toRemove)
                    val editor = prefs.edit().putStringSet("reKillWatchlist", watchlist)
                    if (watchlist.isEmpty()) editor.putBoolean("reKillWatchlistActive", false)
                    editor.apply()
                }

                if (toReKill.isNotEmpty()) {
                    toReKill.forEach { reKillFromWatchlist(it) }
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
            private var tickCount = 0
            override fun run() {
                Thread {
                    try {
                        val prefs = getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                        val enabled = prefs.getBoolean("quickActionNotifEnabled", false)
                        val isModeAlive = CommandExecutor.isReady(this@BackgroundService)

                        val isWatchlistActive = ProcessKiller.isReKillWatchlistEnabled(this@BackgroundService) && prefs.getBoolean("reKillWatchlistActive", false)
                        val isAnyActive = enabled ||
                                prefs.getBoolean("autoHibernationEnabled", false) ||
                                prefs.getBoolean("bedtimeShield", false) ||
                                prefs.getBoolean("emergencyTrigger", false) ||
                                prefs.getBoolean("ramCrunchSlayer", false) ||
                                prefs.getInt("autoKillScheduler", 0) > 0 ||
                                isWatchlistActive

                        if (isAnyActive && isModeAlive) {
                            val targets = prefs.getStringSet("autoHibernationTargets", setOf()) ?: setOf()
                            val postponed = prefs.getStringSet("postponedPackages", setOf()) ?: setOf()
                            helper.updateDisplay(enabled, targets, postponed, false)

                            val activeMediaPkgs = ProtectionFilter.getActiveMediaPackages(this@BackgroundService)
                            if (activeMediaPkgs.isNotEmpty()) {
                                for (mediaPkg in activeMediaPkgs) {
                                    ProcessKiller.resetAppOps(this@BackgroundService, mediaPkg)
                                }
                            }

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

                            tickCount++
                            if (tickCount % 2 == 0) {
                                checkReKillWatchlist()
                            }

                            handler?.postDelayed(this, 1500)
                        } else {
                            helper.updateDisplay(false, setOf(), setOf(), true)
                            stopSelf()
                        }
                    } catch (e: Exception) {
                        handler?.postDelayed(this, 1500)
                    }
                }.start()
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

