package com.killapp.core.ui

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import com.killapp.core.command.CommandExecutor

class QuickActionReceiver(
    private val reactContext: com.facebook.react.bridge.ReactApplicationContext,
    private val notificationManager: NotificationManager,
    private val autoHibernationTargets: Set<String>,
    private val postponedPackages: MutableSet<String>,
    private val updateDisplay: () -> Unit
) : BroadcastReceiver() {

    override fun onReceive(context: Context?, intent: Intent?) {
        val action = intent?.action ?: return
        val prefs = reactContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)

        when (action) {
            "com.killapp.ACTION_FREEZE_ALL" -> {
                postponedPackages.clear()
                prefs.edit().putStringSet("postponedPackages", postponedPackages).apply()
                notificationManager.cancelAllNotifications()
                
                Thread {
                    try {
                        val mode = prefs.getString("workingMode", "shizuku") ?: "shizuku"
                        val isReady = if (mode == "root") true else CommandExecutor.isShizukuReady()
                        if (isReady) {
                            var count = 0
                            val pm = reactContext.packageManager
                            for (pkg in autoHibernationTargets) {
                                val isRunning = try {
                                    val info = pm.getApplicationInfo(pkg, 0)
                                    (info.flags and ApplicationInfo.FLAG_STOPPED) == 0
                                } catch (e: Exception) { false }
                                if (isRunning && (CommandExecutor.executeCommand(reactContext, "am force-stop $pkg") == 0)) {
                                    count++
                                }
                            }
                            Thread.sleep(700)
                            Handler(Looper.getMainLooper()).post {
                                Toast.makeText(reactContext, "$count aplikasi berhasil di-kill!", Toast.LENGTH_SHORT).show()
                                try {
                                    reactContext
                                        .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                                        .emit("onAppsFrozen", null)
                                } catch (e: Exception) {}
                                updateDisplay()
                            }
                        }
                    } catch (e: Exception) {}
                }.start()
            }
            "com.killapp.ACTION_POSTPONE_PKG" -> {
                val targetPkg = intent.getStringExtra("pkg") ?: return
                postponedPackages.add(targetPkg)
                prefs.edit().putStringSet("postponedPackages", postponedPackages).apply()
                Handler(Looper.getMainLooper()).post {
                    Toast.makeText(reactContext, "Kill ditunda sementara", Toast.LENGTH_SHORT).show()
                }
                updateDisplay()
            }
            "com.killapp.ACTION_FREEZE_PKG" -> {
                val targetPkg = intent.getStringExtra("pkg") ?: return
                val targetName = intent.getStringExtra("name") ?: targetPkg
                postponedPackages.remove(targetPkg)
                prefs.edit().putStringSet("postponedPackages", postponedPackages).apply()
                
                Thread {
                    try {
                        val mode = prefs.getString("workingMode", "shizuku") ?: "shizuku"
                        val isReady = if (mode == "root") true else CommandExecutor.isShizukuReady()
                        if (isReady) {
                            val success = (CommandExecutor.executeCommand(reactContext, "am force-stop $targetPkg") == 0)
                            Thread.sleep(700)
                            Handler(Looper.getMainLooper()).post {
                                val msg = if (success) "$targetName berhasil di-kill!" else "Gagal mematikan $targetName."
                                Toast.makeText(reactContext, msg, Toast.LENGTH_SHORT).show()
                                try {
                                    reactContext
                                        .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                                        .emit("onAppsFrozen", null)
                                } catch (e: Exception) {}
                                updateDisplay()
                            }
                        }
                    } catch (e: Exception) {}
                }.start()
            }
        }
    }
}
