package com.killapp.core.command

import android.content.Context
import android.content.pm.PackageManager
import rikka.shizuku.Shizuku

object CommandExecutor {

    fun isShizukuReady(): Boolean {
        return try {
            Shizuku.pingBinder() && Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED
        } catch (e: Exception) {
            false
        }
    }

    private fun getWorkingMode(context: Context): String {
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        return prefs.getString("workingMode", "shizuku") ?: "shizuku"
    }

    fun executeCommand(context: Context, command: String): Int {
        val mode = getWorkingMode(context)
        
        return try {
            if (mode == "root") {
                val process = Runtime.getRuntime().exec(arrayOf("su", "-c", command))
                process.waitFor()
            } else {
                if (!isShizukuReady()) return -1
                val clazz = Class.forName("rikka.shizuku.Shizuku")
                val method = clazz.getDeclaredMethod("newProcess", Array<String>::class.java, Array<String>::class.java, String::class.java)
                method.isAccessible = true
                val process = method.invoke(null, arrayOf("sh", "-c", command), null, null) as Process
                process.waitFor()
            }
        } catch (e: Exception) {
            -1
        }
    }

    fun executeCommandWithOutput(context: Context, command: String): String {
        val mode = getWorkingMode(context)
        
        return try {
            val process = if (mode == "root") {
                Runtime.getRuntime().exec(arrayOf("su", "-c", "$command 2>&1"))
            } else {
                if (!isShizukuReady()) return ""
                val clazz = Class.forName("rikka.shizuku.Shizuku")
                val method = clazz.getDeclaredMethod("newProcess", Array<String>::class.java, Array<String>::class.java, String::class.java)
                method.isAccessible = true
                method.invoke(null, arrayOf("sh", "-c", "$command 2>&1"), null, null) as Process
            }
            
            val reader = java.io.BufferedReader(java.io.InputStreamReader(process.inputStream))
            val output = java.lang.StringBuilder()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                output.append(line).append("\n")
            }
            process.waitFor()
            output.toString()
        } catch (e: Exception) {
            ""
        }
    }

    fun forceStopPackage(context: Context, packageName: String): Boolean {
        return executeCommand(context, "am force-stop $packageName") == 0
    }
}

