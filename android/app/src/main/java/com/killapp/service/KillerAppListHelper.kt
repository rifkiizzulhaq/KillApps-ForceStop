package com.killapp.service

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

object KillerAppListHelper {

    fun getInstalledApps(
        context: Context,
        iconCache: ConcurrentHashMap<String, String>
    ): WritableArray {
        val packageManager = context.packageManager
        val apps = packageManager.getInstalledApplications(PackageManager.GET_META_DATA)
        val targetApps = apps.filter { it.packageName != context.packageName }

        val executor = Executors.newFixedThreadPool(4)
        val futures = targetApps.map { app ->
            executor.submit(java.util.concurrent.Callable {
                val packageName = app.packageName
                val appName = packageManager.getApplicationLabel(app).toString()
                val isSystemApp = (app.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                val isGcm = packageManager.checkPermission("com.google.android.c2dm.permission.RECEIVE", packageName) == PackageManager.PERMISSION_GRANTED
                val isStoppedFlag = (app.flags and ApplicationInfo.FLAG_STOPPED) != 0
                val isStopped = isStoppedFlag || isAppInactiveOrShallow(context, packageName)

                val iconBase64 = AppIconHelper.getAppIconBase64(packageManager, app, packageName, iconCache)

                val appMap = Arguments.createMap()
                appMap.putString("packageName", packageName)
                appMap.putString("appName", appName)
                appMap.putString("icon", iconBase64)
                appMap.putBoolean("isSystemApp", isSystemApp)
                appMap.putBoolean("isGcm", isGcm)
                appMap.putBoolean("isStopped", isStopped)
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

    fun isAppInactiveOrShallow(context: Context, packageName: String): Boolean {
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        val shallowSet = prefs.getStringSet("shallow_killed_set", setOf()) ?: setOf()

        if (!shallowSet.contains(packageName)) return false

        try {
            val output = ShizukuCommandHelper.executeCommandWithOutput("am get-inactive $packageName")
            val isStillInactive = output.contains("Inactive mode: true", ignoreCase = true) || output.contains("Idle=true", ignoreCase = true)
            val isConfirmedActive = output.contains("Inactive mode: false", ignoreCase = true) || output.contains("Idle=false", ignoreCase = true)

            if (isConfirmedActive) {
                val editSet = shallowSet.toMutableSet()
                editSet.remove(packageName)
                prefs.edit().putStringSet("shallow_killed_set", editSet).apply()
                return false
            }
            if (isStillInactive) return true
        } catch (e: Exception) {}
        return true
    }
}
