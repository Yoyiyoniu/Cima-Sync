use serde::de::DeserializeOwned;
use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};

use crate::models::*;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_wifi_interface);

pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<WifiInterface<R>> {
    #[cfg(target_os = "android")]
    let handle = api.register_android_plugin("me.rodrigoleon.wifiinterface", "NetworkBindPlugin")?;
    #[cfg(target_os = "ios")]
    let handle = api.register_ios_plugin(init_plugin_wifi_interface)?;
    Ok(WifiInterface(handle))
}

pub struct WifiInterface<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> Clone for WifiInterface<R> {
    fn clone(&self) -> Self {
        WifiInterface(self.0.clone())
    }
}

impl<R: Runtime> WifiInterface<R> {
    pub fn bind_to_wifi(&self) -> crate::Result<BindResult> {
        self.0
            .run_mobile_plugin("bindToWifi", ())
            .map_err(Into::into)
    }

    pub fn unbind_network(&self) -> crate::Result<BindResult> {
        self.0
            .run_mobile_plugin("unbindNetwork", ())
            .map_err(Into::into)
    }

    pub fn get_wifi_status(&self) -> crate::Result<WifiStatus> {
        self.0
            .run_mobile_plugin("getWifiStatus", ())
            .map_err(Into::into)
    }

    pub fn start_observing(&self) -> crate::Result<ObserveResult> {
        self.0
            .run_mobile_plugin("startObserving", ())
            .map_err(Into::into)
    }

    pub fn stop_observing(&self) -> crate::Result<ObserveResult> {
        self.0
            .run_mobile_plugin("stopObserving", ())
            .map_err(Into::into)
    }

    /// Bloquea el hilo llamante hasta que Android emite un evento WiFi.
    /// Usar siempre dentro de `tauri::async_runtime::spawn_blocking`.
    /// Devuelve Err si el observer fue detenido mientras esperaba.
    pub fn next_wifi_event(&self) -> crate::Result<WifiEvent> {
        self.0
            .run_mobile_plugin("nextWifiEvent", ())
            .map_err(Into::into)
    }

    /// Solicita conexión a una red WiFi por SSID (API 29+).
    /// Bloquea hasta que Android confirma la conexión (hasta 30 s).
    /// Usar siempre dentro de `tauri::async_runtime::spawn_blocking`.
    pub fn connect_to_network(
        &self,
        args: ConnectNetworkArgs,
    ) -> crate::Result<ConnectResult> {
        self.0
            .run_mobile_plugin("connectToNetwork", args)
            .map_err(Into::into)
    }
}
