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
        "com.google.android.apps.maps",
        "com.waze",
        "com.android.phone",
        "com.android.server.telecom",
        "com.samsung.android.dialer"
    )

    private fun isMediaActiveProtected(context: Context, pkg: String, finerMedia: Boolean): Boolean {
        if (!finerMedia) return false
        try {
            val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            if (am.isMusicActive && mediaPackages.contains(pkg)) {
                return true
            }
        } catch (e: Exception) {}
        return false
    }

    private fun isSmartProtected(context: Context, pkg: String, smart: Boolean): Boolean {
        if (!smart) return false
        try {
            if (criticalPackages.contains(pkg)) {
                val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
                if (am.mode == AudioManager.MODE_IN_CALL || am.mode == AudioManager.MODE_IN_COMMUNICATION) {
                    return true
                }
            }
        } catch (e: Exception) {}
        return false
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

        for (i in 0 until packageNames.size()) {
            val pkg = packageNames.getString(i)
            if (pkg != null) {
                if (isMediaActiveProtected(context, pkg, finerMedia) || isSmartProtected(context, pkg, smart)) {
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
                    if (gcmBypass && !useShallow) {
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

        if (deepTrim) {
            ShizukuCommandHelper.executeCommand("am send-trim-memory --user 0 RUNNING_CRITICAL")
        }
        if (aggDoze) {
            ShizukuCommandHelper.executeCommand("dumpsys deviceidle force-idle")
        }

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

        try {
            val suProcess = Runtime.getRuntime().exec("su")
            val os = DataOutputStream(suProcess.outputStream)
            for (i in 0 until packageNames.size()) {
                val pkg = packageNames.getString(i)
                if (!pkg.isNullOrEmpty()) {
                    if (isMediaActiveProtected(context, pkg, finerMedia) || isSmartProtected(context, pkg, smart)) {
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
                }
            }
            if (deepTrim) {
                os.writeBytes("am send-trim-memory --user 0 RUNNING_CRITICAL\n")
            }
            if (aggDoze) {
                os.writeBytes("dumpsys deviceidle force-idle\n")
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

        if (isMediaActiveProtected(context, pkg, finerMedia) || isSmartProtected(context, pkg, smart)) {
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
            if (gcmBypass && !useShallow) {
                ShizukuCommandHelper.executeCommand("cmd appops set $pkg RUN_IN_BACKGROUND ignore")
            }
            if (wakeUp) {
                ShizukuCommandHelper.executeCommand("cmd appops set $pkg WAKE_LOCK ignore")
                ShizukuCommandHelper.executeCommand("cmd appops set $pkg RUN_ANY_IN_BACKGROUND ignore")
            }
        }
        return success
    }
}
