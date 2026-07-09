package com.killapp.core.execution

import android.content.Context
import android.os.Build
import org.robolectric.RuntimeEnvironment
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.killapp.core.command.CommandExecutor
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.mockkStatic
import io.mockk.unmockkAll
import io.mockk.verify
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.util.ReflectionHelpers

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33], manifest = Config.NONE)
class KillerExecutionOEMTest {

    private lateinit var context: Context

    @Before
    fun setup() {
        context = RuntimeEnvironment.getApplication()
        
        // Mock React Native Arguments so it doesn't crash without RN context
        mockkStatic(Arguments::class)
        every { Arguments.createArray() } answers { JavaOnlyArray() }
        every { Arguments.createMap() } answers { JavaOnlyMap() }

        // Mock CommandExecutor
        mockkObject(CommandExecutor)
        every { CommandExecutor.executeCommand(any(), any()) } returns 0
        every { CommandExecutor.forceStopPackage(any(), any()) } returns true
        
        // Mock ProtectionFilter
        mockkObject(ProtectionFilter)
        every { ProtectionFilter.isActiveWebViewProtected(any(), any()) } returns false
        every { ProtectionFilter.isMediaActiveProtected(any(), any(), any(), any()) } returns false
        every { ProtectionFilter.isSmartProtected(any(), any(), any()) } returns false
        every { ProtectionFilter.isQuarantineProtected(any(), any()) } returns false
        every { ProtectionFilter.isAppOpsExempt(any(), any()) } returns false
        every { ProtectionFilter.getActiveMediaPackages(any()) } returns setOf()
    }

    @After
    fun teardown() {
        unmockkAll()
    }

    @Test
    fun `test ProcessKiller standard kill on AOSP`() {
        ReflectionHelpers.setStaticField(Build::class.java, "MANUFACTURER", "Google")
        
        val packages = JavaOnlyArray()
        packages.pushString("com.example.app")

        val result = ProcessKiller.killApps(context, packages)
        
        verify { CommandExecutor.forceStopPackage(context, "com.example.app") }
        
        val successArray = result.getArray("success") as JavaOnlyArray
        assertEquals(1, successArray.size())
        assertEquals("com.example.app", successArray.getString(0))
    }

    @Test
    fun `test ProcessKiller aggressive doze on MIUI`() {
        ReflectionHelpers.setStaticField(Build::class.java, "MANUFACTURER", "Xiaomi")
        
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("aggressiveDoze", true).commit()

        val packages = JavaOnlyArray()
        packages.pushString("com.miui.calculator")

        ProcessKiller.killApps(context, packages)
        
        // verify aggressive doze was called
        verify { CommandExecutor.executeCommand(context, "dumpsys deviceidle force-idle") }
    }

    @Test
    fun `test ProcessKiller shallow kill on OneUI (Samsung)`() {
        ReflectionHelpers.setStaticField(Build::class.java, "MANUFACTURER", "samsung")
        
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putBoolean("shallowHibernation", true)
            .putBoolean("gcmWakeupBypass", true)
            .commit()

        val packages = JavaOnlyArray()
        packages.pushString("com.sec.android.app.sbrowser")

        ProcessKiller.killApps(context, packages)
        
        verify { CommandExecutor.executeCommand(context, "am set-inactive com.sec.android.app.sbrowser true") }
        verify { CommandExecutor.executeCommand(context, "cmd appops set com.sec.android.app.sbrowser RUN_IN_BACKGROUND ignore") }
        verify(exactly = 0) { CommandExecutor.forceStopPackage(context, any()) }
    }
    
    @Test
    fun `test ProcessKiller phantom process slayer for custom ROMs`() {
        ReflectionHelpers.setStaticField(Build::class.java, "MANUFACTURER", "OnePlus")
        
        val prefs = context.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("phantomSlayer", true).commit()

        val packages = JavaOnlyArray()
        packages.pushString("com.oneplus.camera")

        ProcessKiller.killApps(context, packages)
        
        verify { CommandExecutor.executeCommand(context, "settings put global settings_enable_monitor_phantom_procs false") }
    }
    
    @Test
    fun `test ProcessKiller webview skip`() {
        every { ProtectionFilter.isActiveWebViewProtected(any(), "com.google.android.webview") } returns true
        
        val packages = JavaOnlyArray()
        packages.pushString("com.google.android.webview")

        val result = ProcessKiller.killApps(context, packages)
        
        val skipped = result.getArray("webviewSkipped") as JavaOnlyArray
        assertEquals(1, skipped.size())
        assertEquals("com.google.android.webview", skipped.getString(0))
    }
}
