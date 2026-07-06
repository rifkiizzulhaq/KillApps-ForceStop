package com.killapp.module

import com.killapp.service.KillerAppListHelper
import com.killapp.service.KillerExecutionHelper
import com.killapp.service.KillerForegroundService
import com.killapp.service.KillerNotificationHelper
import com.killapp.service.ShizukuCommandHelper

import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.app.NotificationManager
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
import com.killapp.service.KillerForensicHelper
import rikka.shizuku.Shizuku

class ShizukuKillerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), Shizuku.OnRequestPermissionResultListener {

    companion object {
        var autoHibernationEnabled = false
        val autoHibernationTargets = mutableSetOf<String>()
        var quickActionNotifEnabled = false
        val postponedPackages = mutableSetOf<String>()
    }

    private var permissionPromise: Promise? = null
    private var quickActionReceiver: BroadcastReceiver? = null
    private var pollingHandler: Handler? = null
    private val iconCache = java.util.concurrent.ConcurrentHashMap<String, String>()
    private val notificationHelper by lazy { KillerNotificationHelper(reactApplicationContext) }

    init {
        Shizuku.addRequestPermissionResultListener(this)
    }

    override fun getName(): String = "ShizukuKillerModule"

    override fun invalidate() {
        super.invalidate()
        Shizuku.removeRequestPermissionResultListener(this)
        quickActionReceiver?.let {
            try {
                reactApplicationContext.unregisterReceiver(it)
            } catch (e: Exception) {}
        }
        pollingHandler?.removeCallbacksAndMessages(null)
    }

    @ReactMethod
    fun setWorkingMode(mode: String) {
        val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("workingMode", mode).apply()
    }

    @ReactMethod
    fun setGeekOptions(aggressiveDoze: Boolean, gcmWakeupBypass: Boolean, deepTrimMemory: Boolean) {
        val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putBoolean("aggressiveDoze", aggressiveDoze)
            .putBoolean("gcmWakeupBypass", gcmWakeupBypass)
            .putBoolean("deepTrimMemory", deepTrimMemory)
            .apply()
    }

    @ReactMethod
    fun setHibernationOptions(smart: Boolean, finerMedia: Boolean, shallow: Boolean, wakeUp: Boolean, dontRemoveNotif: Boolean, ignoreBackgroundFree: Boolean) {
        val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putBoolean("smartHibernation", smart)
            .putBoolean("finerMediaDetection", finerMedia)
            .putBoolean("shallowHibernation", shallow)
            .putBoolean("wakeUpTracking", wakeUp)
            .putBoolean("dontRemoveNotif", dontRemoveNotif)
            .putBoolean("ignoreBackgroundFree", ignoreBackgroundFree)
            .apply()
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
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
                val isIgnored = pm.isIgnoringBatteryOptimizations(reactApplicationContext.packageName)
                promise.resolve(isIgnored)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun requestIgnoreBatteryOptimizations(promise: Promise) {
        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                intent.data = Uri.parse("package:" + reactApplicationContext.packageName)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            try {
                val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(intent)
                promise.resolve(true)
            } catch (ex: Exception) {
                promise.reject("ERROR", ex.message)
            }
        }
    }

    @ReactMethod
    fun killAppsViaRoot(packageNames: ReadableArray, promise: Promise) {
        Thread {
            try {
                val result = KillerExecutionHelper.killAppsViaRoot(reactApplicationContext, packageNames)
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
                val result = KillerAppListHelper.getInstalledApps(reactApplicationContext, iconCache)
                updateNotificationDisplay(true)
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("GET_APPS_ERROR", e.message)
            }
        }.start()
    }

    @ReactMethod
    fun killApps(packageNames: ReadableArray, promise: Promise) {
        try {
            if (!ShizukuCommandHelper.isShizukuReady()) {
                promise.reject("PERMISSION_DENIED", "Shizuku is not running or permission denied")
                return
            }
            val resultMap = KillerExecutionHelper.killAppsShizuku(reactApplicationContext, packageNames)
            updateNotificationDisplay(true)
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
        autoHibernationEnabled = enabled
        autoHibernationTargets.clear()
        postponedPackages.clear()
        for (i in 0 until packages.size()) {
            packages.getString(i)?.let { autoHibernationTargets.add(it) }
        }
        val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putBoolean("autoHibernationEnabled", autoHibernationEnabled)
            .putStringSet("autoHibernationTargets", autoHibernationTargets)
            .putStringSet("postponedPackages", postponedPackages)
            .apply()

        if (enabled) {
            val serviceIntent = Intent(reactApplicationContext, com.killapp.service.KillerForegroundService::class.java)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                try { reactApplicationContext.startForegroundService(serviceIntent) } catch (e: Exception) { reactApplicationContext.startService(serviceIntent) }
            } else {
                reactApplicationContext.startService(serviceIntent)
            }
        }

        updateNotificationDisplay()
    }

    @ReactMethod
    fun setQuickActionNotification(enabled: Boolean) {
        quickActionNotifEnabled = enabled
        if (enabled && quickActionReceiver == null) {
            quickActionReceiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context?, intent: Intent?) {
                    val action = intent?.action ?: return
                    if (action == "com.killapp.ACTION_FREEZE_ALL") {
                        postponedPackages.clear()
                        val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                        prefs.edit().putStringSet("postponedPackages", postponedPackages).apply()
                        notificationHelper.cancelAllNotifications()
                        Thread {
                        try {
                            val mode = prefs.getString("workingMode", "shizuku") ?: "shizuku"
                            val isReady = if (mode == "root") true else ShizukuCommandHelper.isShizukuReady()
                            if (isReady) {
                                var count = 0
                                val pm = reactApplicationContext.packageManager
                                for (pkg in autoHibernationTargets) {
                                    val isRunning = try {
                                        val info = pm.getApplicationInfo(pkg, 0)
                                        (info.flags and ApplicationInfo.FLAG_STOPPED) == 0
                                    } catch (e: Exception) { false }
                                    if (isRunning && KillerExecutionHelper.killSinglePackageInternal(reactApplicationContext, pkg)) {
                                        count++
                                    }
                                }
                                Thread.sleep(700)
                                Handler(Looper.getMainLooper()).post {
                                    Toast.makeText(reactApplicationContext, "$count aplikasi berhasil di-kill!", Toast.LENGTH_SHORT).show()
                                    try {
                                        reactApplicationContext
                                            .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                                            .emit("onAppsFrozen", null)
                                    } catch (e: Exception) {}
                                    updateNotificationDisplay()
                                }
                            }
                        } catch (e: Exception) {}
                    }.start()
                    } else if (action == "com.killapp.ACTION_POSTPONE_PKG") {
                        val targetPkg = intent.getStringExtra("pkg") ?: return
                        postponedPackages.add(targetPkg)
                        val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                        prefs.edit().putStringSet("postponedPackages", postponedPackages).apply()
                        Handler(Looper.getMainLooper()).post {
                            Toast.makeText(reactApplicationContext, "Kill ditunda sementara", Toast.LENGTH_SHORT).show()
                        }
                        updateNotificationDisplay()
                    } else if (action == "com.killapp.ACTION_FREEZE_PKG") {
                        val targetPkg = intent.getStringExtra("pkg") ?: return
                        val targetName = intent.getStringExtra("name") ?: targetPkg
                        postponedPackages.remove(targetPkg)
                        val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                        prefs.edit().putStringSet("postponedPackages", postponedPackages).apply()
                        Thread {
                            try {
                                val killPrefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                                val mode = killPrefs.getString("workingMode", "shizuku") ?: "shizuku"
                                val isReady = if (mode == "root") true else ShizukuCommandHelper.isShizukuReady()
                                if (isReady) {
                                    val success = KillerExecutionHelper.killSinglePackageInternal(reactApplicationContext, targetPkg)
                                    Thread.sleep(700)
                                    Handler(Looper.getMainLooper()).post {
                                        val msg = if (success) "$targetName berhasil di-kill!" else "Gagal mematikan $targetName."
                                        Toast.makeText(reactApplicationContext, msg, Toast.LENGTH_SHORT).show()
                                        try {
                                            reactApplicationContext
                                                .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                                                .emit("onAppsFrozen", null)
                                        } catch (e: Exception) {}
                                        updateNotificationDisplay()
                                    }
                                }
                            } catch (e: Exception) {}
                        }.start()
                    }
                }
            }
            val filter = IntentFilter()
            filter.addAction("com.killapp.ACTION_FREEZE_ALL")
            filter.addAction("com.killapp.ACTION_FREEZE_PKG")
            filter.addAction("com.killapp.ACTION_POSTPONE_PKG")
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                reactApplicationContext.registerReceiver(quickActionReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                reactApplicationContext.registerReceiver(quickActionReceiver, filter)
            }
        }
        if (pollingHandler == null) {
            pollingHandler = Handler(Looper.getMainLooper())
        }
        pollingHandler?.removeCallbacksAndMessages(null)
        val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("quickActionNotifEnabled", enabled).apply()
        val serviceIntent = Intent(reactApplicationContext, KillerForegroundService::class.java)
        if (enabled) {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                try {
                    reactApplicationContext.startForegroundService(serviceIntent)
                } catch (e: Exception) {
                    reactApplicationContext.startService(serviceIntent)
                }
            } else {
                reactApplicationContext.startService(serviceIntent)
            }
        } else {
            val isAnyActive = prefs.getBoolean("bedtimeShield", false) ||
                prefs.getBoolean("emergencyTrigger", false) ||
                prefs.getBoolean("ramCrunchSlayer", false) ||
                prefs.getInt("autoKillScheduler", 0) > 0 ||
                prefs.getBoolean("autoHibernationEnabled", autoHibernationEnabled)
            if (!isAnyActive) reactApplicationContext.stopService(serviceIntent)
        }
        updateNotificationDisplay(true)
    }

    @ReactMethod
    fun freezeQuarantinePackage(pkg: String, freeze: Boolean, promise: Promise) {
        Thread {
            try {
                val result = com.facebook.react.bridge.Arguments.createMap()
                if (freeze) {
                    val webviewPackages = setOf("com.android.chrome", "com.google.android.webview", "com.android.webview")
                    val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                    val mode = prefs.getString("workingMode", "shizuku") ?: "shizuku"

                    if (webviewPackages.contains(pkg)) {
                        val webviewInfo = if (mode == "root") {
                            try {
                                val p = Runtime.getRuntime().exec(arrayOf("su", "-c", "dumpsys webviewupdate"))
                                val reader = java.io.BufferedReader(java.io.InputStreamReader(p.inputStream))
                                val output = StringBuilder()
                                var line: String?
                                while (reader.readLine().also { line = it } != null) {
                                    output.append(line).append("\n")
                                }
                                p.waitFor()
                                output.toString()
                            } catch (e: Exception) { "" }
                        } else {
                            ShizukuCommandHelper.executeCommandWithOutput("dumpsys webviewupdate")
                        }
                        
                        val isActiveWebView = webviewInfo.contains("Current WebView package") &&
                            webviewInfo.substringAfter("Current WebView package").take(100).contains(pkg)
                        if (isActiveWebView) {
                            result.putBoolean("success", false)
                            result.putString("errorCode", "webview_provider")
                            promise.resolve(result)
                            return@Thread
                        }
                    }
                    val cmd = "pm disable-user --user 0 $pkg"
                    val exitCode = if (mode == "root") {
                        try { Runtime.getRuntime().exec(arrayOf("su", "-c", cmd)).waitFor() } catch (e: Exception) { -1 }
                    } else {
                        ShizukuCommandHelper.executeCommand(cmd)
                    }
                    
                    if (exitCode == 0) {
                        val set = (prefs.getStringSet("quarantinePackages", setOf()) ?: setOf()).toMutableSet()
                        set.add(pkg)
                        prefs.edit().putStringSet("quarantinePackages", set).apply()
                        result.putBoolean("success", true)
                        result.putString("errorCode", "ok")
                    } else {
                        result.putBoolean("success", false)
                        result.putString("errorCode", "system_protected")
                    }
                } else {
                    val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                    val mode = prefs.getString("workingMode", "shizuku") ?: "shizuku"
                    val cmd = "pm enable $pkg"
                    val exitCode = if (mode == "root") {
                        try { Runtime.getRuntime().exec(arrayOf("su", "-c", cmd)).waitFor() } catch (e: Exception) { -1 }
                    } else {
                        ShizukuCommandHelper.executeCommand(cmd)
                    }
                    
                    val set = (prefs.getStringSet("quarantinePackages", setOf()) ?: setOf()).toMutableSet()
                    set.remove(pkg)
                    prefs.edit().putStringSet("quarantinePackages", set).apply()
                    result.putBoolean("success", exitCode == 0)
                    result.putString("errorCode", if (exitCode == 0) "ok" else "unfreeze_failed")
                }
                promise.resolve(result)
            } catch (e: Exception) {
                val result = com.facebook.react.bridge.Arguments.createMap()
                result.putBoolean("success", false)
                result.putString("errorCode", "exception")
                promise.resolve(result)
            }
        }.start()
    }

    @ReactMethod
    fun getQuarantinePackages(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
            val set = prefs.getStringSet("quarantinePackages", setOf()) ?: setOf()
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
            val map = KillerForensicHelper.getImpactAnalytics(reactApplicationContext)
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("ANALYTICS_ERR", e.message)
        }
    }

    @ReactMethod
    fun getResurrectionDetectiveReport(promise: Promise) {
        try {
            val arr = KillerForensicHelper.getResurrectionReport(reactApplicationContext)
            promise.resolve(arr)
        } catch (e: Exception) {
            promise.reject("FORENSIC_ERR", e.message)
        }
    }

    @ReactMethod
    fun setProOptions(options: ReadableMap) {
        val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        val edit = prefs.edit()
        if (options.hasKey("phantomSlayer")) {
            val enabled = options.getBoolean("phantomSlayer")
            edit.putBoolean("phantomSlayer", enabled)
            if (enabled && android.os.Build.VERSION.SDK_INT >= 31) {
                try { ShizukuCommandHelper.executeCommand("settings put global settings_enable_monitor_phantom_procs false") } catch (e: Exception) {}
            }
        }
        if (options.hasKey("bedtimeShield")) edit.putBoolean("bedtimeShield", options.getBoolean("bedtimeShield"))
        if (options.hasKey("emergencyTrigger")) edit.putBoolean("emergencyTrigger", options.getBoolean("emergencyTrigger"))
        if (options.hasKey("ramCrunchSlayer")) edit.putBoolean("ramCrunchSlayer", options.getBoolean("ramCrunchSlayer"))
        if (options.hasKey("autoKillScheduler")) edit.putInt("autoKillScheduler", options.getInt("autoKillScheduler"))
        if (options.hasKey("bedtimeStart")) edit.putInt("bedtimeStart", options.getInt("bedtimeStart"))
        if (options.hasKey("bedtimeEnd")) edit.putInt("bedtimeEnd", options.getInt("bedtimeEnd"))
        edit.apply()

        val isAnyActive = prefs.getBoolean("quickActionNotifEnabled", quickActionNotifEnabled) ||
                prefs.getBoolean("bedtimeShield", false) ||
                prefs.getBoolean("emergencyTrigger", false) ||
                prefs.getBoolean("ramCrunchSlayer", false) ||
                prefs.getInt("autoKillScheduler", 0) > 0
        val serviceIntent = Intent(reactApplicationContext, KillerForegroundService::class.java)
        if (isAnyActive) {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                try { reactApplicationContext.startForegroundService(serviceIntent) } catch (e: Exception) { reactApplicationContext.startService(serviceIntent) }
            } else {
                reactApplicationContext.startService(serviceIntent)
            }
        } else {
            reactApplicationContext.stopService(serviceIntent)
        }
    }

    private fun updateNotificationDisplay(force: Boolean = true) {
        notificationHelper.updateDisplay(quickActionNotifEnabled, autoHibernationTargets, postponedPackages, force)
    }
}
