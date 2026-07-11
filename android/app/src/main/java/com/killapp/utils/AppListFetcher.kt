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

                val iconBase64 = AppIconLoader.getAppIconBase64(packageManager, app, packageName, iconCache)

                val appMap = Arguments.createMap()
                appMap.putString("packageName", packageName)
                appMap.putString("appName", appName)
                appMap.putString("icon", iconBase64)
                appMap.putBoolean("isSystemApp", isSystemApp)
                appMap.putBoolean("isGcm", isGcm)
                appMap.putBoolean("isStopped", isStopped)
                appMap.putBoolean("isMediaApp", isMedia)
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

        for (p in runningProcesses) {
            if (p.pkgList.contains(packageName) && 
                p.importance <= android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_PERCEPTIBLE) {
                val cleanSet = shallowSet.filter { !it.equals(packageName) && !it.startsWith("$packageName:") }.toSet()
                prefs.edit().putStringSet("shallow_killed_set", cleanSet).apply()
                return false
            }
        }

        val killTimestamp = if (matchedEntry.contains(":")) matchedEntry.substringAfter(":").toLongOrNull() ?: 0L else 0L
        if (killTimestamp == 0L) {
            val cleanSet = shallowSet.filter { !it.equals(packageName) && !it.startsWith("$packageName:") }.toSet()
            prefs.edit().putStringSet("shallow_killed_set", cleanSet).apply()
            return false
        }

        if (System.currentTimeMillis() - killTimestamp >= 3000L) {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                try {
                    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? android.app.usage.UsageStatsManager
                    if (usm != null && usm.isAppInactive(packageName)) {
                        return true
                    }
                } catch (e: Exception) {}
            }
            try {
                val output = CommandExecutor.executeCommandWithOutput(context, "dumpsys activity processes $packageName | grep 'lastActivityTime='")
                if (output != null && output.contains("lastActivityTime=-")) {
                    var str = output.substringAfter("lastActivityTime=-").substringBefore(" ").substringBefore("\n")
                    var totalMs = 0L
                    if (str.contains("d")) {
                        val d = str.substringBefore("d").toLongOrNull() ?: 0L
                        totalMs += d * 86400000L
                        str = str.substringAfter("d")
                    }
                    if (str.contains("h")) {
                        val h = str.substringBefore("h").toLongOrNull() ?: 0L
                        totalMs += h * 3600000L
                        str = str.substringAfter("h")
                    }
                    if (str.contains("m") && !str.startsWith("ms") && str.contains("m")) {
                        val mIndex = str.indexOf('m')
                        if (mIndex > 0 && (mIndex + 1 >= str.length || str[mIndex + 1] != 's')) {
                            val m = str.substring(0, mIndex).toLongOrNull() ?: 0L
                            totalMs += m * 60000L
                            str = str.substring(mIndex + 1)
                        }
                    }
                    if (str.contains("s") && !str.startsWith("ms")) {
                        val sIndex = str.indexOf('s')
                        if (sIndex > 0 && (sIndex - 1 < 0 || str[sIndex - 1] != 'm')) {
                            val s = str.substring(0, sIndex).toLongOrNull() ?: 0L
                            totalMs += s * 1000L
                            str = str.substring(sIndex + 1)
                        }
                    }
                    if (str.contains("ms")) {
                        val ms = str.substringBefore("ms").toLongOrNull() ?: 0L
                        totalMs += ms
                    }
                    val lastActiveTimestamp = System.currentTimeMillis() - totalMs
                    if (lastActiveTimestamp > killTimestamp + 1500L) {
                        val cleanSet = shallowSet.filter { !it.equals(packageName) && !it.startsWith("$packageName:") }.toSet()
                        prefs.edit().putStringSet("shallow_killed_set", cleanSet).apply()
                        return false
                    }
                }
            } catch (e: Exception) {}
        }
        return true
    }
}

