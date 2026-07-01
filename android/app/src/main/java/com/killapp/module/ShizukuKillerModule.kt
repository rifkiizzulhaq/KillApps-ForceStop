package com.killapp.module

import com.killapp.service.KillerForegroundService
import com.killapp.service.KillerNotificationHelper

import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.util.Base64
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
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
import java.io.ByteArrayOutputStream
import rikka.shizuku.Shizuku

class ShizukuKillerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), Shizuku.OnRequestPermissionResultListener {

    companion object {
        var autoHibernationEnabled = false
        val autoHibernationTargets = mutableSetOf<String>()
        var quickActionNotifEnabled = false
        val postponedPackages = mutableSetOf<String>()
    }

    private var permissionPromise: Promise? = null
    private var screenOffReceiver: BroadcastReceiver? = null
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
        screenOffReceiver?.let {
            try {
                reactApplicationContext.unregisterReceiver(it)
            } catch (e: Exception) {}
        }
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
            val successList = mutableListOf<String>()
            val failedList = mutableListOf<String>()
            try {
                val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                val gcmBypass = prefs.getBoolean("gcmWakeupBypass", true)
                val deepTrim = prefs.getBoolean("deepTrimMemory", false)
                val aggDoze = prefs.getBoolean("aggressiveDoze", false)

                val suProcess = Runtime.getRuntime().exec("su")
                val os = java.io.DataOutputStream(suProcess.outputStream)
                for (i in 0 until packageNames.size()) {
                    val pkg = packageNames.getString(i)
                    if (!pkg.isNullOrEmpty()) {
                        os.writeBytes("am force-stop $pkg\n")
                        if (gcmBypass) {
                            os.writeBytes("cmd appops set $pkg RUN_IN_BACKGROUND ignore\n")
                        }
                        os.flush()
                        successList.add(pkg)
                    }
                }
                if (deepTrim) {
                    os.writeBytes("am send-trim-memory --user 0 RUNNING_CRITICAL\n")
                }
                if (aggDoze) {
                    os.writeBytes("dumpsys deviceidle force-idle\n")
                }
                os.writeBytes("exit\n")
                os.flush()
                suProcess.waitFor()
            } catch (e: Exception) {
                for (i in 0 until packageNames.size()) {
                    val pkg = packageNames.getString(i)
                    if (!pkg.isNullOrEmpty() && !successList.contains(pkg)) {
                        failedList.add(pkg)
                    }
                }
            }
            val result = Arguments.createMap()
            val successArray = Arguments.createArray()
            val failedArray = Arguments.createArray()
            successList.forEach { successArray.pushString(it) }
            failedList.forEach { failedArray.pushString(it) }
            result.putArray("success", successArray)
            result.putArray("failed", failedArray)
            promise.resolve(result)
        }.start()
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        Thread {
            try {
                val packageManager = reactApplicationContext.packageManager
                val apps = packageManager.getInstalledApplications(PackageManager.GET_META_DATA)
                val targetApps = apps.filter { it.packageName != reactApplicationContext.packageName }

                val executor = java.util.concurrent.Executors.newFixedThreadPool(4)
                val futures = targetApps.map { app ->
                    executor.submit(java.util.concurrent.Callable {
                        val packageName = app.packageName
                        val appName = packageManager.getApplicationLabel(app).toString()
                        val isSystemApp = (app.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                        val isGcm = packageManager.checkPermission("com.google.android.c2dm.permission.RECEIVE", packageName) == PackageManager.PERMISSION_GRANTED
                        val isStopped = (app.flags and ApplicationInfo.FLAG_STOPPED) != 0

                        var iconBase64 = iconCache[packageName] ?: ""
                        if (iconBase64.isEmpty()) {
                            try {
                                val drawable = packageManager.getApplicationIcon(app)
                                val bitmap = if (drawable is BitmapDrawable && drawable.bitmap != null) {
                                    drawable.bitmap
                                } else {
                                    val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 72
                                    val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 72
                                    val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                                    val canvas = Canvas(bmp)
                                    drawable.setBounds(0, 0, canvas.width, canvas.height)
                                    drawable.draw(canvas)
                                    bmp
                                }
                                val scaledBitmap = Bitmap.createScaledBitmap(bitmap, 72, 72, true)
                                val stream = ByteArrayOutputStream()
                                scaledBitmap.compress(Bitmap.CompressFormat.PNG, 80, stream)
                                iconBase64 = "data:image/png;base64," + Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
                                iconCache[packageName] = iconBase64
                            } catch (e: Exception) {
                            }
                        }

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
            if (!Shizuku.pingBinder() || Shizuku.checkSelfPermission() != PackageManager.PERMISSION_GRANTED) {
                promise.reject("PERMISSION_DENIED", "Shizuku is not running or permission denied")
                return
            }

            val successList = Arguments.createArray()
            val failedList = Arguments.createArray()

            val clazz = Class.forName("rikka.shizuku.Shizuku")
            val method = clazz.getDeclaredMethod("newProcess", Array<String>::class.java, Array<String>::class.java, String::class.java)
            method.isAccessible = true

            val prefs = reactApplicationContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
            val gcmBypass = prefs.getBoolean("gcmWakeupBypass", true)
            val deepTrim = prefs.getBoolean("deepTrimMemory", false)
            val aggDoze = prefs.getBoolean("aggressiveDoze", false)

            for (i in 0 until packageNames.size()) {
                val pkg = packageNames.getString(i)
                try {
                    val process = method.invoke(null, arrayOf("sh", "-c", "am force-stop $pkg"), null, null) as Process
                    val exitCode = process.waitFor()
                    if (exitCode == 0) {
                        successList.pushString(pkg)
                        if (gcmBypass) {
                            try { method.invoke(null, arrayOf("sh", "-c", "cmd appops set $pkg RUN_IN_BACKGROUND ignore"), null, null) } catch (e: Exception) {}
                        }
                    } else {
                        failedList.pushString(pkg)
                    }
                } catch (e: Exception) {
                    failedList.pushString(pkg)
                }
            }

            if (deepTrim) {
                try { method.invoke(null, arrayOf("sh", "-c", "am send-trim-memory --user 0 RUNNING_CRITICAL"), null, null) } catch (e: Exception) {}
            }
            if (aggDoze) {
                try { method.invoke(null, arrayOf("sh", "-c", "dumpsys deviceidle force-idle"), null, null) } catch (e: Exception) {}
            }

            val resultMap = Arguments.createMap()
            resultMap.putArray("success", successList)
            resultMap.putArray("failed", failedList)
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
        prefs.edit().putStringSet("autoHibernationTargets", autoHibernationTargets).putStringSet("postponedPackages", postponedPackages).apply()
        if (enabled && screenOffReceiver == null) {
            screenOffReceiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context?, intent: Intent?) {
                    if (intent?.action == Intent.ACTION_SCREEN_OFF && autoHibernationEnabled && autoHibernationTargets.isNotEmpty()) {
                        postponedPackages.clear()
                        Thread {
                            try {
                                if (Shizuku.pingBinder() && Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED) {
                                    val clazz = Class.forName("rikka.shizuku.Shizuku")
                                    val method = clazz.getDeclaredMethod("newProcess", Array<String>::class.java, Array<String>::class.java, String::class.java)
                                    method.isAccessible = true
                                    for (pkg in autoHibernationTargets) {
                                        try {
                                            val cmd = arrayOf("sh", "-c", "am force-stop $pkg")
                                            val process = method.invoke(null, cmd, null, null) as Process
                                            process.waitFor()
                                        } catch (e: Exception) {}
                                    }
                                }
                            } catch (e: Exception) {}
                        }.start()
                    }
                }
            }
            val filter = IntentFilter(Intent.ACTION_SCREEN_OFF)
            reactApplicationContext.registerReceiver(screenOffReceiver, filter)
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
                    val nm = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                    if (action == "com.killapp.ACTION_FREEZE_ALL") {
                        postponedPackages.clear()
                        notificationHelper.cancelAllNotifications()
                        Thread {
                            try {
                                if (Shizuku.pingBinder() && Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED) {
                                    val clazz = Class.forName("rikka.shizuku.Shizuku")
                                    val method = clazz.getDeclaredMethod("newProcess", Array<String>::class.java, Array<String>::class.java, String::class.java)
                                    method.isAccessible = true
                                    var count = 0
                                    for (pkg in autoHibernationTargets) {
                                        try {
                                            val process = method.invoke(null, arrayOf("sh", "-c", "am force-stop $pkg"), null, null) as Process
                                            if (process.waitFor() == 0) count++
                                        } catch (e: Exception) {}
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
                        notificationHelper.cancelPackageNotification(targetPkg)
                        updateNotificationDisplay()
                    } else if (action == "com.killapp.ACTION_FREEZE_PKG") {
                        val targetPkg = intent.getStringExtra("pkg") ?: return
                        val targetName = intent.getStringExtra("name") ?: targetPkg
                        postponedPackages.remove(targetPkg)
                        notificationHelper.cancelPackageNotification(targetPkg)
                        Thread {
                            try {
                                if (Shizuku.pingBinder() && Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED) {
                                    val clazz = Class.forName("rikka.shizuku.Shizuku")
                                    val method = clazz.getDeclaredMethod("newProcess", Array<String>::class.java, Array<String>::class.java, String::class.java)
                                    method.isAccessible = true
                                    val process = method.invoke(null, arrayOf("sh", "-c", "am force-stop $targetPkg"), null, null) as Process
                                    process.waitFor()
                                    Thread.sleep(700)
                                    Handler(Looper.getMainLooper()).post {
                                        Toast.makeText(reactApplicationContext, "$targetName berhasil di-kill!", Toast.LENGTH_SHORT).show()
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
            reactApplicationContext.stopService(serviceIntent)
        }
        updateNotificationDisplay(true)
    }

    private fun updateNotificationDisplay(force: Boolean = true) {
        notificationHelper.updateDisplay(quickActionNotifEnabled, autoHibernationTargets, postponedPackages, force)
    }
}
