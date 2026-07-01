package com.killapp.service

import android.content.pm.PackageManager
import rikka.shizuku.Shizuku

object ShizukuCommandHelper {

    fun isShizukuReady(): Boolean {
        return try {
            Shizuku.pingBinder() && Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED
        } catch (e: Exception) {
            false
        }
    }

    fun executeCommand(command: String): Int {
        return try {
            if (!isShizukuReady()) return -1
            val clazz = Class.forName("rikka.shizuku.Shizuku")
            val method = clazz.getDeclaredMethod("newProcess", Array<String>::class.java, Array<String>::class.java, String::class.java)
            method.isAccessible = true
            val process = method.invoke(null, arrayOf("sh", "-c", command), null, null) as Process
            process.waitFor()
        } catch (e: Exception) {
            -1
        }
    }

    fun forceStopPackage(packageName: String): Boolean {
        return executeCommand("am force-stop $packageName") == 0
    }
}
