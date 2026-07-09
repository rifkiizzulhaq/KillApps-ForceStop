package com.killapp.core.execution

import com.killapp.core.execution.ProtectionFilter

import android.content.Context
import android.content.SharedPreferences
import android.media.AudioManager
import io.mockk.every
import io.mockk.mockk
import io.mockk.unmockkAll
import org.junit.After
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33], manifest = Config.NONE)
class ProtectionFilterTest {

    private lateinit var mockContext: Context
    private lateinit var mockPrefs: SharedPreferences
    private lateinit var mockAudioManager: AudioManager

    @Before
    fun setup() {
        mockContext = mockk(relaxed = true)
        mockPrefs = mockk(relaxed = true)
        mockAudioManager = mockk(relaxed = true)

        every { mockContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE) } returns mockPrefs
        every { mockContext.getSystemService(Context.AUDIO_SERVICE) } returns mockAudioManager
    }

    @After
    fun teardown() {
        unmockkAll()
    }

    @Test
    fun `isSmartProtected returns false immediately when smart is disabled`() {
        val result = ProtectionFilter.isSmartProtected(mockContext, "com.any.app", smart = false)
        assertFalse(result)
    }

    @Test
    fun `isSmartProtected returns true for critical system packages`() {
        every { mockAudioManager.mode } returns AudioManager.MODE_NORMAL
        val criticals = listOf("android", "com.android.systemui", "com.android.settings",
            "com.google.android.gms", "com.google.android.inputmethod.latin",
            "com.android.inputmethod.latin", "com.android.phone",
            "com.android.server.telecom", "com.samsung.android.dialer")
        for (pkg in criticals) {
            assertTrue("$pkg should be protected", ProtectionFilter.isSmartProtected(mockContext, pkg, smart = true))
        }
    }

    @Test
    fun `isSmartProtected returns false for non-critical app without active call`() {
        every { mockAudioManager.mode } returns AudioManager.MODE_NORMAL
        val result = ProtectionFilter.isSmartProtected(mockContext, "com.example.app", smart = true)
        assertFalse(result)
    }

    @Test
    fun `isSmartProtected returns true when device is in active call`() {
        every { mockAudioManager.mode } returns AudioManager.MODE_IN_CALL
        val result = ProtectionFilter.isSmartProtected(mockContext, "com.example.app", smart = true)
        assertTrue(result)
    }

    @Test
    fun `isSmartProtected returns true when device is in communication mode`() {
        every { mockAudioManager.mode } returns AudioManager.MODE_IN_COMMUNICATION
        val result = ProtectionFilter.isSmartProtected(mockContext, "com.voip.app", smart = true)
        assertTrue(result)
    }

    @Test
    fun `isMediaActiveProtected returns false immediately when finerMedia is disabled`() {
        val result = ProtectionFilter.isMediaActiveProtected(mockContext, "com.spotify.music", finerMedia = false)
        assertFalse(result)
    }

    @Test
    fun `isMediaActiveProtected returns false for non-media app even when music is active`() {
        every { mockAudioManager.isMusicActive } returns true
        val result = ProtectionFilter.isMediaActiveProtected(mockContext, "com.example.app", finerMedia = true)
        assertFalse(result)
    }

    @Test
    fun `isMediaActiveProtected returns true for known media app when music is active`() {
        every { mockAudioManager.isMusicActive } returns true
        val result = ProtectionFilter.isMediaActiveProtected(mockContext, "com.spotify.music", finerMedia = true)
        assertTrue(result)
    }

    @Test
    fun `isMediaActiveProtected returns false for media app when music is NOT active`() {
        every { mockAudioManager.isMusicActive } returns false
        val result = ProtectionFilter.isMediaActiveProtected(mockContext, "com.spotify.music", finerMedia = true)
        assertFalse(result)
    }

    @Test
    fun `isMediaActiveProtected returns true for dynamic media package when music active`() {
        every { mockAudioManager.isMusicActive } returns true
        val dynamicPkgs = setOf("com.custom.player")
        val result = ProtectionFilter.isMediaActiveProtected(mockContext, "com.custom.player", finerMedia = true, dynamicMediaPkgs = dynamicPkgs)
        assertTrue(result)
    }

    @Test
    fun `isQuarantineProtected returns true for quarantined package`() {
        every { mockPrefs.getStringSet("quarantinePackages", any()) } returns setOf("com.frozen.app")
        val result = ProtectionFilter.isQuarantineProtected(mockContext, "com.frozen.app")
        assertTrue(result)
    }

    @Test
    fun `isQuarantineProtected returns false for non-quarantined package`() {
        every { mockPrefs.getStringSet("quarantinePackages", any()) } returns setOf("com.other.app")
        val result = ProtectionFilter.isQuarantineProtected(mockContext, "com.example.app")
        assertFalse(result)
    }

    @Test
    fun `isQuarantineProtected returns false when quarantine list is empty`() {
        every { mockPrefs.getStringSet("quarantinePackages", any()) } returns emptySet()
        val result = ProtectionFilter.isQuarantineProtected(mockContext, "com.example.app")
        assertFalse(result)
    }

    @Test
    fun `notification ID bitmask always produces positive value for common packages`() {
        val packages = listOf("com.example.app", "com.google.android.gms",
            "com.samsung.android.dialer", "a", "com.very.long.package.name.example")
        for (pkg in packages) {
            val id = (pkg.hashCode() and 0x7FFFFFFF) + 1000
            assertTrue("Notification ID for $pkg must be positive, was $id", id > 0)
        }
    }

    @Test
    fun `notification ID bitmask handles Int MIN_VALUE hash without overflow`() {
        val id = (Int.MIN_VALUE and 0x7FFFFFFF) + 1000
        assertTrue("ID with MIN_VALUE hash must be positive", id > 0)
    }
}
