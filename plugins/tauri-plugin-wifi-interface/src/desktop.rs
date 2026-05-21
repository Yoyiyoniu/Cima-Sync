use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<WifiInterface<R>> {
    Ok(WifiInterface(app.clone()))
}

pub struct WifiInterface<R: Runtime>(AppHandle<R>);

impl<R: Runtime> WifiInterface<R> {
    pub fn bind_to_wifi(&self) -> crate::Result<BindResult> {
        Err(crate::Error::NotSupported)
    }

    pub fn unbind_network(&self) -> crate::Result<BindResult> {
        Err(crate::Error::NotSupported)
    }

    pub fn get_wifi_status(&self) -> crate::Result<WifiStatus> {
        Err(crate::Error::NotSupported)
    }
}
