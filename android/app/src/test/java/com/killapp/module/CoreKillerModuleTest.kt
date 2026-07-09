package com.killapp.module

import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import io.mockk.every
import io.mockk.justRun
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.unmockkAll
import io.mockk.verify
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import rikka.shizuku.Shizuku
import com.killapp.bridge.CoreKillerModule

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33], manifest = Config.NONE)
class CoreKillerModuleTest {

    private lateinit var mockReactContext: ReactApplicationContext
    private lateinit var module: CoreKillerModule
    private lateinit var mockPrefs: SharedPreferences
    private lateinit var mockEditor: SharedPreferences.Editor

    @Before
    fun setup() {
        mockReactContext = mockk(relaxed = true)
        mockPrefs = mockk(relaxed = true)
        mockEditor = mockk(relaxed = true)

        every { mockReactContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE) } returns mockPrefs
        every { mockPrefs.edit() } returns mockEditor
        every { mockEditor.putBoolean(any(), any()) } returns mockEditor
        every { mockEditor.putString(any(), any()) } returns mockEditor
        every { mockEditor.putInt(any(), any()) } returns mockEditor
        every { mockEditor.putStringSet(any(), any()) } returns mockEditor
        
        // Mock static methods of Shizuku
        mockkStatic(Shizuku::class)
        
        // Bypass listener registration during init
        justRun { Shizuku.addRequestPermissionResultListener(any()) }
        justRun { Shizuku.removeRequestPermissionResultListener(any()) }

        module = CoreKillerModule(mockReactContext)
    }

    @After
    fun teardown() {
        unmockkAll()
    }

    @Test
    fun `checkBinder returns true when Shizuku is running`() {
        val mockPromise = mockk<Promise>(relaxed = true)
        every { Shizuku.pingBinder() } returns true

        module.checkBinder(mockPromise)

        verify { mockPromise.resolve(true) }
    }

    @Test
    fun `checkBinder returns false when Shizuku is not running`() {
        val mockPromise = mockk<Promise>(relaxed = true)
        every { Shizuku.pingBinder() } returns false

        module.checkBinder(mockPromise)

        verify { mockPromise.resolve(false) }
    }

    @Test
    fun `checkPermission returns true when permission is granted`() {
        val mockPromise = mockk<Promise>(relaxed = true)
        every { Shizuku.pingBinder() } returns true
        every { Shizuku.checkSelfPermission() } returns PackageManager.PERMISSION_GRANTED

        module.checkPermission(mockPromise)

        verify { mockPromise.resolve(true) }
    }

    @Test
    fun `checkPermission returns false when permission is denied`() {
        val mockPromise = mockk<Promise>(relaxed = true)
        every { Shizuku.pingBinder() } returns true
        every { Shizuku.checkSelfPermission() } returns PackageManager.PERMISSION_DENIED

        module.checkPermission(mockPromise)

        verify { mockPromise.resolve(false) }
    }
    
    @Test
    fun `checkPermission returns false when Shizuku is not running`() {
        val mockPromise = mockk<Promise>(relaxed = true)
        every { Shizuku.pingBinder() } returns false

        module.checkPermission(mockPromise)

        verify { mockPromise.resolve(false) }
    }

    @Test
    fun `setWorkingMode saves mode to SharedPreferences`() {
        every { mockEditor.putString(any(), any()) } returns mockEditor
        
        module.setWorkingMode("root")
        
        verify { mockEditor.putString("workingMode", "root") }
        verify { mockEditor.apply() }
    }

    @Test
    fun `setGeekOptions saves extreme configurations to SharedPreferences`() {
        every { mockEditor.putBoolean(any(), any()) } returns mockEditor
        
        module.setGeekOptions(true, false, true)
        
        verify { mockEditor.putBoolean("aggressiveDoze", true) }
        verify { mockEditor.putBoolean("gcmWakeupBypass", false) }
        verify { mockEditor.putBoolean("deepTrimMemory", true) }
        verify { mockEditor.apply() }
    }

    @Test
    fun `setHibernationOptions saves hibernation flags to SharedPreferences`() {
        every { mockEditor.putBoolean(any(), any()) } returns mockEditor
        
        module.setHibernationOptions(true, true, false, true, false, true)
        
        verify { mockEditor.putBoolean("smartHibernation", true) }
        verify { mockEditor.putBoolean("finerMediaDetection", true) }
        verify { mockEditor.putBoolean("shallowHibernation", false) }
        verify { mockEditor.putBoolean("wakeUpTracking", true) }
        verify { mockEditor.putBoolean("dontRemoveNotif", false) }
        verify { mockEditor.putBoolean("ignoreBackgroundFree", true) }
        verify { mockEditor.apply() }
    }

    @Test
    fun `setAutoHibernationConfig saves state, targets, and registers receiver when enabled`() {
        val mockArray = mockk<com.facebook.react.bridge.ReadableArray>()
        every { mockArray.size() } returns 2
        every { mockArray.getString(0) } returns "com.example.app1"
        every { mockArray.getString(1) } returns "com.example.app2"
        
        every { mockEditor.putStringSet(any(), any()) } returns mockEditor
        
        // Mock pendaftaran receiver
        val filterSlot = io.mockk.slot<android.content.IntentFilter>()
        every { mockReactContext.registerReceiver(any(), capture(filterSlot)) } returns null
        
        module.setAutoHibernationConfig(true, mockArray)
        
        // Verifikasi data array dikonversi & tersimpan ke persistensi
        verify { mockEditor.putStringSet("autoHibernationTargets", match { 
            it.contains("com.example.app1") && it.contains("com.example.app2") 
        }) }
        verify { mockEditor.putStringSet("postponedPackages", any()) }
        verify { mockEditor.apply() }
        
        // Verifikasi krusial: pastikan Service dinyalakan
        verify { mockReactContext.startForegroundService(any()) }
    }

    @Test
    fun `setQuickActionNotification saves state, registers receiver and starts service when enabled`() {
        every { mockEditor.putBoolean(any(), any()) } returns mockEditor
        
        module.setQuickActionNotification(true)
        
        verify { mockEditor.putBoolean("quickActionNotifEnabled", true) }
        verify { mockEditor.apply() }
        
        // Verifikasi krusial: pastikan BroadcastReceiver untuk quick action didaftarkan
        verify { mockReactContext.registerReceiver(any(), any<android.content.IntentFilter>(), any()) }
        
        // Verifikasi krusial: pastikan Foreground Service dinyalakan
        verify { mockReactContext.startForegroundService(any()) }
    }

    @Test
    fun `setQuickActionNotification stops service when disabled`() {
        every { mockEditor.putBoolean(any(), any()) } returns mockEditor
        
        module.setQuickActionNotification(false)
        
        verify { mockEditor.putBoolean("quickActionNotifEnabled", false) }
        verify { mockEditor.apply() }
        
        // Verifikasi bahwa service dimatikan jika dinonaktifkan
        verify { mockReactContext.stopService(any()) }
    }
    @Test
    fun `setProOptions saves flags to SharedPreferences and starts service when active`() {
        val mockMap = mockk<com.facebook.react.bridge.ReadableMap>(relaxed = true)
        every { mockMap.hasKey("phantomSlayer") } returns true
        every { mockMap.getBoolean("phantomSlayer") } returns true
        every { mockMap.hasKey("autoKillScheduler") } returns true
        every { mockMap.getInt("autoKillScheduler") } returns 4
        
        every { mockEditor.putBoolean(any(), any()) } returns mockEditor
        every { mockEditor.putInt(any(), any()) } returns mockEditor
        
        // Mock that at least one active flag exists (e.g., autoKillScheduler > 0)
        every { mockPrefs.getBoolean(any(), any()) } returns false
        every { mockPrefs.getInt("autoKillScheduler", 0) } returns 4
        
        module.setProOptions(mockMap)
        
        verify { mockEditor.putBoolean("phantomSlayer", true) }
        verify { mockEditor.putInt("autoKillScheduler", 4) }
        verify { mockEditor.apply() }
        
        // Verify service is started
        verify { mockReactContext.startForegroundService(any()) }
    }

    @Test
    fun `setProOptions stops service when all flags are inactive`() {
        val mockMap = mockk<com.facebook.react.bridge.ReadableMap>(relaxed = true)
        
        every { mockPrefs.getBoolean(any(), any()) } returns false
        every { mockPrefs.getInt("autoKillScheduler", 0) } returns 0
        
        module.setProOptions(mockMap)
        
        verify { mockEditor.apply() }
        
        // Verify service is stopped
        verify { mockReactContext.stopService(any()) }
    }
}
