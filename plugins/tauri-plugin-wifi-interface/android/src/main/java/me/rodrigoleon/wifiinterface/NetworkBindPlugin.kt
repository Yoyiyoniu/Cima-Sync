package me.rodrigoleon.wifiinterface

import android.app.Activity
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.os.Build
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

@TauriPlugin
class NetworkBindPlugin(private val activity: Activity) : Plugin(activity) {

    private val connectivityManager: ConnectivityManager
        get() = activity.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    private val wifiManager: WifiManager
        get() = activity.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager

    @Command
    fun bindToWifi(invoke: Invoke) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            invoke.resolve(JSObject().apply { put("success", true) })
            return
        }

        for (network in connectivityManager.allNetworks) {
            val caps = connectivityManager.getNetworkCapabilities(network) ?: continue
            if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                if (connectivityManager.bindProcessToNetwork(network)) {
                    invoke.resolve(JSObject().apply { put("success", true) })
                    return
                }
            }
        }

        invoke.reject("No hay red WiFi disponible")
    }

    @Command
    fun unbindNetwork(invoke: Invoke) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            connectivityManager.bindProcessToNetwork(null)
        }
        invoke.resolve(JSObject().apply { put("success", true) })
    }

    @Command
    fun getWifiStatus(invoke: Invoke) {
        val activeNet = connectivityManager.activeNetwork
        val caps = activeNet?.let { connectivityManager.getNetworkCapabilities(it) }
        val isBound = caps?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true

        @Suppress("DEPRECATION")
        val ssid = if (isBound) {
            wifiManager.connectionInfo?.ssid
                ?.removePrefix("\"")
                ?.removeSuffix("\"")
                ?: ""
        } else {
            ""
        }

        invoke.resolve(JSObject().apply {
            put("isBound", isBound)
            put("ssid", ssid)
        })
    }
}
