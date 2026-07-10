package com.killapp.core.execution

import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.os.Build
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

    private var cachedActiveMediaPackages: Set<String>? = null
    private var lastActiveMediaCheckTime: Long = 0L

    @Synchronized
    fun getActiveMediaPackages(context: Context): Set<String> {
        val now = System.currentTimeMillis()
        if (cachedActiveMediaPackages != null && (now - lastActiveMediaCheckTime) < 1500L) {
            return cachedActiveMediaPackages!!
        }
        val packages = mutableSetOf<String>()
        val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                for (config in am.activePlaybackConfigurations) {
                    val usage = config.audioAttributes.usage
                    if (usage == AudioAttributes.USAGE_MEDIA || usage == AudioAttributes.USAGE_GAME) {
                        try {
                            val getPkgMethod = config.javaClass.getMethod("getClientPackageName")
                            getPkgMethod.isAccessible = true
                            val clientPkg = getPkgMethod.invoke(config) as? String
                            if (!clientPkg.isNullOrEmpty() && clientPkg != "com.android.systemui" && clientPkg != "android") {
                                packages.add(clientPkg)
                            }
                        } catch (e: Exception) {}
                    }
                }
            }
        } catch (e: Exception) {}

        try {
            val dumpsysOutput = CommandExecutor.executeCommandWithOutput(context, "dumpsys media_session")
            var currentPkg: String? = null
            var sessionIsPlaying = false

            for (line in dumpsysOutput.lines()) {
                val trimmed = line.trim()
                if (trimmed.startsWith("Session ") || trimmed.startsWith("Sessions Stack:") || trimmed.startsWith("Controllers:") || trimmed.startsWith("User Records:") || trimmed.startsWith("Audio playback")) {
                    if (currentPkg != null && sessionIsPlaying) {
                        if (currentPkg != "com.android.systemui" && currentPkg != "android") {
                            packages.add(currentPkg)
                        }
                    }
                    currentPkg = null
                    sessionIsPlaying = false
                }
                if (trimmed.startsWith("ownerPackageName=") || trimmed.startsWith("package=") || trimmed.startsWith("packages=")) {
                    val p = trimmed.substringAfter("=").substringBefore(" ").trim()
                    if (p.isNotEmpty() && p != "null") currentPkg = p
                } else if (trimmed.contains("state=PlaybackState {state=3") || trimmed.contains("state=3 (PLAYING)") || trimmed.contains("state=3") && trimmed.contains("PLAYING")) {
                    sessionIsPlaying = true
                } else if (trimmed.contains("state=PlaybackState {state=2") || trimmed.contains("state=2 (PAUSED)") || trimmed.contains("state=PlaybackState {state=1") || trimmed.contains("state=PlaybackState {state=0")) {
                    sessionIsPlaying = false
                }
            }
            if (currentPkg != null && sessionIsPlaying) {
                if (currentPkg != "com.android.systemui" && currentPkg != "android") {
                    packages.add(currentPkg)
                }
            }
        } catch (e: Exception) {}

        cachedActiveMediaPackages = packages
        lastActiveMediaCheckTime = System.currentTimeMillis()
        return packages
    }

    fun isMediaOrAudioApp(context: Context, pkg: String): Boolean {
        if (pkg == "android" || pkg.contains("providers", ignoreCase = true) || pkg.contains("systemui", ignoreCase = true)) return false
        if (mediaPackages.contains(pkg)) return true
        if (pkg.contains("music", ignoreCase = true) || pkg.contains("audio", ignoreCase = true) || 
            pkg.contains("spotify", ignoreCase = true) || pkg.contains("media", ignoreCase = true) ||
            pkg.contains("podcast", ignoreCase = true) || pkg.contains("revanced", ignoreCase = true)) {
            return true
        }
        return false
    }

    fun getRunningMediaOrAudioApps(context: Context): Set<String> {
        val result = mutableSetOf<String>()
        try {
            val pm = context.packageManager
            val apps = pm.getInstalledApplications(0)
            for (info in apps) {
                val pkg = info.packageName
                if (pkg != null && isMediaOrAudioApp(context, pkg)) {
                    val isSystem = (info.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
                    val hasLauncher = try { pm.getLaunchIntentForPackage(pkg) != null } catch (e: Exception) { false }
                    if ((!isSystem || hasLauncher) && (info.flags and android.content.pm.ApplicationInfo.FLAG_STOPPED) == 0) {
                        result.add(pkg)
                    }
                }
            }
        } catch (e: Exception) {}
        return result
    }

    fun isMediaActiveProtected(_context: Context, pkg: String, finerMedia: Boolean, dynamicMediaPkgs: Set<String> = setOf()): Boolean {
        if (!finerMedia) return false
        if (dynamicMediaPkgs.contains(pkg)) return true
        
        val active = getActiveMediaPackages(_context)
        if (active.contains(pkg)) return true

        val am = _context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        if (am.isMusicActive && isMediaOrAudioApp(_context, pkg) && active.isEmpty() && dynamicMediaPkgs.isEmpty()) {
            return true
        }
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

