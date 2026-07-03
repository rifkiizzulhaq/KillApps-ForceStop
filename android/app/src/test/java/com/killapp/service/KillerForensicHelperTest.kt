package com.killapp.service

import android.content.Context
import android.content.SharedPreferences
import io.mockk.every
import io.mockk.mockk
import io.mockk.unmockkAll
import io.mockk.verify
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class KillerForensicHelperTest {

    private lateinit var mockContext: Context
    private lateinit var mockPrefs: SharedPreferences
    private lateinit var mockEditor: SharedPreferences.Editor

    @Before
    fun setup() {
        mockContext = mockk(relaxed = true)
        mockPrefs = mockk(relaxed = true)
        mockEditor = mockk(relaxed = true)

        every { mockContext.getSharedPreferences("killapp_prefs", Context.MODE_PRIVATE) } returns mockPrefs
        every { mockPrefs.edit() } returns mockEditor
        every { mockEditor.putInt(any(), any()) } returns mockEditor
        every { mockEditor.putFloat(any(), any()) } returns mockEditor
    }

    @After
    fun teardown() {
        unmockkAll()
    }

    @Test
    fun `recordKillEvent does nothing when count is zero`() {
        KillerForensicHelper.recordKillEvent(mockContext, 0)
        verify(exactly = 0) { mockPrefs.edit() }
    }

    @Test
    fun `recordKillEvent does nothing when count is negative`() {
        KillerForensicHelper.recordKillEvent(mockContext, -1)
        verify(exactly = 0) { mockPrefs.edit() }
    }

    @Test
    fun `recordKillEvent accumulates kill count correctly`() {
        every { mockPrefs.getInt("totalKilledCount", 0) } returns 10
        every { mockPrefs.getInt("blockedWakeupsCount", 0) } returns 30
        every { mockPrefs.getFloat("totalRamSavedMb", 0f) } returns 650f

        KillerForensicHelper.recordKillEvent(mockContext, 5)

        verify { mockEditor.putInt("totalKilledCount", 15) }
        verify { mockEditor.putInt("blockedWakeupsCount", 45) }
        verify { mockEditor.putFloat("totalRamSavedMb", 975f) }
        verify { mockEditor.apply() }
    }

    @Test
    fun `recordKillEvent blocked wakeups is 3x kill count`() {
        every { mockPrefs.getInt("totalKilledCount", 0) } returns 0
        every { mockPrefs.getInt("blockedWakeupsCount", 0) } returns 0
        every { mockPrefs.getFloat("totalRamSavedMb", 0f) } returns 0f

        KillerForensicHelper.recordKillEvent(mockContext, 4)

        verify { mockEditor.putInt("blockedWakeupsCount", 12) }
    }

    @Test
    fun `recordKillEvent RAM estimation is 65MB per app`() {
        every { mockPrefs.getInt("totalKilledCount", 0) } returns 0
        every { mockPrefs.getInt("blockedWakeupsCount", 0) } returns 0
        every { mockPrefs.getFloat("totalRamSavedMb", 0f) } returns 0f

        KillerForensicHelper.recordKillEvent(mockContext, 3)

        verify { mockEditor.putFloat("totalRamSavedMb", 195f) }
    }

    @Test
    fun `processName substringBefore colon extracts package name correctly`() {
        assertEquals("com.example.app", "com.example.app:service".substringBefore(":"))
        assertEquals("com.example.app", "com.example.app".substringBefore(":"))
        assertEquals("com.google.android.gms", "com.google.android.gms:persistent".substringBefore(":"))
    }

    @Test
    fun `bedtime wrap-around calculation handles midnight correctly`() {
        val startMin = 1380  // 23:00
        val endMin = 300     // 05:00

        fun isBedtime(currentMin: Int): Boolean =
            if (startMin > endMin) currentMin >= startMin || currentMin <= endMin
            else currentMin in startMin..endMin

        assertTrue("23:00 should be bedtime", isBedtime(1380))
        assertTrue("00:00 midnight should be bedtime", isBedtime(0))
        assertTrue("02:30 should be bedtime", isBedtime(150))
        assertTrue("05:00 should be bedtime", isBedtime(300))
        assertFalse("12:00 noon should NOT be bedtime", isBedtime(720))
        assertFalse("22:59 should NOT be bedtime", isBedtime(1379))
    }

    @Test
    fun `bedtime same-day calculation works when start before end`() {
        val startMin = 840   // 14:00
        val endMin = 1020    // 17:00

        fun isBedtime(currentMin: Int): Boolean =
            if (startMin > endMin) currentMin >= startMin || currentMin <= endMin
            else currentMin in startMin..endMin

        assertTrue("14:00 should be in range", isBedtime(840))
        assertTrue("15:30 should be in range", isBedtime(930))
        assertTrue("17:00 should be in range", isBedtime(1020))
        assertFalse("13:59 should NOT be in range", isBedtime(839))
        assertFalse("17:01 should NOT be in range", isBedtime(1021))
        assertFalse("00:00 should NOT be in range", isBedtime(0))
    }
}
