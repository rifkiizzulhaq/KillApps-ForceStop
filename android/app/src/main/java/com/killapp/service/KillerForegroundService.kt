package com.killapp.service

import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import com.killapp.module.ShizukuKillerModule

class KillerForegroundService : Service() {
    private var handler: Handler? = null
    private lateinit var helper: KillerNotificationHelper

    override fun onCreate() {
        super.onCreate()
        helper = KillerNotificationHelper(this)
        handler = Handler(Looper.getMainLooper())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notif = helper.buildServiceNotification()
        startForeground(888, notif)

        startMonitoring()
        return START_STICKY
    }

    private fun startMonitoring() {
        handler?.removeCallbacksAndMessages(null)
        handler?.post(object : Runnable {
            override fun run() {
                val prefs = getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                val enabled = prefs.getBoolean("quickActionNotifEnabled", ShizukuKillerModule.quickActionNotifEnabled)
                if (enabled) {
                    val targets = prefs.getStringSet("autoHibernationTargets", ShizukuKillerModule.autoHibernationTargets) ?: setOf()
                    val postponed = prefs.getStringSet("postponedPackages", ShizukuKillerModule.postponedPackages) ?: setOf()
                    helper.updateDisplay(
                        true,
                        targets,
                        postponed,
                        false
                    )
                    handler?.postDelayed(this, 2000)
                } else {
                    stopSelf()
                }
            }
        })
    }

    override fun onDestroy() {
        super.onDestroy()
        handler?.removeCallbacksAndMessages(null)
        helper.cancelAllNotifications()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
