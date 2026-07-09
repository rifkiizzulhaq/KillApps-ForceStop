package com.killapp.core.execution

import android.content.Context
import com.killapp.core.command.CommandExecutor

object QuarantineManager {
    fun freezePackage(context: Context, pkg: String, freeze: Boolean): Map<String, Any> {
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        val mode = prefs.getString("workingMode", "shizuku") ?: "shizuku"
        
        if (freeze) {
            if (ProtectionFilter.isActiveWebViewProtected(context, pkg)) {
                return mapOf("success" to false, "errorCode" to "webview_provider")
            }
            val cmd = "pm disable-user --user 0 $pkg"
            val exitCode = if (mode == "root") {
                try { Runtime.getRuntime().exec(arrayOf("su", "-c", cmd)).waitFor() } catch (e: Exception) { -1 }
            } else {
                CommandExecutor.executeCommand(context, cmd)
            }
            
            if (exitCode == 0) {
                val set = (prefs.getStringSet("quarantinePackages", setOf()) ?: setOf()).toMutableSet()
                set.add(pkg)
                prefs.edit().putStringSet("quarantinePackages", set).apply()
                return mapOf("success" to true, "errorCode" to "ok")
            } else {
                return mapOf("success" to false, "errorCode" to "system_protected")
            }
        } else {
            val cmd = "pm enable $pkg"
            val exitCode = if (mode == "root") {
                try { Runtime.getRuntime().exec(arrayOf("su", "-c", cmd)).waitFor() } catch (e: Exception) { -1 }
            } else {
                CommandExecutor.executeCommand(context, cmd)
            }
            
            val set = (prefs.getStringSet("quarantinePackages", setOf()) ?: setOf()).toMutableSet()
            set.remove(pkg)
            prefs.edit().putStringSet("quarantinePackages", set).apply()
            val success = exitCode == 0
            return mapOf("success" to success, "errorCode" to if (success) "ok" else "unfreeze_failed")
        }
    }

    fun getQuarantinePackages(context: Context): Set<String> {
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        return prefs.getStringSet("quarantinePackages", setOf()) ?: setOf()
    }
}
