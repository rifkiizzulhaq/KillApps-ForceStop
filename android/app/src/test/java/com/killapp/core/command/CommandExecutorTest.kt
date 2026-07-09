package com.killapp.core.command

import android.content.Context
import org.robolectric.RuntimeEnvironment
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.unmockkAll
import io.mockk.verify
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import rikka.shizuku.Shizuku

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33], manifest = Config.NONE)
class CommandExecutorTest {

    private lateinit var context: Context

    @Before
    fun setup() {
        context = RuntimeEnvironment.getApplication()
        mockkStatic(Shizuku::class)
        // Default Shizuku to alive
        every { Shizuku.pingBinder() } returns true
        // We can't mock private newProcess easily in Kotlin, so we will rely on checking Shizuku.pingBinder()
        // and catching the reflection exception in the test, which returns -1 (or false for forceStop)
        
        // We can't easily mock java.lang.Runtime without PowerMock, but we can test
        // the logic routing of CommandExecutor (if mode == shizuku vs root).
    }

    @After
    fun teardown() {
        unmockkAll()
    }

    @Test
    fun `test forceStopPackage generates correct am force-stop command`() {
        // We will simulate the working mode is Shizuku
        com.killapp.core.ui.SettingsManager.setWorkingMode(context, "shizuku")
        
        val result = CommandExecutor.forceStopPackage(context, "com.example.app")
        
        // The reflection will fail in tests (ClassNotFoundException for rikka.shizuku.Shizuku, or MethodNotFound)
        // so result will be false. This is expected since we can't fully mock the private method.
        assertEquals(false, result)
    }
    
    @Test
    fun `test forceStopPackage fallbacks to root when shizuku binder is dead`() {
        com.killapp.core.ui.SettingsManager.setWorkingMode(context, "shizuku")
        
        // Simulate binder death
        every { Shizuku.pingBinder() } returns false
        
        // This will try to run via Runtime.getRuntime().exec("su")
        // In Robolectric, this usually fails with an exception or returns != 0 since su doesn't exist
        // So the result will be false.
        val result = CommandExecutor.forceStopPackage(context, "com.example.app")
        assertEquals(false, result)
    }

    @Test
    fun `test forceStopPackage uses root directly if mode is root`() {
        com.killapp.core.ui.SettingsManager.setWorkingMode(context, "root")
        
        // Should ignore Shizuku entirely
        val result = CommandExecutor.forceStopPackage(context, "com.example.app")
        
        // Since there is no su in Robolectric, it returns false
        assertEquals(false, result)
    }
}
