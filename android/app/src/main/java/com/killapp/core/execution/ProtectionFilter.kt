package com.killapp.core.execution

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import com.killapp.core.command.CommandExecutor

object ProtectionFilter {
    val mediaPackages = setOf(
        "com.spotify.music",
        "com.google.android.apps.youtube.music",
        "com.apple.android.music",
        "com.tencent.ibg.joox",
        "com.deezer.android.app",
        "com.soundcloud.android",
        "com.google.android.videos"
    )

    val criticalPackages = setOf(
        "android",
        "com.android.systemui",
        "com.android.settings",
        "com.google.android.gms",
        "com.google.android.inputmethod.latin",
        "com.android.inputmethod.latin",
        "com.google.android.apps.maps",
        "com.waze",
        "com.android.phone",
        "com.android.server.telecom",
        "com.samsung.android.dialer",
        "com.android.vending",
        "com.google.android.webview",
        "com.android.webview"
    )

    val webviewPackages = setOf("com.android.chrome", "com.google.android.webview", "com.android.webview")

    private var cachedBrowserPackages: Set<String>? = null

    fun getBrowserPackages(context: Context): Set<String> {
        cachedBrowserPackages?.let { return it }
        val browsers = mutableSetOf<String>()
        try {
            val intent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse("http://"))
            val resolveInfoList = context.packageManager.queryIntentActivities(intent, 0)
            for (info in resolveInfoList) {
                browsers.add(info.activityInfo.packageName)
            }
        } catch (e: Exception) {}
        cachedBrowserPackages = browsers
        return browsers
    }

    val appopsExemptPackages = setOf(
        "com.android.chrome",
        "com.chrome.beta",
        "com.chrome.dev",
        "com.chrome.canary",
        "org.mozilla.firefox",
        "com.brave.browser",
        "com.microsoft.emmx",
        "com.opera.browser"
    )

    fun isAppOpsExempt(context: Context, pkg: String): Boolean {
        if (appopsExemptPackages.contains(pkg)) return true
        if (getBrowserPackages(context).contains(pkg)) return true
        return false
    }

    fun getActiveMediaPackages(context: Context): Set<String> {
        val packages = mutableSetOf<String>()
        try {
            val output = CommandExecutor.executeCommandWithOutput(context, "dumpsys media_session")
            val regex = Regex("(ownerPackageName=|package=|Media button session is ComponentInfo\\{)([a-zA-Z0-9_.]+)")
            val matches = regex.findAll(output)
            for (match in matches) {
                val pkg = match.groupValues[2]
                if (pkg != "com.android.systemui" && pkg != "android") {
                    packages.add(pkg)
                }
            }
        } catch (e: Exception) {}
        return packages
    }

    fun isMediaActiveProtected(context: Context, pkg: String, finerMedia: Boolean, dynamicMediaPkgs: Set<String> = setOf()): Boolean {
        try {
            val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            if (am.isMusicActive) {
                if (mediaPackages.contains(pkg)) return true
                if (getBrowserPackages(context).contains(pkg)) return true
                if (finerMedia && dynamicMediaPkgs.contains(pkg)) return true
            }
        } catch (e: Exception) {}
        return false
    }

    fun isSmartProtected(context: Context, pkg: String, smart: Boolean): Boolean {
        if (!smart) return false
        try {
            if (criticalPackages.contains(pkg)) {
                return true
            }
            
            val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            if (am.mode == AudioManager.MODE_IN_CALL || am.mode == AudioManager.MODE_IN_COMMUNICATION) {
                return true
            }
        } catch (e: Exception) {}
        return false
    }

    fun isQuarantineProtected(context: Context, pkg: String): Boolean {
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        val quarantined = prefs.getStringSet("quarantinePackages", setOf()) ?: setOf()
        return quarantined.contains(pkg)
    }

    fun isActiveWebViewProtected(context: Context, pkg: String): Boolean {
        if (!webviewPackages.contains(pkg)) return false
        try {
            val currentWebView = android.provider.Settings.Global.getString(context.contentResolver, "webview_provider")
            if (currentWebView != null && currentWebView.trim() == pkg.trim()) {
                return true
            }
        } catch (e: Exception) {}
        return false
    }
}

