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
        if (getDynamicNavigationPackages(context).contains(pkg)) return true
        if (getCameraPackages(context).contains(pkg)) return true

        val pm = context.packageManager
        try {
            val info = pm.getPackageInfo(pkg, PackageManager.GET_SERVICES)
            info.services?.forEach { srv ->
                if (srv.permission == "android.permission.BIND_VPN_SERVICE") return true
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val fgType = srv.foregroundServiceType
                    if (fgType != 0 && (fgType and (
                        android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION or
                        android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or
                        android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA or
                        android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
                    )) != 0) {
                        return true
                    }
                }
            }
        } catch (e: Exception) {}

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
        if (active.isNotEmpty()) {
            if (!active.contains(pkg)) return false
        }
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
        syncGlobalDiagnosticSnapshot(context)
        return cachedSmartProtectedApps ?: emptySet()
    }

    private var cachedDynamicCriticalPackages: Set<String>? = null
    private var lastDynamicCriticalCheckTime: Long = 0L

    @Synchronized
    fun getDynamicCriticalPackages(context: Context): Set<String> {
        val now = System.currentTimeMillis()
        cachedDynamicCriticalPackages?.let {
            if (now - lastDynamicCriticalCheckTime < 5000L) {
                return it
            }
        }
        val criticals = mutableSetOf<String>()
        criticals.addAll(criticalPackages)
        try {
            val pm = context.packageManager
            val defaultIm = android.provider.Settings.Secure.getString(context.contentResolver, android.provider.Settings.Secure.DEFAULT_INPUT_METHOD)
            if (!defaultIm.isNullOrEmpty()) {
                val pkg = defaultIm.substringBefore("/")
                if (pkg.isNotEmpty()) criticals.add(pkg)
            }
            val imIntent = Intent("android.view.InputMethod")
            pm.queryIntentServices(imIntent, 0).forEach { info ->
                info.serviceInfo?.packageName?.let { criticals.add(it) }
            }
        } catch (e: Exception) {}
        try {
            val pm = context.packageManager
            val homeIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
            val defaultHome = pm.resolveActivity(homeIntent, PackageManager.MATCH_DEFAULT_ONLY)
            defaultHome?.activityInfo?.packageName?.let { criticals.add(it) }
            pm.queryIntentActivities(homeIntent, 0).forEach { info ->
                info.activityInfo?.packageName?.let { criticals.add(it) }
            }
        } catch (e: Exception) {}
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val tm = context.getSystemService(Context.TELECOM_SERVICE) as? android.telecom.TelecomManager
                tm?.defaultDialerPackage?.let { criticals.add(it) }
            }
            val dialIntent = Intent(Intent.ACTION_DIAL)
            context.packageManager.queryIntentActivities(dialIntent, 0).forEach { info ->
                info.activityInfo?.packageName?.let { criticals.add(it) }
            }
        } catch (e: Exception) {}
        try {
            val webviewProvider = android.provider.Settings.Global.getString(context.contentResolver, "webview_provider")
            if (!webviewProvider.isNullOrEmpty()) {
                criticals.add(webviewProvider.trim())
            }
        } catch (e: Exception) {}
        cachedDynamicCriticalPackages = criticals
        lastDynamicCriticalCheckTime = now
        return criticals
    }

    private var cachedForegroundServicePackages: Set<String> = emptySet()
    private var cachedOngoingNotifPackages: Set<String> = emptySet()
    private var cachedDownloadPackages: Set<String> = emptySet()
    private var cachedDataSyncPackages: Set<String> = emptySet()
    private var cachedActiveCameraPackages: Set<String> = emptySet()
    private var cachedActiveProjectionPackages: Set<String> = emptySet()
    private var lastGlobalDiagnosticCacheTime: Long = 0L

    private var cachedCameraPackages: Set<String>? = null

    fun getCameraPackages(context: Context): Set<String> {
        cachedCameraPackages?.let { return it }
        val cameras = mutableSetOf<String>()
        try {
            val pm = context.packageManager
            val intent1 = Intent(android.provider.MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA)
            pm.queryIntentActivities(intent1, 0).forEach { info ->
                info.activityInfo?.packageName?.let { cameras.add(it) }
            }
        } catch (e: Exception) {}
        cachedCameraPackages = cameras
        return cameras
    }

    fun isCameraApp(context: Context, pkg: String): Boolean {
        if (pkg.contains("camera", ignoreCase = true)) return true
        if (getCameraPackages(context).contains(pkg)) return true
        return false
    }

    private var cachedTopPackage: String? = null
    private var lastTopPackageCheckTime: Long = 0L

    fun getTopPackage(context: Context): String? {
        val now = System.currentTimeMillis()
        if (now - lastTopPackageCheckTime < 700L) {
            return cachedTopPackage
        }
        lastTopPackageCheckTime = now
        try {
            var output = com.killapp.core.command.CommandExecutor.executeCommandWithOutput(
                context, "dumpsys activity activities 2>/dev/null | grep -iE 'Resumed|topResumed'"
            )
            if (output.trim().isEmpty()) {
                output = com.killapp.core.command.CommandExecutor.executeCommandWithOutput(
                    context, "dumpsys window windows 2>/dev/null | grep -iE 'mCurrentFocus|mFocusedApp|mFocusedWindow'"
                )
            }
            val regex = Regex("([a-zA-Z0-9_]+(?:\\.[a-zA-Z0-9_]+)+)/")
            val matches = regex.findAll(output)
            for (match in matches) {
                val pkg = match.groupValues[1]
                if (pkg != "com.android.systemui" && 
                    pkg != "android" && 
                    !pkg.contains("inputmethod") &&
                    !pkg.contains("launcher")) {
                    cachedTopPackage = pkg
                    break
                }
            }
        } catch (e: Exception) {
            cachedTopPackage = null
        }
        return cachedTopPackage
    }

    fun isAppTopForeground(context: Context, pkg: String): Boolean {
        try {
            val am = context.getSystemService(Context.ACTIVITY_SERVICE) as? android.app.ActivityManager
            val processes = am?.runningAppProcesses
            if (processes != null) {
                for (proc in processes) {
                    if (proc.importance == android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND && proc.pkgList != null) {
                        for (p in proc.pkgList) {
                            if (p == pkg) return true
                        }
                    }
                }
                return false
            }
        } catch (e: Exception) {}
        val top = getTopPackage(context)
        return top != null && top == pkg
    }

    @Synchronized
    private fun syncGlobalDiagnosticSnapshot(context: Context) {
        val now = System.currentTimeMillis()
        if (now - lastGlobalDiagnosticCacheTime < 700L && cachedOngoingNotifPackages.isNotEmpty()) return
        lastGlobalDiagnosticCacheTime = now

        try {
            val vitalSet = mutableSetOf<String>()
            val fgServiceSet = mutableSetOf<String>()
            val am = context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
            am.runningAppProcesses?.forEach { proc ->
                val imp = proc.importance
                if (imp == android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND ||
                    imp == android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND_SERVICE) {
                    proc.pkgList?.forEach { 
                        vitalSet.add(it)
                        if (imp == android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND_SERVICE) {
                            fgServiceSet.add(it)
                        }
                    }
                }
            }
            val oomOutput = com.killapp.core.command.CommandExecutor.executeCommandWithOutput(
                context, "dumpsys activity oom 2>/dev/null | head -n 120"
            )
            oomOutput.lines().forEach { line ->
                val trimmed = line.trim()
                if (trimmed.isNotEmpty() && (
                    trimmed.contains("top", ignoreCase = true) || trimmed.contains("foreground", ignoreCase = true) ||
                    trimmed.contains("fg-service", ignoreCase = true) || trimmed.contains("vis", ignoreCase = true)
                )) {
                    val parts = trimmed.split(":", "/", " ", "=")
                    for (part in parts) {
                        if (part.contains(".") && !part.startsWith("com.android.") && !part.startsWith("android.") && part.length > 4) {
                            val cleanPkg = part.trim(',', '}', '{', ']', '(', ')')
                            if (cleanPkg.matches(Regex("^[a-zA-Z0-9_]+(\\.[a-zA-Z0-9_]+)+$"))) {
                                vitalSet.add(cleanPkg)
                                if (trimmed.contains("fg-service", ignoreCase = true)) {
                                    fgServiceSet.add(cleanPkg)
                                }
                            }
                        }
                    }
                }
            }
            cachedSmartProtectedApps = vitalSet
            cachedForegroundServicePackages = fgServiceSet
            lastSmartCacheTime = now
        } catch (e: Exception) {}

        try {
            val notifSet = mutableSetOf<String>()
            val downloadSet = mutableSetOf<String>()
            val syncSet = mutableSetOf<String>()
            var notifOutput = com.killapp.core.command.CommandExecutor.executeCommandWithOutput(
                context, "dumpsys notification --noredact 2>/dev/null"
            )
            if (notifOutput.trim().isEmpty() || notifOutput.contains("unrecognized option")) {
                notifOutput = com.killapp.core.command.CommandExecutor.executeCommandWithOutput(
                    context, "dumpsys notification 2>/dev/null"
                )
            }
            val browserPkgs = getBrowserPackages(context)
            var currentPkg: String? = null
            var recordOngoing = false
            var recordHasProgress = false
            var recordCategoryProgress = false
            var recordCategoryTransport = false

            fun flushCurrentRecord() {
                if (currentPkg != null) {
                    val isMediaPkg = isMediaOrAudioApp(context, currentPkg!!) || browserPkgs.contains(currentPkg!!)
                    if (recordOngoing) {
                        if (recordCategoryProgress || (recordHasProgress && !isMediaPkg)) {
                            downloadSet.add(currentPkg!!)
                        }
                        if (recordCategoryTransport && !isMediaPkg) {
                            syncSet.add(currentPkg!!)
                        }
                        if (!browserPkgs.contains(currentPkg!!) && !recordHasProgress && !recordCategoryProgress && !isMediaPkg) {
                            notifSet.add(currentPkg!!)
                        }
                    } else if (recordCategoryProgress || (recordHasProgress && !isMediaPkg)) {
                        downloadSet.add(currentPkg!!)
                    }
                }
            }

            notifOutput.lines().forEach { line ->
                val t = line.trim()
                if (t.contains("NotificationRecord") || t.startsWith("pkg=")) {
                    if (t.contains("pkg=")) {
                        val pkg = t.substringAfter("pkg=").substringBefore(" ").substringBefore(")").substringBefore("}").trim()
                        if (pkg.contains(".") && pkg.length > 3) {
                            if (currentPkg != pkg || t.contains("NotificationRecord")) {
                                flushCurrentRecord()
                                currentPkg = pkg
                                recordOngoing = false
                                recordHasProgress = false
                                recordCategoryProgress = false
                                recordCategoryTransport = false
                            }
                        }
                    }
                }
                if (currentPkg != null) {
                    val lower = t.lowercase()
                    if (t.contains("ONGOING_EVENT") || t.contains("FOREGROUND_SERVICE") || t.contains("NO_CLEAR") ||
                        t.contains("FLAG_ONGOING_EVENT") || t.contains("FLAG_FOREGROUND_SERVICE") || t.contains("FLAG_NO_CLEAR")) {
                        recordOngoing = true
                    }
                    if (t.contains("progress=") || t.contains("android.progress=") || t.contains("mProgress=") ||
                        t.contains("mProgressMax=") || t.contains("indeterminate=true") || t.contains("hasProgress=true") ||
                        lower.contains("progress=")) {
                        recordHasProgress = true
                    }
                    if (t.contains("cat=progress") || t.contains("category=progress") || t.contains("cat=sys") || t.contains("category=sys")) {
                        recordCategoryProgress = true
                    }
                    if (lower.contains("datasync") || lower.contains("data_sync") || lower.contains("file_transfer") || lower.contains("torrent")) {
                        recordCategoryTransport = true
                    }
                }
            }
            flushCurrentRecord()
            cachedOngoingNotifPackages = notifSet
            cachedDownloadPackages = downloadSet
            cachedDataSyncPackages = syncSet
        } catch (e: Exception) {}

        try {
            val cameraSet = mutableSetOf<String>()
            val cameraOutput = com.killapp.core.command.CommandExecutor.executeCommandWithOutput(
                context, "dumpsys media.camera 2>/dev/null | head -n 30"
            )
            val pkgRegex = Regex("[a-zA-Z][a-zA-Z0-9_]*(\\.[a-zA-Z][a-zA-Z0-9_]*)+")
            cameraOutput.lines().forEach { line ->
                val lower = line.lowercase()
                if (lower.contains("client") || lower.contains("active")) {
                    if (!lower.contains("device") && !lower.contains("maps to")) {
                        pkgRegex.findAll(line).forEach { match -> cameraSet.add(match.value) }
                    }
                }
            }
            cachedActiveCameraPackages = cameraSet
        } catch (e: Exception) {}

        try {
            val projSet = mutableSetOf<String>()
            val projOutput = com.killapp.core.command.CommandExecutor.executeCommandWithOutput(
                context, "dumpsys media.projection 2>/dev/null"
            )
            val lower = projOutput.lowercase()
            if (lower.contains("active=true") || lower.contains("state=active") || lower.contains("state=1") || lower.contains("isactive: true")) {
                val pkgRegex = Regex("[a-zA-Z][a-zA-Z0-9_]*(\\.[a-zA-Z][a-zA-Z0-9_]*)+")
                projOutput.lines().forEach { line ->
                    if (line.lowercase().contains("package:") || line.lowercase().contains("pkg=")) {
                        pkgRegex.findAll(line).forEach { match -> projSet.add(match.value) }
                    }
                }
            }
            cachedActiveProjectionPackages = projSet
        } catch (e: Exception) {}
    }

    private fun isDynamicActiveVpn(context: Context, pkg: String): Boolean {
        try {
            val pm = context.packageManager
            val info = try { pm.getPackageInfo(pkg, PackageManager.GET_SERVICES) } catch (e: Exception) { null }
            if (info != null) {
                var hasVpnService = false
                info.services?.forEach { srv ->
                    if (srv.permission == "android.permission.BIND_VPN_SERVICE" || 
                        srv.name?.contains("VpnService", ignoreCase = true) == true ||
                        srv.name?.contains("Vpn", ignoreCase = true) == true ||
                        srv.name?.contains("WarpService", ignoreCase = true) == true ||
                        srv.name?.contains("DnsService", ignoreCase = true) == true) {
                        hasVpnService = true
                    }
                }
                if (hasVpnService) {
                    if (cachedForegroundServicePackages.contains(pkg) || 
                        cachedOngoingNotifPackages.contains(pkg) || 
                        isAppTopForeground(context, pkg)) {
                        return true
                    }
                    val am = context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
                    val processes = am.runningAppProcesses
                    processes?.forEach { proc ->
                        if (proc.pkgList?.contains(pkg) == true && 
                            proc.importance <= android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND_SERVICE) {
                            return true
                        }
                    }
                }
            }
        } catch (e: Exception) {}
        return false
    }

    private fun isDynamicDataSyncProtected(context: Context, pkg: String): Boolean {
        syncGlobalDiagnosticSnapshot(context)
        return cachedDataSyncPackages.contains(pkg)
    }

    private fun isDynamicDownloadProtected(context: Context, pkg: String): Boolean {
        syncGlobalDiagnosticSnapshot(context)
        if (cachedDownloadPackages.contains(pkg)) return true
        if (pkg == "com.android.providers.downloads" || pkg == "com.android.providers.downloads.ui") {
            try {
                val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as? android.app.DownloadManager
                if (dm != null) {
                    val query = android.app.DownloadManager.Query().setFilterByStatus(android.app.DownloadManager.STATUS_RUNNING)
                    val cursor = dm.query(query)
                    if (cursor != null) {
                        val hasRunning = cursor.moveToFirst()
                        cursor.close()
                        if (hasRunning) return true
                    }
                }
            } catch (e: Exception) {}
        } else if (cachedForegroundServicePackages.contains(pkg) || getBrowserPackages(context).contains(pkg)) {
            if (getBrowserPackages(context).contains(pkg)) {
                return false
            }
            try {
                val srvOutput = com.killapp.core.command.CommandExecutor.executeCommandWithOutput(
                    context, "dumpsys activity services $pkg 2>/dev/null | head -n 60"
                )
                val hasDataSyncType = srvOutput.contains("dataSync") || srvOutput.contains("data_sync") || (srvOutput.contains("specialUse") && !isMediaOrAudioApp(context, pkg))
                val isForegroundActive = srvOutput.contains("isForeground=true") || srvOutput.contains("startRequested=true") || srvOutput.contains("ServiceRecord{")
                if (hasDataSyncType && isForegroundActive) {
                    if (isMediaOrAudioApp(context, pkg) && !srvOutput.contains("dataSync") && !srvOutput.contains("data_sync")) {
                        return false
                    }
                    return true
                }
            } catch (e: Exception) {}
        }
        return false
    }

    private fun isDynamicCategoryProtected(context: Context, pkg: String, isTop: Boolean): Boolean {
        if (isDynamicActiveVpn(context, pkg)) return true

        syncGlobalDiagnosticSnapshot(context)

        if (isDynamicDownloadProtected(context, pkg)) return true

        if (isDynamicDataSyncProtected(context, pkg)) return true

        if (getDynamicNavigationPackages(context).contains(pkg)) {
            val hasNotif = cachedOngoingNotifPackages.contains(pkg)
            if (!isTop && hasNotif) return true
        }

        if (isCameraApp(context, pkg) && isTop) return true

        if (cachedActiveCameraPackages.contains(pkg)) return true

        if (cachedActiveProjectionPackages.isNotEmpty() && cachedActiveProjectionPackages.contains(pkg)) return true

        try {
            val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            if (am.mode == AudioManager.MODE_IN_CALL || am.mode == AudioManager.MODE_IN_COMMUNICATION) {
                if (cachedForegroundServicePackages.contains(pkg) || cachedOngoingNotifPackages.contains(pkg) || isTop) {
                    return true
                }
            }
        } catch (e: Exception) {}

        val pm = context.packageManager

        val hasRecordAudio = pm.checkPermission(android.Manifest.permission.RECORD_AUDIO, pkg) == PackageManager.PERMISSION_GRANTED
        if (hasRecordAudio) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                try {
                    val audioMgr = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
                    for (config in audioMgr.activeRecordingConfigurations) {
                        val recPkg = try {
                            val method = config.javaClass.getMethod("getClientPackageName")
                            method.isAccessible = true
                            method.invoke(config) as? String
                        } catch (e: Exception) {
                            try {
                                val uidMethod = config.javaClass.getMethod("getClientUid")
                                uidMethod.isAccessible = true
                                val uid = uidMethod.invoke(config) as? Int
                                uid?.let { context.packageManager.getPackagesForUid(it)?.firstOrNull() }
                            } catch (e2: Exception) { null }
                        }
                        if (recPkg == pkg) return true
                    }
                } catch (e: Exception) {}
            }
        }

        return false
    }

    fun isSmartProtected(context: Context, pkg: String, smart: Boolean): Boolean {
        if (criticalPackages.contains(pkg)) return true
        if (!smart) return false
        if (getDynamicCriticalPackages(context).contains(pkg)) return true

        val isTop = isAppTopForeground(context, pkg)
        return isDynamicCategoryProtected(context, pkg, isTop)
    }

    fun isQuickActionProtected(context: Context, pkg: String, smart: Boolean): Boolean {
        if (criticalPackages.contains(pkg)) return true
        if (!smart) return false
        if (getDynamicCriticalPackages(context).contains(pkg)) return true

        val isTop = isAppTopForeground(context, pkg)
        return isDynamicCategoryProtected(context, pkg, isTop)
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

    @Synchronized
    fun resetCache() {
        cachedBrowserPackages = null
        cachedActiveMediaPackages = null
        lastActiveMediaCheckTime = 0L
        cachedPlayingPackages = emptySet()
        lastPlayingPackagesOk = false
        lastPlayingCheckTime = 0L
        cachedNavigationPackages = null
        cachedSmartProtectedApps = null
        lastSmartCacheTime = 0L
        cachedForegroundServicePackages = emptySet()
        cachedOngoingNotifPackages = emptySet()
        cachedDownloadPackages = emptySet()
        cachedDataSyncPackages = emptySet()
        cachedActiveCameraPackages = emptySet()
        cachedActiveProjectionPackages = emptySet()
        lastGlobalDiagnosticCacheTime = 0L
        cachedCameraPackages = null
        cachedTopPackage = null
        lastTopPackageCheckTime = 0L
        cachedDynamicCriticalPackages = null
        lastDynamicCriticalCheckTime = 0L
    }
}

