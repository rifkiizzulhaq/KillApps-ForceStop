package com.killapp.service

import android.content.Context
import android.media.AudioManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import java.io.DataOutputStream

object KillerExecutionHelper {

    private val mediaPackages = setOf(
        "com.spotify.music",
        "com.google.android.apps.youtube.music",
        "com.apple.android.music",
        "com.tencent.ibg.joox",
        "com.deezer.android.app",
        "com.soundcloud.android",
        "com.google.android.videos"
    )

    private val criticalPackages = setOf(
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
        "com.samsung.android.dialer"
    )

    fun getActiveMediaPackages(): Set<String> {
        val packages = mutableSetOf<String>()
        try {
            val output = ShizukuCommandHelper.executeCommandWithOutput("dumpsys media_session")
            val regex = Regex("(ownerPackageName|package|Media button session is ComponentInfo\\{)([a-zA-Z0-9_.]+)")
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
        if (!finerMedia) return false
        try {
            val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            if (am.isMusicActive && (mediaPackages.contains(pkg) || dynamicMediaPkgs.contains(pkg))) {
                return true
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

    private fun recordShallowKill(context: Context, pkg: String) {
        try {
            val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
            val set = (prefs.getStringSet("shallow_killed_set", setOf()) ?: setOf()).toMutableSet()
            set.add(pkg)
            prefs.edit().putStringSet("shallow_killed_set", set).apply()
        } catch (e: Exception) {}
    }

    fun killAppsShizuku(context: Context, packageNames: ReadableArray): WritableMap {
        val successList = Arguments.createArray()
        val failedList = Arguments.createArray()

        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        val gcmBypass = prefs.getBoolean("gcmWakeupBypass", true)
        val deepTrim = prefs.getBoolean("deepTrimMemory", false)
        val aggDoze = prefs.getBoolean("aggressiveDoze", false)
        val smart = prefs.getBoolean("smartHibernation", true)
        val finerMedia = prefs.getBoolean("finerMediaDetection", false)
        val shallow = prefs.getBoolean("shallowHibernation", false)
        val wakeUp = prefs.getBoolean("wakeUpTracking", true)
        val dontRemoveNotif = prefs.getBoolean("dontRemoveNotif", false)

        val phantomSlayer = prefs.getBoolean("phantomSlayer", false)

        val activeMediaPkgs = if (finerMedia) getActiveMediaPackages() else setOf()

        for (i in 0 until packageNames.size()) {
            val pkg = packageNames.getString(i)
            if (pkg != null) {
                if (isMediaActiveProtected(context, pkg, finerMedia, activeMediaPkgs) || isSmartProtected(context, pkg, smart) || isQuarantineProtected(context, pkg)) {
                    failedList.pushString(pkg)
                    continue
                }

                val useShallow = shallow || dontRemoveNotif
                val success = if (useShallow) {
                    val r1 = ShizukuCommandHelper.executeCommand("am set-inactive $pkg true")
                    val r2 = ShizukuCommandHelper.executeCommand("cmd appops set $pkg RUN_IN_BACKGROUND ignore")
                    r1 == 0 || r2 == 0
                } else {
                    ShizukuCommandHelper.forceStopPackage(pkg)
                }

                if (success) {
                    successList.pushString(pkg)
                    if (useShallow) {
                        recordShallowKill(context, pkg)
                        if (deepTrim) {
                            ShizukuCommandHelper.executeCommand("am send-trim-memory $pkg RUNNING_CRITICAL")
                        }
                    } else if (gcmBypass) {
                        ShizukuCommandHelper.executeCommand("cmd appops set $pkg RUN_IN_BACKGROUND ignore")
                    }
                    if (wakeUp) {
                        ShizukuCommandHelper.executeCommand("cmd appops set $pkg WAKE_LOCK ignore")
                        ShizukuCommandHelper.executeCommand("cmd appops set $pkg RUN_ANY_IN_BACKGROUND ignore")
                    }
                } else {
                    failedList.pushString(pkg)
                }
            }
        }

        if (aggDoze) {
            ShizukuCommandHelper.executeCommand("dumpsys deviceidle force-idle")
        }
        if (phantomSlayer && android.os.Build.VERSION.SDK_INT >= 31) {
            ShizukuCommandHelper.executeCommand("settings put global settings_enable_monitor_phantom_procs false")
        }

        KillerForensicHelper.recordKillEvent(context, successList.size())

        val resultMap = Arguments.createMap()
        resultMap.putArray("success", successList)
        resultMap.putArray("failed", failedList)
        return resultMap
    }

    fun killAppsViaRoot(context: Context, packageNames: ReadableArray): WritableMap {
        val successList = mutableListOf<String>()
        val failedList = mutableListOf<String>()

        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        val gcmBypass = prefs.getBoolean("gcmWakeupBypass", true)
        val deepTrim = prefs.getBoolean("deepTrimMemory", false)
        val aggDoze = prefs.getBoolean("aggressiveDoze", false)
        val smart = prefs.getBoolean("smartHibernation", true)
        val finerMedia = prefs.getBoolean("finerMediaDetection", false)
        val shallow = prefs.getBoolean("shallowHibernation", false)
        val wakeUp = prefs.getBoolean("wakeUpTracking", true)
        val dontRemoveNotif = prefs.getBoolean("dontRemoveNotif", false)
        val phantomSlayer = prefs.getBoolean("phantomSlayer", false)

        try {
            val suProcess = Runtime.getRuntime().exec("su")
            val os = DataOutputStream(suProcess.outputStream)
            for (i in 0 until packageNames.size()) {
                val pkg = packageNames.getString(i)
                if (!pkg.isNullOrEmpty()) {
                    if (isMediaActiveProtected(context, pkg, finerMedia) || isSmartProtected(context, pkg, smart) || isQuarantineProtected(context, pkg)) {
                        failedList.add(pkg)
                        continue
                    }

                    val useShallow = shallow || dontRemoveNotif
                    if (useShallow) {
                        os.writeBytes("am set-inactive $pkg true\n")
                        os.writeBytes("cmd appops set $pkg RUN_IN_BACKGROUND ignore\n")
                    } else {
                        os.writeBytes("am force-stop $pkg\n")
                        if (gcmBypass) {
                            os.writeBytes("cmd appops set $pkg RUN_IN_BACKGROUND ignore\n")
                        }
                    }
                    if (wakeUp) {
                        os.writeBytes("cmd appops set $pkg WAKE_LOCK ignore\n")
                        os.writeBytes("cmd appops set $pkg RUN_ANY_IN_BACKGROUND ignore\n")
                    }
                    os.flush()
                    successList.add(pkg)
                    if (useShallow) {
                        recordShallowKill(context, pkg)
                        if (deepTrim) {
                            os.writeBytes("am send-trim-memory $pkg RUNNING_CRITICAL\n")
                        }
                    }
                }
            }
            if (aggDoze) {
                os.writeBytes("dumpsys deviceidle force-idle\n")
            }
            if (phantomSlayer && android.os.Build.VERSION.SDK_INT >= 31) {
                os.writeBytes("settings put global settings_enable_monitor_phantom_procs false\n")
            }
            os.writeBytes("exit\n")
            os.flush()
            suProcess.waitFor()
        } catch (e: Exception) {
            for (i in 0 until packageNames.size()) {
                val pkg = packageNames.getString(i)
                if (!pkg.isNullOrEmpty() && !successList.contains(pkg)) {
                    failedList.add(pkg)
                }
            }
        }

        KillerForensicHelper.recordKillEvent(context, successList.size)

        val result = Arguments.createMap()
        val successArray = Arguments.createArray()
        val failedArray = Arguments.createArray()
        successList.forEach { successArray.pushString(it) }
        failedList.forEach { failedArray.pushString(it) }
        result.putArray("success", successArray)
        result.putArray("failed", failedArray)
        return result
    }

    fun killSinglePackageInternal(context: Context, pkg: String): Boolean {
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        val gcmBypass = prefs.getBoolean("gcmWakeupBypass", true)
        val smart = prefs.getBoolean("smartHibernation", true)
        val finerMedia = prefs.getBoolean("finerMediaDetection", false)
        val shallow = prefs.getBoolean("shallowHibernation", false)
        val wakeUp = prefs.getBoolean("wakeUpTracking", true)
        val dontRemoveNotif = prefs.getBoolean("dontRemoveNotif", false)
        val deepTrim = prefs.getBoolean("deepTrimMemory", false)

        val activeMediaPkgs = if (finerMedia) getActiveMediaPackages() else setOf()

        if (isMediaActiveProtected(context, pkg, finerMedia, activeMediaPkgs) || isSmartProtected(context, pkg, smart) || isQuarantineProtected(context, pkg)) {
            return false
        }

        val useShallow = shallow || dontRemoveNotif
        val success = if (useShallow) {
            val r1 = ShizukuCommandHelper.executeCommand("am set-inactive $pkg true")
            val r2 = ShizukuCommandHelper.executeCommand("cmd appops set $pkg RUN_IN_BACKGROUND ignore")
            r1 == 0 || r2 == 0
        } else {
            ShizukuCommandHelper.forceStopPackage(pkg)
        }

        if (success) {
            if (useShallow) {
                recordShallowKill(context, pkg)
                if (deepTrim) {
                    ShizukuCommandHelper.executeCommand("am send-trim-memory $pkg RUNNING_CRITICAL")
                }
            } else if (gcmBypass) {
                ShizukuCommandHelper.executeCommand("cmd appops set $pkg RUN_IN_BACKGROUND ignore")
            }
            if (wakeUp) {
                ShizukuCommandHelper.executeCommand("cmd appops set $pkg WAKE_LOCK ignore")
                ShizukuCommandHelper.executeCommand("cmd appops set $pkg RUN_ANY_IN_BACKGROUND ignore")
            }
            KillerForensicHelper.recordKillEvent(context, 1)
        }
        return success
    }
}
