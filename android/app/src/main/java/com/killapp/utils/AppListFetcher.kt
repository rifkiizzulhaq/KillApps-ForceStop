package com.killapp.utils

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import com.killapp.core.command.CommandExecutor
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import com.killapp.core.execution.ProcessKiller
import com.killapp.core.execution.ProtectionFilter

object AppListFetcher {

    fun getInstalledApps(
        context: Context,
        iconCache: ConcurrentHashMap<String, String>
    ): WritableArray {
        val packageManager = context.packageManager
        val apps = packageManager.getInstalledApplications(0)
        val am = context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
        val runningProcesses = am.runningAppProcesses ?: emptyList()

        val executor = Executors.newFixedThreadPool(8)
        val futures = apps.map { app ->
            executor.submit(java.util.concurrent.Callable {
                val packageName = app.packageName
                val appName = packageManager.getApplicationLabel(app).toString()
                val isSystemFlag = (app.flags and ApplicationInfo.FLAG_SYSTEM) != 0 || (app.flags and ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0
                val isPlayStore = packageName == "com.android.vending" || packageName == "com.google.android.gms" || packageName == "com.google.android.gsf"
                val isSystemApp = isSystemFlag || isPlayStore
                val isGcm = packageManager.checkPermission("com.google.android.c2dm.permission.RECEIVE", packageName) == PackageManager.PERMISSION_GRANTED
                val isStoppedFlag = (app.flags and ApplicationInfo.FLAG_STOPPED) != 0
                val isStopped = isStoppedFlag || isAppInactiveOrShallow(context, packageName, runningProcesses)
                val isMedia = ProtectionFilter.isMediaOrAudioApp(context, packageName, app)
                val isSmart = ProtectionFilter.isSmartProtected(context, packageName, true)

                val iconBase64 = AppIconLoader.getAppIconBase64(packageManager, app, packageName, iconCache)

                val appMap = Arguments.createMap()
                appMap.putString("packageName", packageName)
                appMap.putString("appName", appName)
                appMap.putString("icon", iconBase64)
                appMap.putBoolean("isSystemApp", isSystemApp)
                appMap.putBoolean("isGcm", isGcm)
                appMap.putBoolean("isStopped", isStopped)
                appMap.putBoolean("isMediaApp", isMedia)
                appMap.putBoolean("isSmartProtected", isSmart)
                appMap
            })
        }

        val result = Arguments.createArray()
        for (future in futures) {
            try {
                result.pushMap(future.get())
            } catch (e: Exception) {
            }
        }
        executor.shutdown()
        return result
    }

    fun isAppInactiveOrShallow(
        context: Context,
        packageName: String,
        runningProcesses: List<android.app.ActivityManager.RunningAppProcessInfo>
    ): Boolean {
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        val shallowSet = prefs.getStringSet("shallow_killed_set", setOf()) ?: setOf()

        val matchedEntry = shallowSet.find { it == packageName || it.startsWith("$packageName:") }
            ?: return false

        val killTimestamp = if (matchedEntry.contains(":")) matchedEntry.substringAfter(":").toLongOrNull() ?: 0L else 0L
        if (killTimestamp == 0L) {
            val cleanSet = shallowSet.filter { !it.equals(packageName) && !it.startsWith("$packageName:") }.toSet()
            prefs.edit().putStringSet("shallow_killed_set", cleanSet).apply()
            return false
        }

        val now = System.currentTimeMillis()
        if (now - killTimestamp < 3000L) {
            return true
        }

        for (p in runningProcesses) {
            if (p.pkgList.contains(packageName) && 
                p.importance <= android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND_SERVICE) {
                val cleanSet = shallowSet.filter { !it.equals(packageName) && !it.startsWith("$packageName:") }.toSet()
                prefs.edit().putStringSet("shallow_killed_set", cleanSet).apply()
                return false
            }
        }

        val isTop = ProtectionFilter.isAppTopForeground(context, packageName)
        if (isTop) {
            val cleanSet = shallowSet.filter { !it.equals(packageName) && !it.startsWith("$packageName:") }.toSet()
            prefs.edit().putStringSet("shallow_killed_set", cleanSet).apply()
            return false
        }

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            try {
                val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? android.app.usage.UsageStatsManager
                if (usm != null) {
                    if (usm.isAppInactive(packageName)) {
                        return true
                    } else {
                        val cleanSet = shallowSet.filter { !it.equals(packageName) && !it.startsWith("$packageName:") }.toSet()
                        prefs.edit().putStringSet("shallow_killed_set", cleanSet).apply()
                        return false
                    }
                }
            } catch (e: Exception) {}
        }

        try {
            val pm = context.packageManager
            val info = pm.getApplicationInfo(packageName, 0)
            val isStopped = (info.flags and android.content.pm.ApplicationInfo.FLAG_STOPPED) != 0
            if (!isStopped) {
                val cleanSet = shallowSet.filter { !it.equals(packageName) && !it.startsWith("$packageName:") }.toSet()
                prefs.edit().putStringSet("shallow_killed_set", cleanSet).apply()
                return false
            }
        } catch (e: Exception) {}

        return true
    }
}

