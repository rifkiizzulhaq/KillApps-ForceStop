package com.killapp.service

import android.app.ActivityManager
import android.app.ApplicationExitInfo
import android.content.Context
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

object KillerForensicHelper {

    fun recordKillEvent(context: Context, count: Int) {
        if (count <= 0) return
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        val currentKills = prefs.getInt("totalKilledCount", 0)
        val currentBlocked = prefs.getInt("blockedWakeupsCount", 0)
        val currentRamSaved = prefs.getFloat("totalRamSavedMb", 0f)

        val estimatedRamPerAppMb = 65f
        prefs.edit()
            .putInt("totalKilledCount", currentKills + count)
            .putInt("blockedWakeupsCount", currentBlocked + (count * 3))
            .putFloat("totalRamSavedMb", currentRamSaved + (count * estimatedRamPerAppMb))
            .apply()
    }

    fun recordRealTimeRamImpact(context: Context, ramBeforeMb: Float, ramAfterMb: Float) {
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putFloat("lastRamBeforeMb", ramBeforeMb)
            .putFloat("lastRamAfterMb", ramAfterMb)
            .apply()
    }

    fun getImpactAnalytics(context: Context): WritableMap {
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        val map = Arguments.createMap()
        map.putInt("totalKilledCount", prefs.getInt("totalKilledCount", 0))
        map.putInt("blockedWakeupsCount", prefs.getInt("blockedWakeupsCount", 0))
        map.putDouble("totalRamSavedMb", prefs.getFloat("totalRamSavedMb", 0f).toDouble())

        val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val memInfo = ActivityManager.MemoryInfo()
        am.getMemoryInfo(memInfo)

        val availGb = memInfo.availMem.toDouble() / (1024 * 1024 * 1024)
        val totalGb = memInfo.totalMem.toDouble() / (1024 * 1024 * 1024)
        map.putDouble("availMemGb", availGb)
        map.putDouble("totalMemGb", totalGb)
        map.putDouble("lastRamBeforeMb", prefs.getFloat("lastRamBeforeMb", 0f).toDouble())
        map.putDouble("lastRamAfterMb", prefs.getFloat("lastRamAfterMb", 0f).toDouble())
        return map
    }

    fun getResurrectionReport(context: Context): WritableArray {
        val array = Arguments.createArray()
        val pm = context.packageManager

        try {
            val output = ShizukuCommandHelper.executeCommandWithOutput("dumpsys activity exit-info")
            val countMap = mutableMapOf<String, Int>()
            var currentPkg = ""
            
            val lines = output.split("\n")
            val sdf = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", java.util.Locale.US)
            val now = System.currentTimeMillis()
            val oneDayMs = 24 * 60 * 60 * 1000L

            for (line in lines) {
                val trimmed = line.trim()
                if (trimmed.startsWith("package: ")) {
                    currentPkg = trimmed.substringAfter("package: ").trim()
                } else if (trimmed.startsWith("timestamp=")) {
                    if (currentPkg.isNotEmpty() && currentPkg != context.packageName) {
                        try {
                            val timeStr = trimmed.substringAfter("timestamp=").substringBefore(" pid=")
                            val date = sdf.parse(timeStr)
                            if (date != null && now - date.time <= oneDayMs) {
                                countMap[currentPkg] = (countMap[currentPkg] ?: 0) + 1
                            }
                        } catch (e: Exception) {}
                    }
                }
            }

            for ((pkg, count) in countMap) {
                if (count >= 2) {
                    val appMap = Arguments.createMap()
                    appMap.putString("packageName", pkg)
                    val appName = try {
                        pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
                    } catch (e: Exception) {
                        pkg
                    }
                    appMap.putString("appName", appName)
                    appMap.putInt("restartCount", count)
                    array.pushMap(appMap)
                }
            }
        } catch (e: Exception) {}

        return array
    }
}
