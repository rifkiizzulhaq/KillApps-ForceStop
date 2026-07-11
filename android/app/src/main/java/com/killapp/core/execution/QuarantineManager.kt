package com.killapp.core.execution

import android.content.Context
import com.killapp.core.command.CommandExecutor

object QuarantineManager {
    fun freezePackage(context: Context, pkg: String, freeze: Boolean): Map<String, Any> {
        if (freeze) {
            if (ProtectionFilter.criticalPackages.contains(pkg)) {
                return mapOf("success" to false, "errorCode" to "critical_package")
            }
            if (ProtectionFilter.isActiveWebViewProtected(context, pkg)) {
                return mapOf("success" to false, "errorCode" to "webview_provider")
            }
            val exitCode = CommandExecutor.executeCommand(context, "pm disable-user --user 0 $pkg")
            if (exitCode == 0) {
                val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
                val set = (prefs.getStringSet("quarantinePackages", setOf()) ?: setOf()).toMutableSet()
                set.add(pkg)
                prefs.edit().putStringSet("quarantinePackages", set).apply()
                return mapOf("success" to true, "errorCode" to "ok")
            } else {
                return mapOf("success" to false, "errorCode" to "system_protected")
            }
        } else {
            val exitCode = CommandExecutor.executeCommand(context, "pm enable $pkg")
            val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
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
