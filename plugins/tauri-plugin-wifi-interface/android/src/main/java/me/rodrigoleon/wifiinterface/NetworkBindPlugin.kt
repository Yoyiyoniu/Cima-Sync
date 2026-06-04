package me.rodrigoleon.wifiinterface

import android.app.Activity
import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.net.wifi.WifiNetworkSpecifier
import android.os.Build
import app.tauri.annotation.Command
import app.tauri.annotation.Permission
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.util.concurrent.LinkedBlockingDeque
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

@TauriPlugin(
    permissions = [
        Permission(strings = ["android.permission.ACCESS_WIFI_STATE"], alias = "wifiState"),
        Permission(strings = ["android.permission.CHANGE_NETWORK_STATE"], alias = "changeNetwork"),
        Permission(strings = ["android.permission.CHANGE_WIFI_STATE"], alias = "changeWifiState")
    ]
)
class NetworkBindPlugin(private val activity: Activity) : Plugin(activity) {

    private val connectivityManager: ConnectivityManager
        get() = activity.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    private val wifiManager: WifiManager
        get() = activity.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager

    private var observerCallback: ConnectivityManager.NetworkCallback? = null
    private var connectNetworkCallback: ConnectivityManager.NetworkCallback? = null

    // -------------------------------------------------------
    // Long-poll queue — canal directo Android → Rust
    // Rust llama nextWifiEvent() y queda bloqueado hasta que
    // llega un evento; no hay timer ni polling.
    // -------------------------------------------------------

    private val rustQueue = LinkedBlockingDeque<JSObject>(256)
    private var pendingRustInvoke: Invoke? = null
    private val rustLock = ReentrantLock()

    // Despacha a JS (trigger) y a Rust (resolve pending invoke o encola)
    private fun dispatch(payload: JSObject) {
        trigger("wifiStateChange", payload)
        rustLock.withLock {
            val pending = pendingRustInvoke
            if (pending != null) {
                pendingRustInvoke = null
                pending.resolve(payload)
            } else {
                // Si la cola está llena descarta el más antiguo (no bloquea)
                if (!rustQueue.offerLast(payload)) {
                    rustQueue.pollFirst()
                    rustQueue.offerLast(payload)
                }
            }
        }
    }

    // -------------------------------------------------------
    // Observer — NetworkCallback
    // -------------------------------------------------------

    private val wifiNetworkCallback = object : ConnectivityManager.NetworkCallback() {

        override fun onAvailable(network: Network) {
            dispatch(JSObject().apply {
                put("event", "available")
                put("networkId", network.networkHandle)
            })
        }

        override fun onLost(network: Network) {
            dispatch(JSObject().apply {
                put("event", "lost")
                put("networkId", network.networkHandle)
            })
        }

        override fun onCapabilitiesChanged(network: Network, capabilities: NetworkCapabilities) {
            val payload = JSObject().apply {
                put("event", "capabilitiesChanged")
                put("networkId", network.networkHandle)
                put("hasInternet", capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET))
                put("hasValidated", capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED))
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                (capabilities.transportInfo as? WifiInfo)?.let { info ->
                    payload.put("ssid", info.ssid?.replace("\"", "") ?: "")
                    payload.put("rssi", info.rssi)
                    payload.put("linkSpeed", info.linkSpeed)
                }
            }

            dispatch(payload)
        }

        override fun onUnavailable() {
            dispatch(JSObject().apply { put("event", "unavailable") })
        }
    }

    // -------------------------------------------------------
    // Comando consumido por Rust via spawn_blocking
    // Bloquea hasta que hay un evento disponible (long-poll puro).
    // -------------------------------------------------------

    @Command
    fun nextWifiEvent(invoke: Invoke) {
        rustLock.withLock {
            val buffered = rustQueue.pollFirst()
            if (buffered != null) {
                invoke.resolve(buffered)
            } else {
                // Queda pendiente; dispatch() lo resolverá cuando llegue un evento
                pendingRustInvoke = invoke
            }
        }
    }

    // -------------------------------------------------------
    // Comandos — Observer (start / stop)
    // -------------------------------------------------------

    @Command
    fun startObserving(invoke: Invoke) {
        if (observerCallback != null) {
            invoke.resolve(JSObject().put("status", "already_observing"))
            return
        }

        val request = NetworkRequest.Builder()
            .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
            .build()

        connectivityManager.registerNetworkCallback(request, wifiNetworkCallback)
        observerCallback = wifiNetworkCallback
        invoke.resolve(JSObject().put("status", "started"))
    }

    @Command
    fun stopObserving(invoke: Invoke) {
        observerCallback?.let {
            connectivityManager.unregisterNetworkCallback(it)
            observerCallback = null
        }

        // Desbloquea el hilo Rust que esté esperando en nextWifiEvent
        rustLock.withLock {
            pendingRustInvoke?.reject("stopped")
            pendingRustInvoke = null
            rustQueue.clear()
        }

        invoke.resolve(JSObject().put("status", "stopped"))
    }

    // -------------------------------------------------------
    // Comandos — Control de red existente
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // Comando — Conectar a red WiFi específica (API 29+)
    // WifiNetworkSpecifier no requiere ACCESS_FINE_LOCATION
    // porque no hay escaneo: el SSID está hardcodeado.
    // Android muestra un diálogo de confirmación del sistema;
    // una vez confirmado, onAvailable vincula el proceso a la red.
    // -------------------------------------------------------

    @Command
    fun connectToNetwork(invoke: Invoke) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            invoke.reject("connectToNetwork requires Android 10 (API 29+)")
            return
        }

        val ssid = "YOUR_SSID"          // ← reemplaza con tu SSID real
        val password = "YOUR_PASSWORD"  // ← reemplaza con tu contraseña real

        val specifier = WifiNetworkSpecifier.Builder()
            .setSsid(ssid)
            .setWpa2Passphrase(password)
            .build()

        val request = NetworkRequest.Builder()
            .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
            .setNetworkSpecifier(specifier)
            .build()

        val cm = connectivityManager

        // Cancela cualquier solicitud anterior pendiente
        connectNetworkCallback?.let {
            try { cm.unregisterNetworkCallback(it) } catch (_: Exception) {}
        }

        val resolved = AtomicBoolean(false)

        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                if (resolved.compareAndSet(false, true)) {
                    cm.bindProcessToNetwork(network)
                    invoke.resolve(JSObject().put("connected", true))
                }
            }

            override fun onUnavailable() {
                if (resolved.compareAndSet(false, true)) {
                    connectNetworkCallback = null
                    invoke.reject("No se pudo conectar a la red WiFi (timeout o denegado)")
                }
            }

            override fun onLost(network: Network) {
                // Red perdida después de conectar — no re-resolvemos el invoke
            }
        }

        connectNetworkCallback = callback
        // Timeout de 30 segundos; Android llamará onUnavailable si no se conecta
        cm.requestNetwork(request, callback, 30_000)
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
