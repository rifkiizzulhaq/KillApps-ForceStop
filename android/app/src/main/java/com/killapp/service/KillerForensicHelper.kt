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
        return map
    }

    fun getResurrectionReport(context: Context): WritableArray {
        val array = Arguments.createArray()
        val pm = context.packageManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            try {
                val exitReasons = am.getHistoricalProcessExitReasons(null, 0, 30)
                val countMap = mutableMapOf<String, Int>()
                for (info in exitReasons) {
                    val processName = info.processName ?: continue
                    val pkg = processName.substringBefore(":")
                    if (pkg == context.packageName) continue
                    countMap[pkg] = (countMap[pkg] ?: 0) + 1
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
            } catch (e: Exception) {
            }
        }

        return array
    }
}
