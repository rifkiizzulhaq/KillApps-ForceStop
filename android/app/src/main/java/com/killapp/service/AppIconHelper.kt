package com.killapp.service

import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.Base64
import java.io.ByteArrayOutputStream

object AppIconHelper {

    fun drawableToBitmap(drawable: Drawable, targetWidth: Int = 72, targetHeight: Int = 72): Bitmap {
        if (drawable is BitmapDrawable && drawable.bitmap != null) {
            return drawable.bitmap
        }
        val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else targetWidth
        val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else targetHeight
        val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        return bmp
    }

    fun getAppIconBase64(pm: PackageManager, appInfo: ApplicationInfo, packageName: String, iconCache: java.util.concurrent.ConcurrentMap<String, String>): String {
        val cached = iconCache[packageName]
        if (!cached.isNullOrEmpty()) {
            return cached
        }
        return try {
            val drawable = pm.getApplicationIcon(appInfo)
            val bitmap = drawableToBitmap(drawable, 72, 72)
            val scaledBitmap = Bitmap.createScaledBitmap(bitmap, 72, 72, true)
            val stream = ByteArrayOutputStream()
            scaledBitmap.compress(Bitmap.CompressFormat.PNG, 80, stream)
            val base64 = "data:image/png;base64," + Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
            iconCache[packageName] = base64
            base64
        } catch (e: Exception) {
            ""
        }
    }
}
