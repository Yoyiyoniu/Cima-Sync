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
}
