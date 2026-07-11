package com.killapp.core.execution

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioManager
import android.os.Build

object ProtectionFilter {
    val criticalPackages = setOf(
        "android",
        "com.android.systemui",
        "com.android.settings",
        "com.google.android.gms",
        "com.google.android.googlequicksearchbox",
        "com.google.android.inputmethod.latin",
        "com.android.inputmethod.latin",
        "com.killapp",
        "com.topjohnwu.magisk",
        "com.google.android.apps.nexuslauncher",
        "com.android.phone",
        "com.android.server.telecom",
        "com.samsung.android.dialer",
        "com.android.vending",
        "com.google.android.webview",
        "com.android.webview"
    )

    val webviewPackages = setOf("com.google.android.webview", "com.android.webview")

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
    private var cachedPlayingPackages: Set<String> = emptySet()
    private var lastPlayingPackagesOk: Boolean = false
    private var lastPlayingCheckTime: Long = 0L

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
                        val isPlaying = try {
                            val getStateMethod = config.javaClass.getMethod("getPlayerState")
                            getStateMethod.isAccessible = true
                            val state = getStateMethod.invoke(config) as? Int
                            state == 2
                        } catch (e: Exception) { true }
                        if (!isPlaying) continue
                        try {
                            val getPkgMethod = config.javaClass.getMethod("getClientPackageName")
                            getPkgMethod.isAccessible = true
                            val clientPkg = getPkgMethod.invoke(config) as? String
                            if (!clientPkg.isNullOrEmpty() && clientPkg != "com.android.systemui" && clientPkg != "android") {
                                packages.add(clientPkg)
                            }
                        } catch (e: Exception) {
                            try {
                                val getUidMethod = config.javaClass.getMethod("getClientUid")
                                getUidMethod.isAccessible = true
                                val uid = getUidMethod.invoke(config) as? Int
                                if (uid != null && uid > 1000) {
                                    context.packageManager.getPackagesForUid(uid)?.forEach { p ->
                                        if (p != "com.android.systemui" && p != "android") packages.add(p)
                                    }
                                }
                            } catch (e2: Exception) {}
                        }
                    }
                }
            }
        } catch (e: Exception) {}

        if (packages.isEmpty() && am.isMusicActive) {
            try {
                val runningMediaApps = getRunningMediaOrAudioApps(context)
                if (runningMediaApps.isNotEmpty()) {
                    val output = com.killapp.core.command.CommandExecutor.executeCommandWithOutput(context, "dumpsys audio")
                    for (pkg in runningMediaApps) {
                        if (output.contains(pkg, ignoreCase = true)) {
                            packages.add(pkg)
                        }
                    }
                    if (packages.isEmpty() && runningMediaApps.size == 1) {
                        packages.addAll(runningMediaApps)
                    }
                }
            } catch (e: Exception) {}
        }

        cachedActiveMediaPackages = packages
        lastActiveMediaCheckTime = System.currentTimeMillis()
        return packages
    }

    @Synchronized
    private fun syncPlayingPackages(context: Context) {
        val now = System.currentTimeMillis()
        if (now - lastPlayingCheckTime < 3000L) return
        lastPlayingCheckTime = now
        lastPlayingPackagesOk = false
        try {
            val output = com.killapp.core.command.CommandExecutor.executeCommandWithOutput(
                context, "dumpsys media_session"
            )
            if (output.isNullOrEmpty() || !output.contains("package=")) return
            lastPlayingPackagesOk = true
            val playing = mutableSetOf<String>()
            var currentPkg: String? = null
            for (line in output.lines()) {
                val t = line.trim()
                when {
                    t.startsWith("package=") -> currentPkg = t.removePrefix("package=").trim()
                    currentPkg != null && t.contains("state=3") && !Regex("state=3[0-9]").containsMatchIn(t) -> {
                        playing.add(currentPkg)
                        currentPkg = null
                    }
                }
            }
            cachedPlayingPackages = playing
        } catch (e: Exception) {}
    }

    fun isMediaOrAudioApp(context: Context, pkg: String, appInfo: android.content.pm.ApplicationInfo? = null): Boolean {
        if (pkg == "android" || pkg.contains("providers", ignoreCase = true) || pkg.contains("systemui", ignoreCase = true)) return false

        try {
            val pm = context.packageManager
            val info = appInfo ?: pm.getApplicationInfo(pkg, 0)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (info.category == android.content.pm.ApplicationInfo.CATEGORY_AUDIO ||
                    info.category == android.content.pm.ApplicationInfo.CATEGORY_VIDEO) {
                    return true
                }
            }
            val intent = Intent(Intent.ACTION_VIEW).setType("audio/*").setPackage(pkg)
            if (pm.queryIntentActivities(intent, 0).isNotEmpty()) {
                return true
            }
            val browserIntent = Intent("android.media.browse.MediaBrowserService").setPackage(pkg)
            if (pm.queryIntentServices(browserIntent, 0).isNotEmpty()) {
                return true
            }
        } catch (e: Exception) {}

        if (pkg.contains("music", ignoreCase = true) || pkg.contains("audio", ignoreCase = true) || 
            pkg.contains("player", ignoreCase = true) || pkg.contains("media", ignoreCase = true) ||
            pkg.contains("podcast", ignoreCase = true) || pkg.contains("sound", ignoreCase = true)) {
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

        val am = _context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        if (!am.isMusicActive) return false

        syncPlayingPackages(_context)
        if (lastPlayingPackagesOk) {
            return cachedPlayingPackages.contains(pkg)
        }

        val active = getActiveMediaPackages(_context)
        if (!active.contains(pkg)) return false
        if (!isAppOpsExempt(_context, pkg) && !isMediaOrAudioApp(_context, pkg)) return false
        return try {
            val info = _context.packageManager.getApplicationInfo(pkg, 0)
            (info.flags and android.content.pm.ApplicationInfo.FLAG_STOPPED) == 0
        } catch (e: Exception) { false }
    }

    private var cachedNavigationPackages: Set<String>? = null

    @Synchronized
    fun getDynamicNavigationPackages(context: Context): Set<String> {
        cachedNavigationPackages?.let { return it }
        val navApps = mutableSetOf<String>()
        try {
            val pm = context.packageManager
            val geoIntent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse("geo:0,0?q=test"))
            pm.queryIntentActivities(geoIntent, 0).forEach { info ->
                info.activityInfo?.packageName?.let { navApps.add(it) }
            }
            val navIntent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse("google.navigation:q=0,0"))
            pm.queryIntentActivities(navIntent, 0).forEach { info ->
                info.activityInfo?.packageName?.let { navApps.add(it) }
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                pm.getInstalledApplications(0).forEach { appInfo ->
                    if (appInfo.category == android.content.pm.ApplicationInfo.CATEGORY_MAPS && appInfo.packageName != null) {
                        navApps.add(appInfo.packageName)
                    }
                }
            }
        } catch (e: Exception) {}
        cachedNavigationPackages = navApps
        return navApps
    }

    private var cachedSmartProtectedApps: Set<String>? = null
    private var lastSmartCacheTime: Long = 0L

    @Synchronized
    private fun getActiveVitalPackages(context: Context): Set<String> {
        val now = System.currentTimeMillis()
        cachedSmartProtectedApps?.let {
            if (now - lastSmartCacheTime < 2500L) {
                return it
            }
        }
        val protectedApps = mutableSetOf<String>()
        try {
            val oomOutput = com.killapp.core.command.CommandExecutor.executeCommandWithOutput(
                context, "dumpsys activity oom | grep -E 'TOP|FOREGROUND|fg-service'"
            )
            oomOutput.lines().forEach { line ->
                val trimmed = line.trim()
                if (trimmed.isNotEmpty() && (
                    trimmed.contains("FOREGROUND") || trimmed.contains("TOP") ||
                    trimmed.contains("fg-service")
                )) {
                    val parts = trimmed.split(":", "/", " ")
                    for (part in parts) {
                        if (part.contains(".") && !part.startsWith("com.android.") && !part.startsWith("android.") && part.length > 5) {
                            val cleanPkg = part.trim(',', '}', '{', ']')
                            if (cleanPkg.matches(Regex("^[a-zA-Z0-9_]+(\\.[a-zA-Z0-9_]+)+$"))) {
                                protectedApps.add(cleanPkg)
                            }
                        }
                    }
                }
            }
        } catch (e: Exception) {}

        try {
            val am = context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
            am.runningAppProcesses?.forEach { proc ->
                val imp = proc.importance
                if (imp == android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND ||
                    imp == android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND_SERVICE) {
                    proc.pkgList?.forEach { protectedApps.add(it) }
                }
            }
        } catch (e: Exception) {}

        cachedSmartProtectedApps = protectedApps
        lastSmartCacheTime = now
        return protectedApps
    }

    private fun isDynamicActiveVpn(context: Context, pkg: String): Boolean {
        try {
            val pm = context.packageManager
            val info = try { pm.getPackageInfo(pkg, PackageManager.GET_SERVICES) } catch (e: Exception) { null }
            if (info != null) {
                var hasVpnPermission = false
                val services = info.services
                if (services != null) {
                    for (srv in services) {
                        if (srv.permission == "android.permission.BIND_VPN_SERVICE") {
                            hasVpnPermission = true
                            break
                        }
                    }
                }

                if (hasVpnPermission) {
                    val appInfo = info.applicationInfo
                    if (appInfo != null && (appInfo.flags and android.content.pm.ApplicationInfo.FLAG_STOPPED) == 0) {
                        try {
                            val oomOutput = com.killapp.core.command.CommandExecutor.executeCommandWithOutput(
                                context, "dumpsys activity oom | grep -E 'TOP|FOREGROUND|vis|service|BFGS|prcp'"
                            )
                            if (oomOutput.contains(pkg)) {
                                return true
                            }
                        } catch (e: Exception) {}

                        try {
                            val am = context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
                            val processes = am.runningAppProcesses
                            if (processes != null) {
                                for (proc in processes) {
                                    if (proc.pkgList != null && proc.pkgList.contains(pkg)) {
                                        if (proc.importance <= 300) {
                                            return true
                                        }
                                    }
                                }
                            }
                        } catch (e: Exception) {}
                    }
                }
            }
        } catch (e: Exception) {}

        return false
    }

    fun isSmartProtected(context: Context, pkg: String, smart: Boolean): Boolean {
        if (criticalPackages.contains(pkg)) {
            return true
        }
        if (!smart) return false
        try {
            val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            if (am.mode == AudioManager.MODE_IN_CALL || am.mode == AudioManager.MODE_IN_COMMUNICATION) {
                return true
            }
        } catch (e: Exception) {}

        if (isDynamicActiveVpn(context, pkg)) {
            return true
        }

        try {
            val activeVitals = getActiveVitalPackages(context)
            if (activeVitals.contains(pkg)) {
                if (getDynamicNavigationPackages(context).contains(pkg)) {
                    return true
                }

                val pm = context.packageManager
                if (pm.checkPermission(android.Manifest.permission.RECORD_AUDIO, pkg) == PackageManager.PERMISSION_GRANTED ||
                    pm.checkPermission(android.Manifest.permission.CAMERA, pkg) == PackageManager.PERMISSION_GRANTED) {
                    return true
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val info = try { pm.getPackageInfo(pkg, PackageManager.GET_SERVICES) } catch (e: Exception) { null }
                    info?.services?.forEach { srv ->
                        val fgType = srv.foregroundServiceType
                        if (fgType != 0 && (
                            fgType == android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE ||
                            fgType == android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION ||
                            fgType == android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA ||
                            fgType == android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL
                        )) {
                            return true
                        }
                    }
                }
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

