package me.rodrigoleon.androidservices

import android.app.Activity
import android.content.Intent
import androidx.core.content.ContextCompat
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

@InvokeArg
class ExecuteTaskArgs {
    var task: String = ""
    var params: String = ""
}

@TauriPlugin
class AndroidServicesPlugin(private val activity: Activity) : Plugin(activity) {

    @Command
    fun startService(invoke: Invoke) {
        if (CimaForegroundService.isRunning) {
            invoke.resolve(JSObject().apply { put("started", false) })
            return
        }
        val intent = Intent(activity, CimaForegroundService::class.java).apply {
            action = CimaForegroundService.ACTION_START
        }
        ContextCompat.startForegroundService(activity, intent)
        invoke.resolve(JSObject().apply { put("started", true) })
    }

    @Command
    fun stopService(invoke: Invoke) {
        if (!CimaForegroundService.isRunning) {
            invoke.resolve(JSObject().apply { put("stopped", false) })
            return
        }
        val intent = Intent(activity, CimaForegroundService::class.java).apply {
            action = CimaForegroundService.ACTION_STOP
        }
        activity.startService(intent)
        invoke.resolve(JSObject().apply { put("stopped", true) })
    }

    @Command
    fun isRunning(invoke: Invoke) {
        invoke.resolve(JSObject().apply {
            put("running", CimaForegroundService.isRunning)
        })
    }

    @Command
    fun executeTask(invoke: Invoke) {
        if (!CimaForegroundService.isRunning) {
            invoke.reject("Service is not running")
            return
        }
        val handler = CimaForegroundService.taskHandler
        if (handler == null) {
            invoke.reject("Service task handler not available")
            return
        }
        val args = invoke.parseArgs(ExecuteTaskArgs::class.java)
        handler(args.task, args.params)
        invoke.resolve(JSObject().apply { put("queued", true) })
    }
}
