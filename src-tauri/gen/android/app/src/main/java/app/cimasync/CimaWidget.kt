package app.cimasync

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.widget.RemoteViews

class CimaWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        schedulePulse(context)
        updateAllWidgets(context, appWidgetManager, appWidgetIds)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_PULSE) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val ids = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(context, CimaWidget::class.java)
            )
            if (ids.isNotEmpty()) {
                schedulePulse(context)
                updateAllWidgets(context, appWidgetManager, ids)
            }
        }
    }

    override fun onDisabled(context: Context) {
        (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(
            PendingIntent.getBroadcast(context, 0, Intent(context, CimaWidget::class.java).apply {
                action = ACTION_PULSE
            }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        )
    }

    private fun schedulePulse(context: Context) {
        val alarm = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pending = PendingIntent.getBroadcast(
            context, 0,
            Intent(context, CimaWidget::class.java).apply { action = ACTION_PULSE },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val triggerAt = System.currentTimeMillis() + PULSE_INTERVAL_MS
        // setAlarmClock: más fiable en Xiaomi/MIUI (no retrasa por Doze ni optimización de batería)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            val showIntent = PendingIntent.getActivity(
                context, 0, Intent(context, MainActivity::class.java),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            alarm.setAlarmClock(AlarmManager.AlarmClockInfo(triggerAt, showIntent), pending)
        } else {
            alarm.setExact(AlarmManager.RTC, triggerAt, pending)
        }
    }

    private fun updateAllWidgets(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        val hasInternet = hasInternet(context)
        val frame = getNextFrame(context)
        val drawable = if (hasInternet) ONLINE_FRAMES[frame] else OFFLINE_FRAMES[frame]
        val views = RemoteViews(context.packageName, R.layout.widget_cima)
        views.setImageViewResource(R.id.img_center, drawable)
        views.setTextViewText(
            R.id.txt_status,
            context.getString(if (hasInternet) R.string.cima_widget_status_online else R.string.cima_widget_status_offline)
        )
        views.setOnClickPendingIntent(
            R.id.widget_root,
            PendingIntent.getActivity(
                context, 0, Intent(context, MainActivity::class.java),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        )
        appWidgetIds.forEach { appWidgetManager.updateAppWidget(it, views) }
    }

    private fun getNextFrame(context: Context): Int {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val frame = (prefs.getInt(KEY_FRAME, 0) + 1) % FRAME_COUNT
        prefs.edit().putInt(KEY_FRAME, frame).apply()
        return frame
    }

    private fun hasInternet(context: Context): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = cm.activeNetwork ?: return false
            val caps = cm.getNetworkCapabilities(network) ?: return false
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
        } else {
            @Suppress("DEPRECATION")
            cm.activeNetworkInfo?.isConnected == true
        }
    }

    companion object {
        private const val ACTION_PULSE = "app.cimasync.action.WIDGET_PULSE"
        private const val PULSE_INTERVAL_MS = 350L
        private const val FRAME_COUNT = 4
        private const val PREFS = "cima_widget"
        private const val KEY_FRAME = "frame"
        private val ONLINE_FRAMES = intArrayOf(
            R.drawable.ic_signal_glass_online_f1,
            R.drawable.ic_signal_glass_online_f2,
            R.drawable.ic_signal_glass_online_f3,
            R.drawable.ic_signal_glass_online_f2
        )
        private val OFFLINE_FRAMES = intArrayOf(
            R.drawable.ic_signal_glass_offline_f1,
            R.drawable.ic_signal_glass_offline_f2,
            R.drawable.ic_signal_glass_offline_f3,
            R.drawable.ic_signal_glass_offline_f2
        )
    }
}
