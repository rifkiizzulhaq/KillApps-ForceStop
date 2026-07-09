package com.killapp.bridge
import com.killapp.utils.AppListFetcher
import com.killapp.core.execution.ProcessKiller
import com.killapp.core.ui.BackgroundService
import com.killapp.core.ui.NotificationManager
import com.killapp.core.execution.ProtectionFilter
import com.killapp.core.command.CommandExecutor
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import android.widget.Toast
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.killapp.core.forensic.ForensicAnalyzer
import rikka.shizuku.Shizuku

class CoreKillerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), Shizuku.OnRequestPermissionResultListener {

    private var permissionPromise: Promise? = null
    private val iconCache = java.util.concurrent.ConcurrentHashMap<String, String>()
    private val serviceStateManager by lazy { com.killapp.core.ui.ServiceStateManager(reactApplicationContext) }

    init {
        Shizuku.addRequestPermissionResultListener(this)
    }

    override fun getName(): String {
        return "CoreKillerModule"
    }

    override fun getConstants(): Map<String, Any> {
        val constants = HashMap<String, Any>()
        
        val criticalArray = com.facebook.react.bridge.Arguments.createArray()
        com.killapp.core.execution.ProtectionFilter.criticalPackages.forEach { criticalArray.pushString(it) }
        constants["CRITICAL_PACKAGES"] = criticalArray

        val mediaArray = com.facebook.react.bridge.Arguments.createArray()
        com.killapp.core.execution.ProtectionFilter.mediaPackages.forEach { mediaArray.pushString(it) }
        constants["MEDIA_PACKAGES"] = mediaArray

        return constants
    }

    override fun invalidate() {
        super.invalidate()
        Shizuku.removeRequestPermissionResultListener(this)
        serviceStateManager.invalidate()
    }

    @ReactMethod
    fun setWorkingMode(mode: String) {
        com.killapp.core.ui.SettingsManager.setWorkingMode(reactApplicationContext, mode)
    }

    @ReactMethod
    fun setGeekOptions(aggressiveDoze: Boolean, gcmWakeupBypass: Boolean, deepTrimMemory: Boolean) {
        com.killapp.core.ui.SettingsManager.setGeekOptions(reactApplicationContext, aggressiveDoze, gcmWakeupBypass, deepTrimMemory)
    }

    @ReactMethod
    fun setHibernationOptions(smart: Boolean, finerMedia: Boolean, shallow: Boolean, wakeUp: Boolean, dontRemoveNotif: Boolean, ignoreBackgroundFree: Boolean) {
        com.killapp.core.ui.SettingsManager.setHibernationOptions(reactApplicationContext, smart, finerMedia, shallow, wakeUp, dontRemoveNotif, ignoreBackgroundFree)
    }

    @ReactMethod
    fun checkBinder(promise: Promise) {
        try {
            val isBinderAlive = Shizuku.pingBinder()
            promise.resolve(isBinderAlive)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun checkPermission(promise: Promise) {
        try {
            if (!Shizuku.pingBinder()) {
                promise.resolve(false)
                return
            }
            val isGranted = Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED
            promise.resolve(isGranted)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun requestPermission(promise: Promise) {
        try {
            if (!Shizuku.pingBinder()) {
                promise.reject("SHIZUKU_NOT_RUNNING", "Shizuku binder is not running")
                return
            }
            if (Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED) {
                promise.resolve(true)
                return
            }
            permissionPromise = promise
            Shizuku.requestPermission(1001)
        } catch (e: Exception) {
            promise.reject("SHIZUKU_ERROR", e.message)
        }
    }

    override fun onRequestPermissionResult(requestCode: Int, grantResult: Int) {
        if (requestCode == 1001) {
            val isGranted = grantResult == PackageManager.PERMISSION_GRANTED
            permissionPromise?.resolve(isGranted)
            permissionPromise = null
        }
    }

    @ReactMethod
    fun checkRootAccess(promise: Promise) {
        Thread {
            try {
                val process = Runtime.getRuntime().exec(arrayOf("su", "-c", "id"))
                val exitCode = process.waitFor()
                val isRoot = (exitCode == 0)
                val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                prefs.edit().putBoolean("isRootActive", isRoot).apply()
                promise.resolve(isRoot)
            } catch (e: Exception) {
                val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                prefs.edit().putBoolean("isRootActive", false).apply()
                promise.resolve(false)
            }
        }.start()
    }

    @ReactMethod
    fun isIgnoringBatteryOptimizations(promise: Promise) {
        try {
            promise.resolve(com.killapp.core.ui.SettingsManager.isIgnoringBatteryOptimizations(reactApplicationContext))
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun requestIgnoreBatteryOptimizations(promise: Promise) {
        try {
            com.killapp.core.ui.SettingsManager.requestIgnoreBatteryOptimizations(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun killAppsViaRoot(packageNames: ReadableArray, promise: Promise) {
        Thread {
            try {
                val result = ProcessKiller.killApps(reactApplicationContext, packageNames)
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("KILL_ROOT_ERROR", e.message)
            }
        }.start()
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        Thread {
            try {
                val result = AppListFetcher.getInstalledApps(reactApplicationContext, iconCache)
                serviceStateManager.updateNotificationDisplay(true)
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("GET_APPS_ERROR", e.message)
            }
        }.start()
    }

    @ReactMethod
    fun killApps(packageNames: ReadableArray, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
            val mode = prefs.getString("workingMode", "shizuku") ?: "shizuku"
            
            if (mode != "root" && !CommandExecutor.isShizukuReady()) {
                promise.reject("PERMISSION_DENIED", "Shizuku is not running or permission denied")
                return
            }
            val resultMap = ProcessKiller.killApps(reactApplicationContext, packageNames)
            serviceStateManager.updateNotificationDisplay(true)
            promise.resolve(resultMap)
        } catch (e: Exception) {
            promise.reject("KILL_ERROR", e.message)
        }
    }

    @ReactMethod
    fun checkInitialQuickFreeze(promise: Promise) {
        try {
            val activity = currentActivity
            if (activity != null && activity.intent?.getBooleanExtra("open_quick_freeze", false) == true) {
                activity.intent.putExtra("open_quick_freeze", false)
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun setAutoHibernationConfig(enabled: Boolean, packages: ReadableArray) {
        serviceStateManager.setAutoHibernationConfig(enabled, packages)
    }

    @ReactMethod
    fun setQuickActionNotification(enabled: Boolean) {
        serviceStateManager.setQuickActionNotification(enabled)
    }

    @ReactMethod
    fun freezeQuarantinePackage(pkg: String, freeze: Boolean, promise: Promise) {
        Thread {
            try {
                val result = com.killapp.core.execution.QuarantineManager.freezePackage(reactApplicationContext, pkg, freeze)
                val map = com.facebook.react.bridge.Arguments.createMap()
                map.putBoolean("success", result["success"] as Boolean)
                map.putString("errorCode", result["errorCode"] as String)
                promise.resolve(map)
            } catch (e: Exception) {
                val map = com.facebook.react.bridge.Arguments.createMap()
                map.putBoolean("success", false)
                map.putString("errorCode", "exception")
                promise.resolve(map)
            }
        }.start()
    }

    @ReactMethod
    fun getQuarantinePackages(promise: Promise) {
        try {
            val set = com.killapp.core.execution.QuarantineManager.getQuarantinePackages(reactApplicationContext)
            val array = com.facebook.react.bridge.Arguments.createArray()
            for (pkg in set) array.pushString(pkg)
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("QUARANTINE_ERR", e.message)
        }
    }

    @ReactMethod
    fun showTimePicker(currentHour: Int, currentMinute: Int, promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No activity available")
            return
        }
        Handler(Looper.getMainLooper()).post {
            android.app.TimePickerDialog(
                activity,
                { _, hourOfDay, minute -> promise.resolve(hourOfDay * 60 + minute) },
                currentHour, currentMinute, true
            ).apply {
                setOnCancelListener { promise.reject("CANCELLED", "Cancelled") }
                show()
            }
        }
    }

    @ReactMethod
    fun getImpactAnalytics(promise: Promise) {
        try {
            val map = ForensicAnalyzer.getImpactAnalytics(reactApplicationContext)
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("ANALYTICS_ERR", e.message)
        }
    }

    @ReactMethod
    fun getResurrectionDetectiveReport(promise: Promise) {
        try {
            val arr = ForensicAnalyzer.getResurrectionReport(reactApplicationContext)
            promise.resolve(arr)
        } catch (e: Exception) {
            promise.reject("FORENSIC_ERR", e.message)
        }
    }

    @ReactMethod
    fun setProOptions(options: ReadableMap) {
        val phantomSlayer = if (options.hasKey("phantomSlayer")) options.getBoolean("phantomSlayer") else null
        val bedtimeShield = if (options.hasKey("bedtimeShield")) options.getBoolean("bedtimeShield") else null
        val emergencyTrigger = if (options.hasKey("emergencyTrigger")) options.getBoolean("emergencyTrigger") else null
        val ramCrunchSlayer = if (options.hasKey("ramCrunchSlayer")) options.getBoolean("ramCrunchSlayer") else null
        val autoKillScheduler = if (options.hasKey("autoKillScheduler")) options.getInt("autoKillScheduler") else null
        val bedtimeStart = if (options.hasKey("bedtimeStart")) options.getInt("bedtimeStart") else null
        val bedtimeEnd = if (options.hasKey("bedtimeEnd")) options.getInt("bedtimeEnd") else null
        
        com.killapp.core.ui.SettingsManager.setProOptions(
            reactApplicationContext,
            phantomSlayer, bedtimeShield, emergencyTrigger, ramCrunchSlayer, autoKillScheduler, bedtimeStart, bedtimeEnd,
            com.killapp.core.ui.ServiceStateManager.quickActionNotifEnabled,
            com.killapp.core.ui.ServiceStateManager.autoHibernationEnabled
        )
    }
}
