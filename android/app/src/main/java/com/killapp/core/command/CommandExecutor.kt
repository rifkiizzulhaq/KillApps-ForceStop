package com.killapp.core.command

import android.content.Context
import android.content.pm.PackageManager
import rikka.shizuku.Shizuku

object RootShell {
    private var process: Process? = null
    private var writer: java.io.BufferedWriter? = null
    private var reader: java.io.BufferedReader? = null

    @Synchronized
    private fun ensureShell(): Boolean {
        try {
            if (process != null) {
                try {
                    process!!.exitValue()
                    close()
                } catch (e: IllegalThreadStateException) {
                    return true
                }
            }
            val p = Runtime.getRuntime().exec("su")
            writer = java.io.BufferedWriter(java.io.OutputStreamWriter(p.outputStream))
            reader = java.io.BufferedReader(java.io.InputStreamReader(p.inputStream))
            process = p
            return true
        } catch (e: Exception) {
            close()
            return false
        }
    }

    @Synchronized
    fun execute(command: String): String {
        if (!ensureShell()) return ""
        return try {
            val endMarker = "__ROOT_CMD_END_${System.nanoTime()}__"
            writer!!.write("$command 2>&1\necho $endMarker\n")
            writer!!.flush()

            val sb = StringBuilder()
            var line: String?
            while (reader!!.readLine().also { line = it } != null) {
                if (line == endMarker) break
                sb.append(line).append("\n")
            }
            sb.toString()
        } catch (e: Exception) {
            close()
            ""
        }
    }

    @Synchronized
    fun close() {
        try { writer?.close() } catch (e: Exception) {}
        try { reader?.close() } catch (e: Exception) {}
        try { process?.destroy() } catch (e: Exception) {}
        writer = null
        reader = null
        process = null
    }
}

object CommandExecutor {

    fun isShizukuBinderAlive(): Boolean {
        return try {
            Shizuku.pingBinder()
        } catch (e: Exception) {
            false
        }
    }

    fun isShizukuPermissionGranted(): Boolean {
        return try {
            isShizukuBinderAlive() && Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED
        } catch (e: Exception) {
            false
        }
    }

    fun isShizukuReady(): Boolean {
        return isShizukuPermissionGranted()
    }

    fun checkRootAccess(context: Context): Boolean {
        return try {
            val isRoot = RootShell.execute("id").contains("uid=0")
            val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("isRootActive", isRoot).apply()
            isRoot
        } catch (e: Exception) {
            val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("isRootActive", false).apply()
            false
        }
    }

    fun isReady(context: Context): Boolean {
        val mode = getWorkingMode(context)
        return if (mode == "root") {
            val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
            val cachedRoot = prefs.getBoolean("isRootActive", false)
            if (cachedRoot) {
                true
            } else {
                checkRootAccess(context)
            }
        } else {
            isShizukuReady()
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
                val output = RootShell.execute("$command; echo __KILLAPP_CODE_\$?__")
                if (output.contains("__KILLAPP_CODE_0__")) 0 else -1
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
            if (mode == "root") {
                RootShell.execute(command)
            } else {
                if (!isShizukuReady()) return ""
                val clazz = Class.forName("rikka.shizuku.Shizuku")
                val method = clazz.getDeclaredMethod("newProcess", Array<String>::class.java, Array<String>::class.java, String::class.java)
                method.isAccessible = true
                val process = method.invoke(null, arrayOf("sh", "-c", "$command 2>&1"), null, null) as Process
                
                val reader = java.io.BufferedReader(java.io.InputStreamReader(process.inputStream))
                val output = java.lang.StringBuilder()
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    output.append(line).append("\n")
                }
                process.waitFor()
                output.toString()
            }
        } catch (e: Exception) {
            ""
        }
    }

    fun forceStopPackage(context: Context, packageName: String): Boolean {
        return executeCommand(context, "am force-stop $packageName") == 0
    }
}

