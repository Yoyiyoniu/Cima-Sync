package me.rodrigoleon.androidservices

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

class CimaForegroundService : Service() {

    private val serviceThread = HandlerThread("CimaServiceThread")
    private lateinit var serviceHandler: Handler

    companion object {
        const val ACTION_START = "me.rodrigoleon.androidservices.ACTION_START"
        const val ACTION_STOP = "me.rodrigoleon.androidservices.ACTION_STOP"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "cima_sync_service"
        private const val TAG = "CimaForegroundService"

        @Volatile var isRunning = false

        // Plugin calls this lambda to send work to the service thread without restarting it.
        // Set in onCreate, nullified in onDestroy.
        var taskHandler: ((task: String, params: String) -> Unit)? = null
    }

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        serviceThread.start()
        serviceHandler = Handler(serviceThread.looper)
        taskHandler = { task, params ->
            serviceHandler.post { handleTask(task, params) }
        }
        Log.d(TAG, "Service created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            Log.d(TAG, "Stop action received")
            ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
            stopSelf()
            return START_NOT_STICKY
        }

        startForeground(NOTIFICATION_ID, buildNotification())
        Log.d(TAG, "Service started in foreground")
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        taskHandler = null
        serviceThread.quitSafely()
        Log.d(TAG, "Service destroyed")
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun buildNotification(): Notification {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Cima Sync Servicio",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Mantiene la autenticación WiFi activa en segundo plano"
                setShowBadge(false)
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Cima Sync")
            .setContentText("Autenticación automática activa")
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun handleTask(task: String, params: String) {
        Log.d(TAG, "Task recibida: $task | params: $params")
        // The actual task logic is dispatched here on the service background thread.
        // Consumers can extend this by registering their own taskHandler after startService.
    }
}
