package com.killapp.core.execution

import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.killapp.core.command.CommandExecutor
import com.killapp.core.ui.BackgroundService

object ProcessKiller {

    fun isReKillWatchlistEnabled(context: Context): Boolean {
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        return prefs.getBoolean("reKillWatchlistEnabled", true)
    }

    private fun addToReKillWatchlist(context: Context, pkg: String) {
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        if (!isReKillWatchlistEnabled(context)) return
        if (!prefs.getBoolean("wakeUpTracking", true)) return
        if (ProtectionFilter.isAppOpsExempt(context, pkg)) return

        try {
            val set = (prefs.getStringSet("reKillWatchlist", setOf()) ?: setOf()).toMutableSet()
            set.removeAll { it.startsWith("$pkg:") }
            set.add("$pkg:${System.currentTimeMillis()}")
            prefs.edit()
                .putStringSet("reKillWatchlist", set)
                .putBoolean("reKillWatchlistActive", true)
                .apply()
            
            val intent = Intent(context, BackgroundService::class.java)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        } catch (e: Exception) {}
    }

    fun resetAppOps(context: Context, pkg: String) {
        val cmds = listOf(
            "cmd appops set $pkg RUN_IN_BACKGROUND allow",
            "cmd appops set $pkg WAKE_LOCK allow",
            "cmd appops set $pkg RUN_ANY_IN_BACKGROUND allow"
        )
        for (cmd in cmds) CommandExecutor.executeCommand(context, cmd)
    }

    private fun recordShallowKill(context: Context, pkg: String) {
        try {
            val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
            val set = (prefs.getStringSet("shallow_killed_set", setOf()) ?: setOf()).toMutableSet()
            set.add(pkg)
            prefs.edit().putStringSet("shallow_killed_set", set).apply()
        } catch (e: Exception) {}
    }

    fun killApps(context: Context, packageNames: ReadableArray): WritableMap {
        val am = context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
        val memInfoBefore = android.app.ActivityManager.MemoryInfo()
        am.getMemoryInfo(memInfoBefore)
        val ramBeforeMb = memInfoBefore.availMem.toFloat() / (1024 * 1024)

        val successList = Arguments.createArray()
        val failedList = Arguments.createArray()
        val webviewSkippedList = Arguments.createArray()

        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        val gcmBypass = prefs.getBoolean("gcmWakeupBypass", true)
        val deepTrim = prefs.getBoolean("deepTrimMemory", false)
        val aggDoze = prefs.getBoolean("aggressiveDoze", false)
        val smart = prefs.getBoolean("smartHibernation", true)
        val finerMedia = prefs.getBoolean("finerMediaDetection", false)
        val shallow = prefs.getBoolean("shallowHibernation", false)
        val dontRemoveNotif = prefs.getBoolean("dontRemoveNotif", false)
        val phantomSlayer = prefs.getBoolean("phantomSlayer", false)

        val activeMediaPkgs = if (finerMedia) ProtectionFilter.getActiveMediaPackages(context) else setOf()

        for (i in 0 until packageNames.size()) {
            val pkg = packageNames.getString(i)
            if (!pkg.isNullOrEmpty()) {
                if (ProtectionFilter.isActiveWebViewProtected(context, pkg)) {
                    webviewSkippedList.pushString(pkg)
                    continue
                }
                if (ProtectionFilter.isMediaActiveProtected(context, pkg, finerMedia, activeMediaPkgs) || 
                    ProtectionFilter.isSmartProtected(context, pkg, smart) || 
                    ProtectionFilter.isQuarantineProtected(context, pkg)) {
                    failedList.pushString(pkg)
                    continue
                }

                val useShallow = shallow || dontRemoveNotif
                val success = if (useShallow) {
                    val r1 = CommandExecutor.executeCommand(context, "am set-inactive $pkg true")
                    if (gcmBypass && !dontRemoveNotif && !ProtectionFilter.isAppOpsExempt(context, pkg)) {
                        CommandExecutor.executeCommand(context, "cmd appops set $pkg RUN_IN_BACKGROUND ignore")
                    }
                    r1 == 0
                } else {
                    CommandExecutor.forceStopPackage(context, pkg)
                }

                if (success) {
                    successList.pushString(pkg)
                    addToReKillWatchlist(context, pkg)
                    if (useShallow) {
                        recordShallowKill(context, pkg)
                        if (deepTrim) {
                            CommandExecutor.executeCommand(context, "am send-trim-memory $pkg RUNNING_CRITICAL")
                        }
                    } else if (gcmBypass && !ProtectionFilter.isAppOpsExempt(context, pkg)) {
                        CommandExecutor.executeCommand(context, "cmd appops set $pkg RUN_IN_BACKGROUND ignore")
                        CommandExecutor.executeCommand(context, "cmd appops set $pkg WAKE_LOCK ignore")
                        CommandExecutor.executeCommand(context, "cmd appops set $pkg RUN_ANY_IN_BACKGROUND ignore")
                    }
                } else {
                    failedList.pushString(pkg)
                }
            }
        }

        if (aggDoze && successList.size() > 0) {
            CommandExecutor.executeCommand(context, "dumpsys deviceidle force-idle")
        }

        if (phantomSlayer && successList.size() > 0) {
            CommandExecutor.executeCommand(context, "settings put global settings_enable_monitor_phantom_procs false")
        }

        am.getMemoryInfo(memInfoBefore)
        val ramAfterMb = memInfoBefore.availMem.toFloat() / (1024 * 1024)
        var savedRam = ramAfterMb - ramBeforeMb
        if (savedRam < 0) savedRam = 0f

        val resultMap = Arguments.createMap()
        resultMap.putArray("success", successList)
        resultMap.putArray("failed", failedList)
        resultMap.putArray("webviewSkipped", webviewSkippedList)
        resultMap.putDouble("savedRamMb", savedRam.toDouble())

        return resultMap
    }
}

