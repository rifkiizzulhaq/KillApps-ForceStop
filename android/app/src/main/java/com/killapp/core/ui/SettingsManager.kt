package com.killapp.core.ui

import android.content.Context
import android.content.Intent
import android.os.Build
import android.net.Uri
import android.os.PowerManager
import android.provider.Settings
import com.killapp.core.command.CommandExecutor

object SettingsManager {

    fun setWorkingMode(context: Context, mode: String) {
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("workingMode", mode).apply()
    }

    fun setGeekOptions(context: Context, aggressiveDoze: Boolean, gcmWakeupBypass: Boolean, deepTrimMemory: Boolean) {
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putBoolean("aggressiveDoze", aggressiveDoze)
            .putBoolean("gcmWakeupBypass", gcmWakeupBypass)
            .putBoolean("deepTrimMemory", deepTrimMemory)
            .apply()
    }

    fun setHibernationOptions(context: Context, smart: Boolean, finerMedia: Boolean, shallow: Boolean, wakeUp: Boolean, dontRemoveNotif: Boolean, ignoreBackgroundFree: Boolean) {
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putBoolean("smartHibernation", smart)
            .putBoolean("finerMediaDetection", finerMedia)
            .putBoolean("shallowHibernation", shallow)
            .putBoolean("wakeUpTracking", wakeUp)
            .putBoolean("dontRemoveNotif", dontRemoveNotif)
            .putBoolean("ignoreBackgroundFree", ignoreBackgroundFree)
            .apply()
    }

    fun setProOptions(context: Context, phantomSlayer: Boolean?, bedtimeShield: Boolean?, emergencyTrigger: Boolean?, ramCrunchSlayer: Boolean?, autoKillScheduler: Int?, bedtimeStart: Int?, bedtimeEnd: Int?, quickActionNotifEnabled: Boolean, autoHibernationEnabled: Boolean) {
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        val edit = prefs.edit()
        
        phantomSlayer?.let { 
            edit.putBoolean("phantomSlayer", it)
            if (it && Build.VERSION.SDK_INT >= 31) {
                try { CommandExecutor.executeCommand(context, "settings put global settings_enable_monitor_phantom_procs false") } catch (e: Exception) {}
            }
        }
        bedtimeShield?.let { edit.putBoolean("bedtimeShield", it) }
        emergencyTrigger?.let { edit.putBoolean("emergencyTrigger", it) }
        ramCrunchSlayer?.let { edit.putBoolean("ramCrunchSlayer", it) }
        autoKillScheduler?.let { edit.putInt("autoKillScheduler", it) }
        bedtimeStart?.let { edit.putInt("bedtimeStart", it) }
        bedtimeEnd?.let { edit.putInt("bedtimeEnd", it) }
        edit.apply()

        val isAnyActive = prefs.getBoolean("quickActionNotifEnabled", quickActionNotifEnabled) ||
                prefs.getBoolean("bedtimeShield", false) ||
                prefs.getBoolean("emergencyTrigger", false) ||
                prefs.getBoolean("ramCrunchSlayer", false) ||
                prefs.getInt("autoKillScheduler", 0) > 0 ||
                prefs.getBoolean("autoHibernationEnabled", autoHibernationEnabled)
                
        val serviceIntent = Intent(context, BackgroundService::class.java)
        if (isAnyActive) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try { context.startForegroundService(serviceIntent) } catch (e: Exception) { context.startService(serviceIntent) }
            } else {
                context.startService(serviceIntent)
            }
        } else {
            context.stopService(serviceIntent)
        }
    }

    fun isIgnoringBatteryOptimizations(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
            return pm.isIgnoringBatteryOptimizations(context.packageName)
        }
        return true
    }

    fun requestIgnoreBatteryOptimizations(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
            intent.data = Uri.parse("package:" + context.packageName)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        } else {
            val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
        }
    }
}
