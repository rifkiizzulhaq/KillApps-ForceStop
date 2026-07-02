package com.killapp.service

import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import android.widget.Toast
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.Arguments

@RequiresApi(Build.VERSION_CODES.N)
class KillerTileService : TileService() {

    override fun onStartListening() {
        super.onStartListening()
        updateTileState()
    }

    override fun onClick() {
        super.onClick()
        val prefs = getSharedPreferences("killapp_prefs", MODE_PRIVATE)
        val targets = prefs.getStringSet("autoHibernationTargets", setOf()) ?: setOf()
        if (targets.isEmpty()) {
            Toast.makeText(this, "Daftar KillApps masih kosong!", Toast.LENGTH_SHORT).show()
            return
        }

        val array = Arguments.createArray()
        for (pkg in targets) {
            array.pushString(pkg)
        }

        Thread {
            try {
                val mode = prefs.getString("killerMode", "SHIZUKU")
                if (mode == "ROOT") {
                    KillerExecutionHelper.killAppsViaRoot(this, array)
                } else {
                    KillerExecutionHelper.killAppsShizuku(this, array)
                }
                KillerForensicHelper.recordKillEvent(this, targets.size)
                updateTileState()
            } catch (e: Exception) {
            }
        }.start()

        Toast.makeText(this, "KillApps: Mengeksekusi ${targets.size} aplikasi...", Toast.LENGTH_SHORT).show()
    }

    private fun updateTileState() {
        val tile = qsTile ?: return
        tile.state = Tile.STATE_ACTIVE
        tile.label = "KillApps Boost"
        tile.updateTile()
    }
}
